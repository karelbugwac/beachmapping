import { createHash, createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import {
  LIVE_VERIFICATION_MESSAGES,
  isValidChallengeResult,
  validateNonceSession,
} from '@/lib/verification/liveVerification';
import { recordFailedLiveness } from '@/lib/verification/serverLiveness';
import { validateVerificationSnapshot } from '@/lib/verification/serverSnapshot';

const SNAPSHOT_BUCKET = 'owner-verification-snapshots';
const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getImageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return 'image/png';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}

function requestHashes(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwardedFor || request.headers.get('x-real-ip') || 'unknown';
  const hashSecret = process.env.LIVENESS_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return {
    ipHash: createHmac('sha256', hashSecret).update(address).digest('hex'),
    userAgentHash: createHash('sha256').update(request.headers.get('user-agent') || 'unknown').digest('hex'),
  };
}

export async function POST(request: Request) {
  const adminClient = createAdminClient();
  const sessionClient = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError && authError.name !== 'AuthSessionMissingError') {
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 503 });
  }
  const formData = await request.formData();
  const nonce = formData.get('nonce');
  const challengeResultsValue = formData.get('challenge_results');
  const failed = formData.get('failure') === 'true';
  const flaggedReasonsValue = formData.get('flaggedreasons');
  if (typeof nonce !== 'string' || typeof challengeResultsValue !== 'string') {
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 400 });
  }

  let challengeResults: unknown = [];
  let flaggedReasons: unknown = [];
  try {
    challengeResults = JSON.parse(challengeResultsValue);
    if (typeof flaggedReasonsValue === 'string') flaggedReasons = JSON.parse(flaggedReasonsValue);
  } catch {
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 400 });
  }
  if (
    !Array.isArray(flaggedReasons) ||
    flaggedReasons.length > 5 ||
    flaggedReasons.some((reason) => reason !== 'Virtual camera')
  ) {
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 400 });
  }

  const nonceHash = createHash('sha256').update(nonce).digest('hex');
  const { ipHash, userAgentHash } = requestHashes(request);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (adminClient.from('livenesssessions') as any)
    .select('noncehash,expiresat,consumedat,completedat,challenges,status,iphash,useragenthash,userid,attempts')
    .eq('noncehash', nonceHash)
    .maybeSingle();

  if (sessionError) {
    console.error('Unable to load owner verification session:', sessionError);
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 500 });
  }
  if (!session ||
    session.iphash !== ipHash ||
    session.useragenthash !== userAgentHash ||
    (user?.id || null) !== (session.userid || null)) {
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 400 });
  }
  const validity = validateNonceSession(session, nonceHash, Date.now());
  if (validity !== 'valid') {
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 400 });
  }

  const submittedAt = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: claimedSession, error: claimError } = await (adminClient.from('livenesssessions') as any)
    .update({ completedat: submittedAt })
    .eq('noncehash', nonceHash)
    .eq('status', 'pending')
    .is('completedat', null)
    .is('consumedat', null)
    .select('noncehash')
    .maybeSingle();
  if (claimError || !claimedSession) {
    if (claimError) console.error('Unable to claim owner verification result:', claimError);
    return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 400 });
  }

  const rejectResult = async (
    reasons: string[],
    message: string = LIVE_VERIFICATION_MESSAGES.serverRejected
  ) => {
    const recorded = await recordFailedLiveness(
      adminClient,
      session,
      submittedAt,
      submittedAt,
      reasons
    );
    if (!recorded) {
      return NextResponse.json({ error: LIVE_VERIFICATION_MESSAGES.serverRejected }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  };

  if (failed) {
    const snapshot = formData.get('snapshot');
    if (snapshot instanceof File && ALLOWED_TYPES.has(snapshot.type) && snapshot.size > 0 && snapshot.size <= MAX_SNAPSHOT_BYTES) {
      const bytes = Buffer.from(await snapshot.arrayBuffer());
      if (getImageType(bytes) === snapshot.type) {
        const result = await validateVerificationSnapshot(bytes);
        return rejectResult(result.reasons.length ? result.reasons : ['challenge_failed'], result.message);
      }
      return rejectResult(['invalid_image']);
    }
    return rejectResult(['challenge_failed']);
  }
  if (!isValidChallengeResult(session.challenges, challengeResults)) {
    return rejectResult(['invalid_challenge']);
  }

  const snapshot = formData.get('snapshot');
  if (!(snapshot instanceof File) || !ALLOWED_TYPES.has(snapshot.type) || snapshot.size < 1 || snapshot.size > MAX_SNAPSHOT_BYTES) {
    return rejectResult(['invalid_image']);
  }

  const bytes = Buffer.from(await snapshot.arrayBuffer());
  if (getImageType(bytes) !== snapshot.type) {
    return rejectResult(['invalid_image']);
  }
  const snapshotValidation = await validateVerificationSnapshot(bytes);
  if (snapshotValidation.reasons.length) {
    return rejectResult(snapshotValidation.reasons, snapshotValidation.message);
  }

  // Image checks and face detection cannot stop every spoof, including video replay.
  // A stronger server-side liveness provider can replace this check without changing the session flow.
  const path = `${nonceHash}.jpg`;
  const normalizedSnapshot = await sharp(bytes).jpeg({ quality: 80 }).toBuffer();
  const { error: uploadError } = await adminClient.storage.from(SNAPSHOT_BUCKET).upload(path, normalizedSnapshot, {
    contentType: 'image/jpeg',
    cacheControl: '0',
    upsert: false,
  });
  if (uploadError) {
    console.error('Unable to store owner verification snapshot:', uploadError);
    return rejectResult(['snapshot_storage_failed']);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateError } = await (adminClient.from('livenesssessions') as any)
    .update({
      status: 'passed',
      snapshotpath: path,
      flaggedreasons: flaggedReasons,
    })
    .eq('noncehash', nonceHash)
    .eq('completedat', submittedAt)
    .is('consumedat', null)
    .eq('status', 'pending')
    .select('noncehash')
    .maybeSingle();

  if (updateError || !updated) {
    const { error: cleanupError } = await adminClient.storage.from(SNAPSHOT_BUCKET).remove([path]);
    if (cleanupError) console.error('Unable to remove rejected owner verification snapshot:', cleanupError);
    console.error('Unable to finalize owner verification session:', updateError);
    return rejectResult(['session_update_failed']);
  }

  return NextResponse.json({ success: true, attempts: session.attempts }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
