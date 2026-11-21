import sharp from 'sharp';
import {
  IMAGE_UPLOAD_CONFIG,
  type ImageUploadKind,
} from '@/lib/utils/image-upload-config';
import { detectImageMime } from '@/lib/utils/image-validation';

export async function compressImageBuffer(
  input: Buffer,
  kind: ImageUploadKind
): Promise<{ buffer: Buffer; mimeType: 'image/webp' | 'image/jpeg'; extension: 'webp' | 'jpg' }> {
  if (!detectImageMime(input.subarray(0, 12))) {
    throw new Error('Only JPG, PNG, or WebP files are allowed.');
  }

  const config = IMAGE_UPLOAD_CONFIG[kind];
  const transformer = sharp(input, { failOn: 'error' }).rotate();
  const resizeOptions = config.cropToSquare
    ? { width: config.maxWidth, height: config.maxHeight, fit: 'cover' as const }
    : { width: config.maxWidth, height: config.maxHeight, fit: 'inside' as const, withoutEnlargement: true };

  for (const type of IMAGE_UPLOAD_CONFIG.storage.allowedOutputTypes) {
    try {
      for (const quality of IMAGE_UPLOAD_CONFIG.qualitySteps) {
        const pipeline = transformer.clone().resize(resizeOptions);
        const qualityPercent = Math.round(quality * 100);
        const output = type === 'image/webp'
          ? await pipeline.webp({ quality: qualityPercent, effort: 4 }).toBuffer()
          : await pipeline.jpeg({ quality: qualityPercent, mozjpeg: true }).toBuffer();
        if (output.byteLength < config.maxOutputBytes) {
          return {
            buffer: output,
            mimeType: type,
            extension: type === 'image/webp' ? 'webp' : 'jpg',
          };
        }
      }
    } catch (error) {
      if (type === 'image/jpeg') throw error;
    }
  }

  throw new Error('This image could not be compressed to the required size.');
}
