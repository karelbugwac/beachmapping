import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import cvModule from '@techstark/opencv-js';
import sharp from 'sharp';

const MODEL_FILE = 'face_detection_yunet_2023mar.onnx';
const INPUT_SIZE = 320;
const MINIMUM_FACE_RATIO = 0.2;
const MINIMUM_FACE_SCORE = 0.7;

interface FaceDetectorHandle {
  detect(image: OpenCvMat, faces: OpenCvMat): number;
  delete(): void;
}

interface OpenCvMat {
  rows: number;
  cols: number;
  data32F: Float32Array;
  delete(): void;
}

interface FaceDetectorConstructor {
  new (
    modelPath: string,
    configPath: string,
    inputSize: { width: number; height: number },
    scoreThreshold?: number,
    nmsThreshold?: number,
    topK?: number
  ): FaceDetectorHandle;
}

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

let detectorPromise: Promise<{ cv: Awaited<typeof cvModule>; detector: FaceDetectorHandle }> | null = null;

function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const cv = await Promise.resolve(cvModule);
      const detectorFactory: unknown = Reflect.get(cv, 'FaceDetectorYN');
      if (typeof detectorFactory !== 'function') {
        throw new Error('The local face detector is not available.');
      }
      const modelBytes = await readFile(path.join(process.cwd(), 'public', 'models', MODEL_FILE));
      const modelPath = `/yunet-${randomUUID()}.onnx`;
      cv.FS_createDataFile('/', modelPath.slice(1), new Uint8Array(modelBytes), true, false, false);
      const FaceDetectorYN = detectorFactory as FaceDetectorConstructor;
      const detector = new FaceDetectorYN(
        modelPath,
        '',
        new cv.Size(INPUT_SIZE, INPUT_SIZE),
        MINIMUM_FACE_SCORE,
        0.3,
        5000
      );
      return { cv, detector };
    })();
  }
  return detectorPromise;
}

export function classifyFaceBoxes(
  faces: FaceBox[],
  frameWidth: number,
  frameHeight: number
): string[] {
  if (faces.length === 0) return ['no_face'];
  if (faces.length !== 1) return ['multiple_faces'];

  const face = faces[0];
  const scale = Math.min(INPUT_SIZE / frameWidth, INPUT_SIZE / frameHeight);
  const contentWidth = frameWidth * scale;
  const contentHeight = frameHeight * scale;
  const offsetX = (INPUT_SIZE - contentWidth) / 2;
  const offsetY = (INPUT_SIZE - contentHeight) / 2;
  const centerX = (face.x + face.width / 2 - offsetX) / contentWidth;
  const centerY = (face.y + face.height / 2 - offsetY) / contentHeight;
  const widthRatio = face.width / contentWidth;
  const heightRatio = face.height / contentHeight;

  const reasons = [];
  if (face.score < MINIMUM_FACE_SCORE) reasons.push('low_face_confidence');
  if (widthRatio < MINIMUM_FACE_RATIO || heightRatio < MINIMUM_FACE_RATIO) reasons.push('face_too_small');
  if (centerX < 0.3 || centerX > 0.7 || centerY < 0.25 || centerY > 0.75) {
    reasons.push('face_off_center');
  }
  return reasons;
}

export async function detectSnapshotFaces(bytes: Buffer) {
  const metadata = await sharp(bytes, { failOn: 'error', limitInputPixels: 16_000_000 }).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Image dimensions are missing.');
  const { data: pixels, info } = await sharp(bytes, { failOn: 'error', limitInputPixels: 16_000_000 })
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 3) throw new Error('Unexpected image channel count.');

  const bgr = new Uint8Array(pixels.length);
  for (let index = 0; index < pixels.length; index += 3) {
    bgr[index] = pixels[index + 2];
    bgr[index + 1] = pixels[index + 1];
    bgr[index + 2] = pixels[index];
  }

  const { cv, detector } = await getDetector();
  const image = cv.matFromArray(info.height, info.width, cv.CV_8UC3, bgr);
  const faces = new cv.Mat();
  try {
    detector.detect(image, faces);
    const boxes: FaceBox[] = [];
    for (let row = 0; row < faces.rows; row += 1) {
      const offset = row * faces.cols;
      boxes.push({
        x: faces.data32F[offset],
        y: faces.data32F[offset + 1],
        width: faces.data32F[offset + 2],
        height: faces.data32F[offset + 3],
        score: faces.data32F[offset + 14],
      });
    }
    return classifyFaceBoxes(boxes, metadata.width, metadata.height);
  } finally {
    image.delete();
    faces.delete();
  }
}
