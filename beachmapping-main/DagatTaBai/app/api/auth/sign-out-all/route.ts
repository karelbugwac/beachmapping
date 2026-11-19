import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host')?.split(',')[0].trim() ||
    request.headers.get('host');
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
  }

  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in and try again.' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  // login_devices has no signed-out marker; remove only this authenticated user's rows.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: devicesError } = await (adminClient.from('login_devices') as any)
    .delete()
    .eq('user_id', user.id);
  if (devicesError) {
    console.error('Could not clear login device records:', devicesError.code || 'unknown');
    return NextResponse.json(
      { error: 'Could not finish signing out of all devices. Please try again.' },
      { status: 500 }
    );
  }

  const sessionClient = await createServerSupabaseClient();
  const { error: signOutError } = await sessionClient.auth.signOut({ scope: 'global' });
  if (signOutError) {
    console.error('Global sign-out failed:', signOutError.code || 'unknown');
    return NextResponse.json(
      { error: 'Could not sign out of all devices. Please try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
