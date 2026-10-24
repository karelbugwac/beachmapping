import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=no_auth_code`);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Supabase code exchange error:', error);
      return NextResponse.redirect(`${siteUrl}/login?error=code_exchange_failed`);
    }

    const isPlatformAdmin = data.user.email?.toLowerCase() === 'official.dagattabai@gmail.com';

    // Check if user exists in profiles table (should be auto-created by trigger)
    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    // If profile doesn't exist, create it (fallback in case trigger failed)
    if (!profile || profileError) {
      try {
        const { error: upsertError } = await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          full_name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email,
          profile_image_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          role: isPlatformAdmin ? 'admin' : 'user',
          updated_at: new Date().toISOString(),
        });

        if (upsertError) {
          console.error('Profile upsert error:', upsertError);
          // If profile_image_url column doesn't exist yet, try without it
          console.warn('Retrying without profile_image_url');
          const { error: retryError } = await (supabase.from('profiles') as any).upsert({
            id: data.user.id,
            full_name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email,
            role: isPlatformAdmin ? 'admin' : 'user',
            updated_at: new Date().toISOString(),
          });

          if (retryError) {
            console.error('Retry upsert error:', retryError);
          }
        }
      } catch (err) {
        console.error('Profile creation exception:', err);
      }
    } else {
      if (isPlatformAdmin && profile.role !== 'admin') {
        await (createAdminClient().from('profiles') as any)
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }
      // Update profile if metadata has changed
      if (data.user.user_metadata?.avatar_url && (!profile.profile_image_url)) {
        try {
          await (supabase.from('profiles') as any).update({
            profile_image_url: data.user.user_metadata.avatar_url,
            updated_at: new Date().toISOString(),
          }).eq('id', data.user.id);
        } catch (err) {
          console.warn('Profile image update failed:', err);
        }
      }
    }

    return NextResponse.redirect(`${siteUrl}/`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_processing_error`);
  }
}
