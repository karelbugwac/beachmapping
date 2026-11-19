import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { compressImageBuffer } from '../lib/server/image-compression.ts';
import { IMAGE_UPLOAD_CONFIG } from '../lib/utils/image-upload-config.ts';
import { validateImageFile } from '../lib/utils/image-validation.ts';

test('rejects a profile image larger than 2 MB', async () => {
  const file = new File([new Uint8Array(IMAGE_UPLOAD_CONFIG.profile.maxInputBytes + 1)], 'large.jpg', {
    type: 'image/jpeg',
  });
  await assert.rejects(validateImageFile(file, 'profile'), /File is too large \(max 2 MB for profile\)/);
});

test('rejects content that is not a supported image regardless of its extension', async () => {
  const file = new File(['not an image'], 'looks-like.jpg', { type: 'image/jpeg' });
  await assert.rejects(validateImageFile(file, 'resort'), /Only JPG, PNG, or WebP files are allowed/);
});

test('compresses valid image data to a small WebP or JPEG', async () => {
  const input = await sharp({
    create: { width: 2200, height: 1400, channels: 3, background: '#8bb8c2' },
  }).png().toBuffer();
  const compressed = await compressImageBuffer(input, 'resort');
  const metadata = await sharp(compressed.buffer).metadata();

  assert.ok(compressed.buffer.byteLength < IMAGE_UPLOAD_CONFIG.resort.maxOutputBytes);
  assert.ok(['webp', 'jpeg'].includes(metadata.format || ''));
  assert.ok(metadata.width! <= IMAGE_UPLOAD_CONFIG.resort.maxWidth);
  assert.ok(metadata.height! <= IMAGE_UPLOAD_CONFIG.resort.maxHeight);
});

test('uses square 400px output for profiles and 1600px longest-side for resort photos', async () => {
  const input = await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: '#d9c9ad' },
  }).jpeg().toBuffer();
  const profile = await compressImageBuffer(input, 'profile');
  const resort = await compressImageBuffer(input, 'resort');
  const profileMetadata = await sharp(profile.buffer).metadata();
  const resortMetadata = await sharp(resort.buffer).metadata();

  assert.equal(profileMetadata.width, 400);
  assert.equal(profileMetadata.height, 400);
  assert.ok(profile.buffer.byteLength < IMAGE_UPLOAD_CONFIG.profile.maxOutputBytes);
  assert.ok(Math.max(resortMetadata.width!, resortMetadata.height!) <= 1600);
  assert.ok(resort.buffer.byteLength < IMAGE_UPLOAD_CONFIG.resort.maxOutputBytes);
});
