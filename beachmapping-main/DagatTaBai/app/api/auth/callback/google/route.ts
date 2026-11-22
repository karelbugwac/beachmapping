import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getClientRateLimitKey,
  peekRateLimit,
  recordRateLimitHit,
  clearRateLimit,
} from '@/lib/utils/rate-limit';
import { getSafeInternalRedirect } from '@/lib/utils/safe-redirect';

const LOGIN_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const siteUrl = request.nextUrl.origin;
  const ipKey = getClientRateLimitKey(request, 'user-login-ip');

  const ipCheck = peekRateLimit(ipKey, LOGIN_RATE_LIMIT);
  if (!ipCheck.allowed) {
    return NextResponse.redirect(`${siteUrl}/login?error=rate_limited&retryAfter=${ipCheck.resetInSeconds}`);
  }

  if (!code) {
    const hit = recordRateLimitHit(ipKey, LOGIN_RATE_LIMIT);
    if (!hit.allowed) {
      return NextResponse.redirect(`${siteUrl}/login?error=rate_limited&retryAfter=${hit.resetInSeconds}`);
    }
    return NextResponse.redirect(`${siteUrl}/login?error=no_auth_code`);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Supabase code exchange error:', error);
      const hit = recordRateLimitHit(ipKey, LOGIN_RATE_LIMIT);
      if (!hit.allowed) {
        return NextResponse.redirect(`${siteUrl}/login?error=rate_limited&retryAfter=${hit.resetInSeconds}`);
      }
      return NextResponse.redirect(`${siteUrl}/login?error=code_exchange_failed`);
    }

    const userEmail = data.user.email;
    const emailKey = userEmail ? getClientRateLimitKey(request, 'user-login', userEmail) : null;
    const emailCheck = emailKey ? peekRateLimit(emailKey, LOGIN_RATE_LIMIT) : null;

    if (emailCheck && !emailCheck.allowed) {
      await supabase.auth.signOut().catch(() => {});
      return NextResponse.redirect(`${siteUrl}/login?error=rate_limited&retryAfter=${emailCheck.resetInSeconds}`);
    }

    clearRateLimit(ipKey);
    if (emailKey) clearRateLimit(emailKey);

    // Clean up temporary OAuth code-verifier and state cookies to prevent header bloat
    let oauthRedirect: string | null = null;
    try {
      const cookieStore = await cookies();
      // Try to get redirect from cookies first (for server-initiated flows)
      oauthRedirect = cookieStore.get('dtb_oauth_redirect')?.value ?? null;
      const allCookies = cookieStore.getAll();
      for (const c of allCookies) {
        if (c.name.includes('code-verifier') || c.name.includes('oauth-state') || c.name === 'dtb_oauth_redirect') {
          cookieStore.delete(c.name);
        }
      }
    } catch {
      // Best-effort cookie cleanup
    }

    // If no cookie redirect, check sessionStorage via a small client-side script
    // For now, we'll use a fallback - the client will handle the final redirect
    if (!oauthRedirect) {
      oauthRedirect = '/home'; // Default fallback
    }

    // Check if user exists in profiles table (should be auto-created by trigger)
    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('id, accountstatus, status, suspendeduntil, suspensionendsat, profileimageurl')
      .eq('id', data.user.id)
      .maybeSingle();

    // If profile doesn't exist, create it (fallback in case trigger failed)
    if (!profile || profileError) {
      try {
        const { error: upsertError } = await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          fullname: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email,
          profileimageurl: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          role: 'user',
          updatedat: new Date().toISOString(),
        });

        if (upsertError) {
          console.error('Profile upsert error:', upsertError);
          // If profileimageurl column doesn't exist yet, try without it
          console.warn('Retrying without profileimageurl');
          const { error: retryError } = await (supabase.from('profiles') as any).upsert({
            id: data.user.id,
            fullname: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email,
            role: 'user',
            updatedat: new Date().toISOString(),
          });

          if (retryError) {
            console.error('Retry upsert error:', retryError);
          }
        }
      } catch (err) {
        console.error('Profile creation exception:', err);
      }
    } else {
      // Check if account is suspended
      const accountStatus = profile.accountstatus || profile.status || 'active';
      const suspendedUntil = profile.suspendeduntil || profile.suspensionendsat || null;
      const isSuspensionActive = accountStatus === 'suspended' && (!suspendedUntil || new Date(suspendedUntil) > new Date());
      
      if (isSuspensionActive) {
        await supabase.auth.signOut().catch(() => {});
        return NextResponse.redirect(`${siteUrl}/login?error=account_suspended`);
      }

      // Update profile if metadata has changed
      if (data.user.user_metadata?.avatar_url && (!profile.profileimageurl)) {
        try {
          await (supabase.from('profiles') as any).update({
            profileimageurl: data.user.user_metadata.avatar_url,
            updatedat: new Date().toISOString(),
          }).eq('id', data.user.id);
        } catch (err) {
          console.warn('Profile image update failed:', err);
        }
      }
    }

    // Determine redirect - always go to /home for regular users
    // Admin/owner/staff have their own separate login flows
    const target = getSafeInternalRedirect(oauthRedirect, '/home');
    return NextResponse.redirect(`${siteUrl}${target}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_processing_error`);
  }
}
