'use client';

import { createClient } from '@/lib/supabase/client';

export const MAX_BEACH_IMAGE_SIZE_BYTES = 20 * 1024 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const supportedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

async function compressBeachImage(file: File): Promise<File> {
  if (!supportedImageTypes.has(file.type.toLowerCase())) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size < 1 || file.size > MAX_BEACH_IMAGE_SIZE_BYTES) {
    throw new Error('Image files must be larger than 0 bytes and no larger than 20 GB.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be opened. Try a JPG, PNG, or WebP file.');
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression is not available in this browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const outputType of ['image/webp', 'image/jpeg']) {
      for (const quality of [0.86, 0.76, 0.66, 0.56, 0.46]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, outputType, quality)
        );
        if (blob && blob.size <= MAX_COMPRESSED_IMAGE_SIZE_BYTES && blob.type === outputType) {
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'beach-image';
          const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
          return new File([blob], `${baseName}.${extension}`, {
            type: outputType,
            lastModified: Date.now(),
          });
        }
      }
    }

    throw new Error('This image could not be compressed below 5 MB. Choose a smaller image.');
  } finally {
    bitmap.close();
  }
}

export async function uploadBeachImageWithPath(
  file: File,
  beachId: string,
  folder?: string
): Promise<{ imageUrl: string; storagePath: string }> {
  const compressedFile = await compressBeachImage(file);
  const supabase = createClient();
  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] =
    await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);
  if (sessionError) throw sessionError;
  if (userError) throw userError;
  if (!sessionData.session || !userData.user) {
    throw new Error('Please sign in again before uploading images.');
  }

  const objectName = [
    userData.user.id,
    beachId || 'general',
    folder,
    `${crypto.randomUUID()}.${compressedFile.type === 'image/webp' ? 'webp' : 'jpg'}`,
  ].filter(Boolean).join('/');
  const { error: uploadError } = await supabase.storage
    .from('beach-media')
    .upload(objectName, compressedFile, {
      cacheControl: '3600',
      contentType: compressedFile.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  return {
    imageUrl: supabase.storage.from('beach-media').getPublicUrl(objectName).data.publicUrl,
    storagePath: objectName,
  };
}

export async function uploadBeachImage(
  file: File,
  beachId: string,
  folder?: string
): Promise<string> {
  const uploaded = await uploadBeachImageWithPath(file, beachId, folder);
  return uploaded.imageUrl;
}
