export const LIVE_VERIFICATION_MESSAGES = {
  noSignal: "We can't see anything from your camera. Make sure the lens is uncovered and try again.",
  tooDark: "It's too dark. Move to a brighter place and face the light.",
  tooBright: 'Too bright. Move away from direct light and try again.',
  blurry: 'The image is blurry. Hold your device steady and try again.',
  noFace: "We couldn't detect a person. Please face the camera and keep your whole face inside the oval.",
  multipleFaces: 'Only one person can be in the frame.',
  moveCloser: 'Move closer to the camera and try again.',
  faceOffCenter: 'Center your face in the camera and try again.',
  suspectedPhoto: "We couldn't confirm a live person. Please don't use a photo or a screen, and follow the on-screen steps.",
  challengeTimeout: "Time's up. Please try again.",
  tooManyAttempts: 'Too many attempts. Please try again later.',
  permissionDenied: 'Camera access is required to take your selfie. Please allow camera permission in your browser settings to continue. Your application cannot be submitted without a selfie.',
  noCamera: 'No camera was found. Connect a camera and try again.',
  cameraBusy: 'Your camera is being used by another app. Close it and try again.',
  cameraSettings: 'This camera cannot use the required settings. Try another camera or browser.',
  cameraEnded: 'The camera stopped. Check your camera connection and try again.',
  detectionFailed: "We couldn't process the camera image. Check your camera and try again.",
  insecureContext: 'Camera access requires a secure connection. Open this page using HTTPS or localhost.',
  serverRejected: "We couldn't verify you yet. Please try again.",
  selfieRequired: 'Please complete the live selfie check before submitting your application.',
  consent: 'Your selfie is used only to verify your application, is stored privately, and is reviewed by admins.',
} as const;

export const LIVE_VERIFICATION_THRESHOLDS = {
  sampleWidth: 160,
  sampleHeight: 120,
  minimumMeanLuminance: 25,
  maximumMeanLuminance: 240,
  minimumLuminanceDeviation: 8,
  minimumSharpnessVariance: 8,
  frameCheckDurationMs: 1500,
  frozenDurationMs: 1500,
  frozenHashSize: 16,
  faceConfidence: 0.8,
  minimumFaceWidthRatio: 0.25,
  faceStableDurationMs: 1000,
  missingFaceMessageDelayMs: 2000,
  detectionIntervalMs: 120,
  challengeTimeoutMs: 10000,
  maximumAttempts: 3,
} as const;

export const LIVE_CHALLENGES = ['blink', 'turn_left', 'turn_right', 'smile', 'open_mouth'] as const;
export type LiveChallenge = (typeof LIVE_CHALLENGES)[number];

export interface FrameAnalysis {
  meanLuminance: number;
  luminanceDeviation: number;
  sharpnessVariance: number;
  hash: string;
  tooDark: boolean;
  tooBright: boolean;
  tooFlat: boolean;
  blurry: boolean;
  valid: boolean;
}

