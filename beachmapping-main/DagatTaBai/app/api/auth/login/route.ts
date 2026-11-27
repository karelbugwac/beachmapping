import { NextRequest, NextResponse } from 'next/server';
import { loginLocalUser } from '@/lib/db/auth';
import { userLoginSchema } from '@/lib/validation/auth';
import {
  getClientRateLimitKey,
  peekRateLimit,
  recordRateLimitHit,
  clearRateLimit,
} from '@/lib/utils/rate-limit';

const LOGIN_RATE_LIMIT = {
  maxRequests: 10, // Lock after 10 failed attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
};

const IP_LOGIN_RATE_LIMIT = {
  maxRequests: 10, // Lock IP after 10 failed attempts within 15 minutes
  windowMs: 15 * 60 * 1000,
};

function formatWaitDuration(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.ceil(seconds / 60);
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = userLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid login details.' },
        { status: 400 }
      );
    }

    const emailKey = getClientRateLimitKey(request, 'user-login', parsed.data.email);
    const ipKey = getClientRateLimitKey(request, 'user-login-ip');

    const emailCheck = peekRateLimit(emailKey, LOGIN_RATE_LIMIT);
    const ipCheck = peekRateLimit(ipKey, IP_LOGIN_RATE_LIMIT);

    if (!emailCheck.allowed || !ipCheck.allowed) {
      const retryAfterSeconds = Math.max(
        emailCheck.allowed ? 0 : emailCheck.resetInSeconds,
        ipCheck.allowed ? 0 : ipCheck.resetInSeconds
      );
      const headers = !emailCheck.allowed ? emailCheck.headers : ipCheck.headers;
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please wait ${formatWaitDuration(retryAfterSeconds)} before trying again.`,
          rateLimited: true,
          retryAfterSeconds,
        },
        { status: 429, headers }
      );
    }

    const { user, error, suspendedAccount } = await loginLocalUser(parsed.data.email, parsed.data.password);
    if (error || !user) {
      const emailHit = recordRateLimitHit(emailKey, LOGIN_RATE_LIMIT);
      const ipHit = recordRateLimitHit(ipKey, IP_LOGIN_RATE_LIMIT);

      if (!emailHit.allowed || !ipHit.allowed) {
        const retryAfterSeconds = Math.max(
          emailHit.allowed ? 0 : emailHit.resetInSeconds,
          ipHit.allowed ? 0 : ipHit.resetInSeconds
        );
        const headers = !emailHit.allowed ? emailHit.headers : ipHit.headers;
        return NextResponse.json(
          {
            error: `Too many failed login attempts. Please wait ${formatWaitDuration(retryAfterSeconds)} before trying again.`,
            rateLimited: true,
            retryAfterSeconds,
          },
          { status: 429, headers }
        );
      }

      const baseError = error || 'Invalid email or password.';
      const warning =
        emailHit.remaining <= 2
          ? ` (${emailHit.remaining} attempt${emailHit.remaining === 1 ? '' : 's'} remaining before temporary lockout.)`
          : '';

      if (suspendedAccount) {
        return NextResponse.json(
          {
            error: error || 'Your account has been disabled.',
            code: 'ACCOUNT_SUSPENDED',
            reason: suspendedAccount.reason,
            reasontype: suspendedAccount.reasonType,
            suspendeduntil: suspendedAccount.suspendedUntil,
          },
          {
            status: 403,
            headers: {
              'Cache-Control': 'private, no-store, max-age=0',
              ...emailHit.headers,
            },
          }
        );
      }

      return NextResponse.json(
        {
          error: `${baseError}${warning}`,
          remainingAttempts: emailHit.remaining,
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'private, no-store, max-age=0',
            ...emailHit.headers,
          },
        }
      );
    }

    clearRateLimit(emailKey);
    clearRateLimit(ipKey);

    return NextResponse.json(
      { success: true, user },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
