import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {
  analyzeFrame,
  completeChallenge,
  failChallengeAttempt,
  isFrozenFrame,
  isValidChallengeResult,
  LIVE_VERIFICATION_MESSAGES,
  LIVE_VERIFICATION_THRESHOLDS,
  validateNonceSession,
  type ChallengeProgress,
  type LiveChallenge,
} from '../lib/verification/liveVerification';
import { classifyFaceBoxes } from '../lib/verification/serverFaceDetection';

function frame(fill: (x: number, y: number, channel: number) => number) {
  const width = 160;
  const height = 120;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      data[offset] = fill(x, y, 0);
      data[offset + 1] = fill(x, y, 1);
      data[offset + 2] = fill(x, y, 2);
      data[offset + 3] = 255;
    }
  }
  return { data, width, height };
}

test('analyzeFrame rejects black, white, and flat gray images', () => {
  assert.equal(analyzeFrame(frame(() => 0)).valid, false);
  assert.equal(analyzeFrame(frame(() => 255)).valid, false);
  assert.equal(analyzeFrame(frame(() => 120)).valid, false);
});

test('analyzeFrame accepts a normally exposed image with sensor variation', () => {
  const analysis = analyzeFrame(frame((x, y, channel) => 105 + ((x * 17 + y * 31 + channel * 7) % 70)));
  assert.equal(analysis.valid, true);
  assert.equal(analysis.blurry, false);
  assert.ok(analysis.meanLuminance >= LIVE_VERIFICATION_THRESHOLDS.minimumMeanLuminance);
  assert.ok(analysis.luminanceDeviation >= LIVE_VERIFICATION_THRESHOLDS.minimumLuminanceDeviation);
});

test('analyzeFrame rejects a soft gradient as blurry', () => {
  const analysis = analyzeFrame(frame((x, y) => 90 + Math.floor((x + y) / 8)));
  assert.equal(analysis.blurry, true);
  assert.equal(analysis.valid, false);
});

test('server face validation rejects missing, multiple, tiny, and off-center faces', () => {
  assert.deepEqual(classifyFaceBoxes([], 320, 240), ['no_face']);
  const centeredFace = { x: 100, y: 70, width: 120, height: 120, score: 0.95 };
  assert.deepEqual(classifyFaceBoxes([centeredFace, centeredFace], 320, 240), ['multiple_faces']);
  assert.deepEqual(
    classifyFaceBoxes([{ ...centeredFace, x: 145, y: 105, width: 30, height: 30 }], 320, 240),
    ['face_too_small']
  );
  assert.deepEqual(
    classifyFaceBoxes([{ ...centeredFace, x: 0 }], 320, 240),
    ['face_off_center']
  );
  assert.deepEqual(classifyFaceBoxes([centeredFace], 320, 240), []);
});

test('server YuNet detector rejects a textured image without a face', async () => {
  const pixels = Buffer.alloc(320 * 240 * 3);
  for (let index = 0; index < pixels.length; index += 1) {
    pixels[index] = (index * 37 + index % 251) % 256;
  }
  const image = await sharp(pixels, { raw: { width: 320, height: 240, channels: 3 } }).jpeg().toBuffer();
  const { detectSnapshotFaces } = await import('../lib/verification/serverFaceDetection');
  assert.deepEqual(await detectSnapshotFaces(image), ['no_face']);
});

test('identical frames are classified as frozen after the configured interval', () => {
  const hash = analyzeFrame(frame((x, y) => 80 + ((x + y) % 90))).hash;
  assert.equal(isFrozenFrame(hash, hash, 1499), false);
  assert.equal(isFrozenFrame(hash, hash, 1500), true);
});

test('challenge flow passes only after both issued challenges complete', () => {
  const challenges: LiveChallenge[] = ['blink', 'turn_left'];
  let state: ChallengeProgress = { challenges, completed: [], attempts: 0, status: 'pending' };
  state = completeChallenge(state, 'blink', true);
  assert.equal(state.status, 'pending');
  state = completeChallenge(state, 'turn_left', true);
  assert.equal(state.status, 'passed');
});

test('challenge timeout allows retries and stops at the maximum', () => {
  const initial = { challenges: ['smile', 'open_mouth'] as LiveChallenge[], completed: [] as LiveChallenge[], attempts: 0, status: 'pending' as const };
  const retry = failChallengeAttempt(initial);
  assert.equal(retry.status, 'retry');
  const resumed = completeChallenge({ ...retry, status: 'pending' }, 'smile', true);
  assert.equal(resumed.status, 'pending');
  const final = failChallengeAttempt({ ...retry, status: 'pending' });
  const exhausted = failChallengeAttempt({ ...final, status: 'pending' });
  assert.equal(exhausted.status, 'failed');
});

test('nonce validation rejects missing, tampered, expired, and reused sessions', () => {
  const base = {
    nonce_hash: 'expected',
    expires_at: new Date(5000).toISOString(),
    consumed_at: null,
    completed_at: null,
    status: 'pending',
  };
  const expected: LiveChallenge[] = ['blink', 'smile'];
  assert.equal(validateNonceSession(null, 'expected', 1000), 'missing');
  assert.equal(validateNonceSession(base, 'wrong', 1000), 'missing');
  assert.equal(validateNonceSession(base, 'expected', 5000), 'expired');
  assert.equal(
    validateNonceSession({ ...base, consumed_at: new Date(1000).toISOString() }, 'expected', 1000),
    'reused'
  );
  assert.equal(
    validateNonceSession({ ...base, completed_at: new Date(1000).toISOString() }, 'expected', 1000),
    'reused'
  );
  assert.equal(validateNonceSession(base, 'expected', 1000), 'valid');
  assert.equal(isValidChallengeResult(expected, [
    { challenge: 'blink', completed: true, durationMs: 1200 },
    { challenge: 'turn_right', completed: true, durationMs: 900 },
  ]), false);
  assert.equal(isValidChallengeResult(expected, [
    { challenge: 'blink', completed: true, durationMs: 1200 },
    { challenge: 'smile', completed: true, durationMs: 900 },
  ]), true);
});

test('camera permission denial and selfie requirement use clear user-facing messages', () => {
  assert.equal(
    LIVE_VERIFICATION_MESSAGES.permissionDenied,
    'Camera access is required to take your selfie. Please allow camera permission in your browser settings to continue. Your application cannot be submitted without a selfie.'
  );
  assert.match(LIVE_VERIFICATION_MESSAGES.selfieRequired, /selfie check before submitting/i);
});
