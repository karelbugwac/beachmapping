import { createHash, createHmac, randomBytes, randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { createChallengeOrder } from '@/lib/verification/liveVerification';

const SESSION_LIFETIME_MS = 2 * 60 * 1000;
const MAX_SESSIONS_PER_HOUR = 5;

function requestHashes(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwardedFor || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const hashSecret = process.env.LIVENESS_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return {
    ipHash: createHmac('sha256', hashSecret).update(address).digest('hex'),
    userAgentHash: createHash('sha256').update(userAgent).digest('hex'),
  };
}

export async function POST(request: Request) {
  const sessionClient = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError && authError.name !== 'AuthSessionMissingError') {
    return NextResponse.json({ error: "We couldn't verify you yet. Please try again." }, { status: 503 });
  }

  const adminClient = createAdminClient();
  const { ipHash, userAgentHash } = requestHashes(request);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error: countError } = await (adminClient.from('livenesssessions') as any)
    .select('id', { count: 'exact', head: true })
    .eq('iphash', ipHash)
    .gte('createdat', since);

  if (countError) {
    console.error('Unable to check owner verification rate limit:', countError);
    return NextResponse.json({ error: "We couldn't verify you yet. Please try again." }, { status: 500 });
  }
  if ((count || 0) >= MAX_SESSIONS_PER_HOUR) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  const nonce = randomBytes(32).toString('base64url');
  const challenges = createChallengeOrder(() => randomInt(0, 1_000_000) / 1_000_000);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from('livenesssessions') as any).insert({
    noncehash: createHash('sha256').update(nonce).digest('hex'),
    iphash: ipHash,
    useragenthash: userAgentHash,
    userid: user?.id || null,
    challenges,
    expiresat: expiresAt,
    attempts: (count || 0) + 1,
  });

  if (error) {
    console.error('Unable to create owner verification session:', error);
    return NextResponse.json({ error: "We couldn't verify you yet. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ nonce, challenges, expiresAt, attempts: (count || 0) + 1 }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