export function analyzeFrame(imageData: Pick<ImageData, 'data' | 'width' | 'height'>): FrameAnalysis {
  const { data, width, height } = imageData;
  const luminances = new Float64Array(width * height);
  let total = 0;
  let index = 0;

  for (let pixel = 0; pixel < data.length; pixel += 4) {
    const luminance = 0.2126 * data[pixel] + 0.7152 * data[pixel + 1] + 0.0722 * data[pixel + 2];
    luminances[index++] = luminance;
    total += luminance;
  }

  const count = Math.max(1, index);
  const meanLuminance = total / count;
  let squaredDifference = 0;
  for (let i = 0; i < count; i += 1) squaredDifference += (luminances[i] - meanLuminance) ** 2;
  const luminanceDeviation = Math.sqrt(squaredDifference / count);

  let laplacianTotal = 0;
  let laplacianSquaredTotal = 0;
  let laplacianCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const position = y * width + x;
      const laplacian = 4 * luminances[position] -
        luminances[position - 1] -
        luminances[position + 1] -
        luminances[position - width] -
        luminances[position + width];
      laplacianTotal += laplacian;
      laplacianSquaredTotal += laplacian * laplacian;
      laplacianCount += 1;
    }
  }
  const laplacianMean = laplacianTotal / Math.max(1, laplacianCount);
  const sharpnessVariance = Math.max(
    0,
    laplacianSquaredTotal / Math.max(1, laplacianCount) - laplacianMean ** 2
  );

  const hashSize = LIVE_VERIFICATION_THRESHOLDS.frozenHashSize;
  let hash = '';
  for (let y = 0; y < hashSize; y += 1) {
    for (let x = 0; x < hashSize; x += 1) {
      const sampleX = Math.min(width - 1, Math.floor(((x + 0.5) * width) / hashSize));
      const sampleY = Math.min(height - 1, Math.floor(((y + 0.5) * height) / hashSize));
      hash += Math.round(luminances[sampleY * width + sampleX]).toString(16).padStart(2, '0');
    }
  }

  const tooDark = meanLuminance < LIVE_VERIFICATION_THRESHOLDS.minimumMeanLuminance;
  const tooBright = meanLuminance > LIVE_VERIFICATION_THRESHOLDS.maximumMeanLuminance;
  const tooFlat = luminanceDeviation < LIVE_VERIFICATION_THRESHOLDS.minimumLuminanceDeviation;
  const blurry = sharpnessVariance < LIVE_VERIFICATION_THRESHOLDS.minimumSharpnessVariance;
  return {
    meanLuminance,
    luminanceDeviation,
    sharpnessVariance,
    hash,
    tooDark,
    tooBright,
    tooFlat,
    blurry,
    valid: !tooDark && !tooBright && !tooFlat && !blurry,
  };
}

export function isFrozenFrame(previousHash: string | null, currentHash: string, identicalForMs: number) {
  return previousHash === currentHash && identicalForMs >= LIVE_VERIFICATION_THRESHOLDS.frozenDurationMs;
}

export function createChallengeOrder(random: () => number = Math.random): [LiveChallenge, LiveChallenge] {
  const pool = [...LIVE_CHALLENGES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [pool[0], pool[1]];
}

export interface ChallengeProgress {
  challenges: LiveChallenge[];
  completed: LiveChallenge[];
  attempts: number;
  status: 'pending' | 'passed' | 'failed' | 'retry';
}

export function completeChallenge(
  progress: ChallengeProgress,
  challenge: LiveChallenge,
  successful: boolean
): ChallengeProgress {
  if (progress.status !== 'pending' || !progress.challenges.includes(challenge)) return progress;
  if (!successful) return progress;
  const completed = progress.completed.includes(challenge)
    ? progress.completed
    : [...progress.completed, challenge];
  return {
    ...progress,
    completed,
    status: completed.length === progress.challenges.length ? 'passed' : 'pending',
  };
}

export function failChallengeAttempt(progress: ChallengeProgress): ChallengeProgress {
  const attempts = progress.attempts + 1;
  return {
    ...progress,
    attempts,
    completed: [],
    status: attempts >= LIVE_VERIFICATION_THRESHOLDS.maximumAttempts ? 'failed' : 'retry',
  };
}

export function isValidChallengeResult(
  expected: LiveChallenge[],
  actual: unknown
): actual is Array<{ challenge: LiveChallenge; completed: true; durationMs: number }> {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((result, index) =>
      result &&
      result.challenge === expected[index] &&
      LIVE_CHALLENGES.includes(result.challenge) &&
      result.completed === true &&
      Number.isFinite(result.durationMs) &&
      result.durationMs >= 100 &&
      result.durationMs <= LIVE_VERIFICATION_THRESHOLDS.challengeTimeoutMs
    );
}

export function validateNonceSession(
  session: {
    nonce_hash: string;
    expires_at: string;
    consumed_at: string | null;
    completed_at: string | null;
    status: string;
  } | null,
  nonceHash: string,
  now: number
) {
  if (!session || !nonceHash || session.nonce_hash !== nonceHash) return 'missing';
  if (session.consumed_at) return 'reused';
  if (session.completed_at) return 'reused';
  if (new Date(session.expires_at).getTime() <= now) return 'expired';
  if (session.status !== 'pending') return 'tampered';
  return 'valid';
}
