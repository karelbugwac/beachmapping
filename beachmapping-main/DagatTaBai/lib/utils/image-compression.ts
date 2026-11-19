'use client';

import {
  IMAGE_UPLOAD_CONFIG,
  type ImageUploadKind,
} from './image-upload-config';
import { validateImageFile } from './image-validation';

export interface PreparedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
}

export interface SquareCrop {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImageForUpload(
  file: File,
  kind: ImageUploadKind,
  crop?: SquareCrop
): Promise<PreparedImage> {
  await validateImageFile(file, kind);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This image could not be opened. Try a JPG, PNG, or WebP file.');
  }

  try {
    const config = IMAGE_UPLOAD_CONFIG[kind];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression is not available in this browser.');

    if (config.cropToSquare) {
      const zoom = Math.max(1, crop?.zoom ?? 1);
      const cropSize = Math.min(bitmap.width, bitmap.height) / zoom;
      const maxOffsetX = (bitmap.width - cropSize) / 2;
      const maxOffsetY = (bitmap.height - cropSize) / 2;
      const centerX = bitmap.width / 2 + (crop?.offsetX ?? 0) * maxOffsetX;
      const centerY = bitmap.height / 2 + (crop?.offsetY ?? 0) * maxOffsetY;
      canvas.width = config.maxWidth;
      canvas.height = config.maxHeight;
      context.drawImage(
        bitmap,
        centerX - cropSize / 2,
        centerY - cropSize / 2,
        cropSize,
        cropSize,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } else {
      const scale = Math.min(
        1,
        config.maxWidth / bitmap.width,
        config.maxHeight / bitmap.height
      );
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    }

    for (const type of IMAGE_UPLOAD_CONFIG.storage.allowedOutputTypes) {
      for (const quality of IMAGE_UPLOAD_CONFIG.qualitySteps) {
        const blob = await canvasToBlob(canvas, type, quality);
        if (!blob || blob.type !== type) break;
        if (blob.size < config.maxOutputBytes) {
          const extension = type === 'image/webp' ? 'webp' : 'jpg';
          const name = file.name.replace(/\.[^.]+$/, '') || 'image';
          const compressedFile = new File([blob], `${name}.${extension}`, {
            type,
            lastModified: Date.now(),
          });
          return {
            file: compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
          };
        }
      }
    }

    throw new Error('This image could not be compressed to the required size. Choose a smaller image.');
  } finally {
    bitmap.close();
  }
}
