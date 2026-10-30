import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

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
      return NextResponse.redirect(`${siteUrl}/login?error=google_auth_failed`);
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error('Google OAuth redirect error:', error);
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_redirect_failed`);
  }
}
