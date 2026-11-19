'use client';

import { createClient } from '@/lib/supabase/client';
import { generateUUID } from '@/lib/utils/uuid';
import { formatImageSize } from '@/lib/utils/image-upload-config';
import { prepareImageForUpload } from '@/lib/utils/image-compression';

export const MAX_BEACH_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const BEACH_MEDIA_BUCKET = 'beach-media';

export interface ImageUploadSizes {
  originalSize: number;
  compressedSize: number;
}

function uploadWithProgress(
  url: string,
  apiKey: string,
  accessToken: string,
  file: File,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The upload was cancelled.', 'AbortError'));
      return;
    }

    const request = new XMLHttpRequest();
    const abortUpload = () => request.abort();
    const cleanup = () => signal?.removeEventListener('abort', abortUpload);
    request.open('POST', url);
    request.setRequestHeader('apikey', apiKey);
    request.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    request.setRequestHeader('cache-control', 'max-age=31536000');
    request.setRequestHeader('content-type', file.type);
    request.setRequestHeader('x-upsert', 'false');
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      cleanup();
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(request.responseText || `Image upload failed (${request.status}).`));
      }
    };
    request.onerror = () => {
      cleanup();
      reject(new Error('Network error while uploading the image.'));
    };
    request.onabort = () => {
      cleanup();
      reject(new DOMException('The upload was cancelled.', 'AbortError'));
    };
    signal?.addEventListener('abort', abortUpload, { once: true });
    request.send(file);
  });
}

export async function uploadBeachImageWithPath(
  file: File,
  beachId: string,
  folder?: string,
  signal?: AbortSignal,
  onCompressed?: (sizes: ImageUploadSizes) => void,
  onProgress?: (progress: number) => void
): Promise<{ imageUrl: string; storagePath: string; sizes: ImageUploadSizes }> {
  const prepared = await prepareImageForUpload(file, 'resort');
  const sizes = {
    originalSize: prepared.originalSize,
    compressedSize: prepared.compressedSize,
  };
  onCompressed?.(sizes);
  if (signal?.aborted) throw new DOMException('The upload was cancelled.', 'AbortError');

  const supabase = createClient();
  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] =
    await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);
  if (sessionError) throw sessionError;
  if (userError) throw userError;
  if (!sessionData.session || !userData.user) {
    throw new Error('Please sign in again before uploading images.');
  }

  const extension = prepared.file.type === 'image/webp' ? 'webp' : 'jpg';
  const storagePath = [
    userData.user.id,
    beachId || 'general',
    folder,
    `${generateUUID()}.${extension}`,
  ].filter(Boolean).join('/');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase image storage is not configured.');
  }

  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
  try {
    onProgress?.(0);
    await uploadWithProgress(
      `${supabaseUrl}/storage/v1/object/${BEACH_MEDIA_BUCKET}/${encodedPath}`,
      anonKey,
      sessionData.session.access_token,
      prepared.file,
      signal,
      onProgress
    );
  } catch (error) {
    const { error: cleanupError } = await supabase.storage
      .from(BEACH_MEDIA_BUCKET)
      .remove([storagePath]);
    if (cleanupError) {
      console.error('Failed to clean up an incomplete beach photo upload:', cleanupError);
    }
    throw error;
  }

  return {
    imageUrl: supabase.storage.from(BEACH_MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl,
    storagePath,
    sizes,
  };
}

export async function uploadBeachImage(
  file: File,
  beachId: string,
  folder?: string,
  onCompressed?: (sizes: ImageUploadSizes) => void,
  onProgress?: (progress: number) => void
): Promise<string> {
  const uploaded = await uploadBeachImageWithPath(
    file,
    beachId,
    folder,
    undefined,
    onCompressed,
    onProgress
  );
  return uploaded.imageUrl;
}

export async function removeBeachImageByPath(storagePath: string): Promise<void> {
  const supabase = createClient();
  const { error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const { error } = await supabase.storage.from(BEACH_MEDIA_BUCKET).remove([storagePath]);
  if (error) throw error;
}

export function formatUploadSizeSummary(sizes: ImageUploadSizes): string {
  return `${formatImageSize(sizes.originalSize)} → ${formatImageSize(sizes.compressedSize)}`;
}
