export type ImageUploadKind = 'profile' | 'resort';

export const IMAGE_UPLOAD_CONFIG = {
  profile: {
    maxInputBytes: 2 * 1024 * 1024,
    maxOutputBytes: 100 * 1024,
    maxWidth: 400,
    maxHeight: 400,
    cropToSquare: true,
  },
  resort: {
    maxInputBytes: 10 * 1024 * 1024,
    maxOutputBytes: 300 * 1024,
    maxWidth: 1600,
    maxHeight: 1600,
    cropToSquare: false,
  },
  storage: {
    avatarsMaxBytes: 500 * 1024,
    resortPhotosMaxBytes: 1024 * 1024,
    allowedOutputTypes: ['image/webp', 'image/jpeg'] as const,
  },
  maxPhotosPerItem: 10,
  qualitySteps: [0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35],
} as const;

export function formatImageSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
