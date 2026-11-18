'use client';

import { createClient } from '@/lib/supabase/client';
import { generateUUID } from '@/lib/utils/uuid';

export const MAX_BEACH_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB max input as advised by IT experts
const MAX_COMPRESSED_IMAGE_SIZE_BYTES = 350 * 1024; // Target compressed size strictly in KB
const MAX_IMAGE_WIDTH = 1600;
const supportedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

async function compressBeachImage(file: File): Promise<File> {
  if (!supportedImageTypes.has(file.type.toLowerCase())) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size < 1 || file.size > MAX_BEACH_IMAGE_SIZE_BYTES) {
    throw new Error('Image files must be larger than 0 bytes and no larger than 10 MB.');
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

    // Prefer WebP compression first for maximum storage savings in KB
    for (const outputType of ['image/webp', 'image/jpeg']) {
      for (const quality of [0.82, 0.72, 0.62, 0.52]) {
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

    // Fallback: take best WebP effort
    const finalBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.55)
    );
    if (finalBlob) {
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'beach-image';
      return new File([finalBlob], `${baseName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      });
    }

    throw new Error('This image could not be compressed. Choose a smaller image.');
  } finally {
    bitmap.close();
  }
}

export async function uploadBeachImageWithPath(
  file: File,
  beachId: string,
  folder?: string,
  signal?: AbortSignal
): Promise<{ imageUrl: string; storagePath: string }> {
  const compressedFile = await compressBeachImage(file);
  if (signal?.aborted) throw new DOMException('The upload was cancelled.', 'AbortError');
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
    `${generateUUID()}.${compressedFile.type === 'image/webp' ? 'webp' : 'jpg'}`,
  ].filter(Boolean).join('/');
  if (signal) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    const encodedPath = objectName.split('/').map(encodeURIComponent).join('/');
    try {
      const response = await fetch(`${supabaseUrl}/storage/v1/object/beach-media/${encodedPath}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'cache-control': 'public, max-age=31536000, immutable',
          'content-type': compressedFile.type,
          'x-upsert': 'false',
        },
        body: compressedFile,
        signal,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Image upload failed (${response.status}).`);
      }
    } catch (error) {
      if (signal.aborted) {
        try {
          const cleanupResponse = await fetch(`${supabaseUrl}/storage/v1/object/beach-media/${encodedPath}`, {
            method: 'DELETE',
            headers: { apikey: anonKey, Authorization: `Bearer ${sessionData.session.access_token}` },
          });
          if (!cleanupResponse.ok) {
            console.error('Failed to clean up a cancelled cottage photo upload:', await cleanupResponse.text());
          }
        } catch (cleanupError) {
          console.error('Failed to clean up a cancelled cottage photo upload:', cleanupError);
        }
      }
      throw error;
    }
  } else {
    const { error: uploadError } = await supabase.storage
      .from('beach-media')
      .upload(objectName, compressedFile, {
        cacheControl: '31536000',
        contentType: compressedFile.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;
  }

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

export async function removeBeachImageByPath(storagePath: string): Promise<void> {
  const supabase = createClient();
  const { error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const { error } = await supabase.storage.from('beach-media').remove([storagePath]);
  if (error) throw error;
}
