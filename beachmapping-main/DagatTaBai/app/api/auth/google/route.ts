import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getClientRateLimitKey,
  peekRateLimit,
  recordRateLimitHit,
} from '@/lib/utils/rate-limit';
import { getSafeInternalRedirect } from '@/lib/utils/safe-redirect';

const LOGIN_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
};

export async function GET(request: NextRequest) {
  const siteUrl = request.nextUrl.origin;
  const emailParam = request.nextUrl.searchParams.get('email')?.trim();

  const ipKey = getClientRateLimitKey(request, 'user-login-ip');
  const ipCheck = peekRateLimit(ipKey, LOGIN_RATE_LIMIT);
  const emailKey = emailParam ? getClientRateLimitKey(request, 'user-login', emailParam) : null;
  const emailCheck = emailKey ? peekRateLimit(emailKey, LOGIN_RATE_LIMIT) : null;

  if (!ipCheck.allowed || (emailCheck && !emailCheck.allowed)) {
    const retryAfter = Math.max(
      ipCheck.allowed ? 0 : ipCheck.resetInSeconds,
      emailCheck && !emailCheck.allowed ? emailCheck.resetInSeconds : 0
    );
    return NextResponse.redirect(`${siteUrl}/login?error=rate_limited&retryAfter=${retryAfter}`);
  }

  try {
    // Purge any stale verifiers or leftover OAuth cookies before starting new flow
    const cookieStore = await cookies();
    const existing = cookieStore.getAll();
    for (const c of existing) {
      if (c.name.includes('code-verifier') || c.name.includes('oauth-state')) {
        cookieStore.delete(c.name);
      }
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/api/auth/callback/google`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Supabase Google OAuth error:', error);
      const hit = recordRateLimitHit(ipKey, LOGIN_RATE_LIMIT);
      if (!hit.allowed) {
        return NextResponse.redirect(`${siteUrl}/login?error=rate_limited&retryAfter=${hit.resetInSeconds}`);
      }
      return NextResponse.redirect(`${siteUrl}/login?error=google_auth_failed`);
    }

    const redirectTarget = getSafeInternalRedirect(
      request.nextUrl.searchParams.get('redirect'),
      '/home'
    );

    const res = NextResponse.redirect(data.url);
    res.cookies.set('dtb_oauth_redirect', redirectTarget, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });
    return res;
  } catch (error) {
    console.error('Google OAuth redirect error:', error);
    const hit = recordRateLimitHit(ipKey, LOGIN_RATE_LIMIT);
    if (!hit.allowed) {
      return NextResponse.redirect(`${siteUrl}/login?error=rate_limited&retryAfter=${hit.resetInSeconds}`);
    }
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_redirect_failed`);
  }
}
