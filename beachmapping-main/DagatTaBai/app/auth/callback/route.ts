import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSafeInternalRedirect } from '@/lib/utils/safe-redirect';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = getSafeInternalRedirect(request.nextUrl.searchParams.get('next'));

  if (!code) return NextResponse.redirect(new URL('/login?error=no_auth_code', request.url));

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error('Supabase OAuth callback failed:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_exchange_failed', request.url));
  }
}