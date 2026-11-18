'use client';

/**
 * High-performance client-side image compression and WebP conversion.
 * 
 * Target Architecture:
 * - Profile Avatar: Max 2MB input -> Resized to 400x400 WebP -> ~25KB-50KB output
 * - Beach/Gallery Photos: Max 10MB input -> Resized to max 1600px WebP -> ~150KB-350KB output
 * 
 * Ensures images are strictly compressed to KB before transmission to prevent database bloat.
 */

export interface ImageCompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.80)
  maxInputSizeBytes?: number; // Enforced maximum before compression
}

export const AVATAR_MAX_INPUT_BYTES = 2 * 1024 * 1024; // 2MB
export const GALLERY_MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10MB

export const DEFAULT_AVATAR_OPTIONS: ImageCompressOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.82,
  maxInputSizeBytes: AVATAR_MAX_INPUT_BYTES,
};

export const DEFAULT_BEACH_PHOTO_OPTIONS: ImageCompressOptions = {
  maxWidth: 1600,
  maxHeight: 1200,
  quality: 0.80,
  maxInputSizeBytes: GALLERY_MAX_INPUT_BYTES,
};

/**
 * Compresses any File (JPG, PNG, WebP) to a lightweight WebP File strictly in KB.
 */
export async function compressImageToWebP(
  file: File,
  options: ImageCompressOptions = DEFAULT_BEACH_PHOTO_OPTIONS
): Promise<File> {
  const maxBytes = options.maxInputSizeBytes ?? GALLERY_MAX_INPUT_BYTES;
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${maxMB}MB.`);
  }

  // Load image bitmap
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Could not open image file. Please provide a valid JPG, PNG, or WebP image.');
  }

  try {
    const maxW = options.maxWidth || 1600;
    const maxH = options.maxHeight || 1200;

    let width = bitmap.width;
    let height = bitmap.height;

    // Calculate aspect-ratio preserved dimensions
    if (width > maxW || height > maxH) {
      if (width / height > maxW / maxH) {
        height = Math.max(1, Math.round((height * maxW) / width));
        width = maxW;
      } else {
        width = Math.max(1, Math.round((width * maxH) / height));
        height = maxH;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available.');
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    // Iteratively adjust quality if needed to ensure file is small (in KB)
    const qualities = [options.quality ?? 0.80, 0.70, 0.60, 0.50];
    let selectedBlob: Blob | null = null;

    for (const q of qualities) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', q);
      });

      if (blob) {
        selectedBlob = blob;
        // If below 400KB, it is optimal
        if (blob.size <= 400 * 1024) {
          break;
        }
      }
    }

    if (!selectedBlob) {
      throw new Error('Failed to compress image into WebP format.');
    }

    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    return new File([selectedBlob], `${cleanBaseName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
