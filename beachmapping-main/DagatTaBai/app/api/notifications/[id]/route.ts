import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: 'Sign in to manage notifications.' }, { status: 401 });

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'A valid notification ID is required.' }, { status: 400 });
  }

  const body: unknown = await request.json().catch(() => null);
  const action = typeof body === 'object' && body !== null && 'action' in body
    ? body.action
    : null;
  if (action !== 'read' && action !== 'confirmed' && action !== 'unrecognized') {
    return NextResponse.json({ error: 'Choose a valid notification action.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const update = action === 'read'
    ? { read_at: now }
    : { read_at: now, response: action, responded_at: now };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('user_notifications') as any)
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id);
  if (action !== 'read') query = query.is('response', null);

  const { data, error } = await query
    .select('id, type, created_at, read_at, response, device:login_devices!user_notifications_login_device_id_fkey(browser, platform)')
    .maybeSingle();

  if (error) {
    console.error('Could not update notification:', error);
    return NextResponse.json({ error: 'Could not update this notification.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'This notification was already handled or does not exist.' }, { status: 409 });

  const notification = {
    id: data.id,
    type: data.type,
    created_at: data.created_at,
    read_at: data.read_at,
    response: data.response,
    browser: data.device?.browser || 'Browser',
    platform: data.device?.platform || 'Unknown device',
  };

  if (action === 'unrecognized') {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${request.nextUrl.origin}/reset-password`,
    });
    if (resetError) {
      console.error('Security alert recorded, but password reset email could not be sent:', resetError);
      return NextResponse.json({
        notification,
        error: 'The activity was marked as unrecognized, but the password reset email could not be sent. Please request a reset from the sign-in page.',
      }, { status: 502 });
    }
  }

  return NextResponse.json({ notification });
}
