import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/api/auth/callback/google`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
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
