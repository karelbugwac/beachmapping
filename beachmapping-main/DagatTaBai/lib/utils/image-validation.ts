import { IMAGE_UPLOAD_CONFIG, type ImageUploadKind } from './image-upload-config';

export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export function detectImageMime(bytes: Uint8Array): SupportedImageMime | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export async function validateImageFile(
  file: File,
  kind: ImageUploadKind
): Promise<SupportedImageMime> {
  const config = IMAGE_UPLOAD_CONFIG[kind];
  if (file.size < 1) throw new Error('The selected image is empty.');
  if (file.size > config.maxInputBytes) {
    const limit = kind === 'profile' ? '2 MB for profile' : '10 MB per image';
    throw new Error(`File is too large (max ${limit}).`);
  }

  const prefix = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const actualMime = detectImageMime(prefix);
  if (!actualMime) {
    throw new Error('Only JPG, PNG, or WebP files are allowed.');
  }

  const declaredMime = file.type.toLowerCase();
  if (
    declaredMime.startsWith('image/') &&
    declaredMime !== actualMime &&
    !(declaredMime === 'image/jpg' && actualMime === 'image/jpeg')
  ) {
    throw new Error('The image content does not match its file type.');
  }

  return actualMime;
}
