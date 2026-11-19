import sharp, { type Metadata, type OutputInfo } from 'sharp';
import {
  analyzeFrame,
  LIVE_VERIFICATION_MESSAGES,
} from '@/lib/verification/liveVerification';
import { detectSnapshotFaces } from '@/lib/verification/serverFaceDetection';

export async function validateVerificationSnapshot(bytes: Buffer) {
  let metadata: Metadata;
  try {
    metadata = await sharp(bytes, { failOn: 'error', limitInputPixels: 16_000_000 }).metadata();
  } catch {
    return { reasons: ['invalid_image'], message: LIVE_VERIFICATION_MESSAGES.serverRejected };
  }
  if (!metadata.width || !metadata.height || metadata.width < 320 || metadata.height < 240) {
    return { reasons: ['tiny_image'], message: LIVE_VERIFICATION_MESSAGES.serverRejected };
  }

  let pixels: { data: Buffer; info: OutputInfo };
  try {
    pixels = await sharp(bytes, { failOn: 'error', limitInputPixels: 16_000_000 })
      .resize(160, 120, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { reasons: ['invalid_image'], message: LIVE_VERIFICATION_MESSAGES.serverRejected };
  }

  const analysis = analyzeFrame({
    data: new Uint8ClampedArray(pixels.data),
    width: pixels.info.width,
    height: pixels.info.height,
  });
  const reasons: string[] = [];
  let message: string = LIVE_VERIFICATION_MESSAGES.serverRejected;
  if (analysis.meanLuminance < 5) {
    reasons.push('black_frame');
    message = LIVE_VERIFICATION_MESSAGES.noSignal;
  } else if (analysis.tooDark) {
    reasons.push('too_dark');
    message = LIVE_VERIFICATION_MESSAGES.tooDark;
  } else if (analysis.tooBright) {
    reasons.push('too_bright');
    message = LIVE_VERIFICATION_MESSAGES.tooBright;
  }
  if (analysis.tooFlat) reasons.push('uniform_frame');
  if (analysis.blurry) {
    reasons.push('blurry');
    if (!analysis.tooDark && !analysis.tooBright) message = LIVE_VERIFICATION_MESSAGES.blurry;
  }
  if (!reasons.length) {
    try {
      reasons.push(...await detectSnapshotFaces(bytes));
    } catch (error: unknown) {
      console.error(
        'Live verification face detection failed:',
        error instanceof Error ? error.message : 'unknown error'
      );
      reasons.push('face_detector_unavailable');
      message = LIVE_VERIFICATION_MESSAGES.serverRejected;
    }
  }
  if (reasons.includes('no_face')) message = LIVE_VERIFICATION_MESSAGES.noFace;
  if (reasons.includes('multiple_faces')) message = LIVE_VERIFICATION_MESSAGES.multipleFaces;
  if (reasons.includes('face_too_small')) message = LIVE_VERIFICATION_MESSAGES.moveCloser;
  if (reasons.includes('face_off_center')) message = LIVE_VERIFICATION_MESSAGES.faceOffCenter;
  return { reasons, message };
}
