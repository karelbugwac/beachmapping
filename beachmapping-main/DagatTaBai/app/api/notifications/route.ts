import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface NotificationRow {
  id: string;
  type: 'new_device_login';
  created_at: string;
  read_at: string | null;
  response: 'confirmed' | 'unrecognized' | null;
  device: { browser: string | null; platform: string | null } | null;
}

export async function GET() {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: 'Sign in to view notifications.' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('user_notifications') as any)
    .select('id, type, created_at, read_at, response, device:login_devices!user_notifications_login_device_id_fkey(browser, platform)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Could not load notifications:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return NextResponse.json({
        error: 'Notifications are not set up in Supabase yet. Apply the 20261104_login_device_notifications.sql migration.',
      }, { status: 503 });
    }
    return NextResponse.json({ error: error.message || 'Could not load notifications.' }, { status: 500 });
  }

  const notifications = (data || []).map((notification: NotificationRow) => ({
    id: notification.id,
    type: notification.type,
    created_at: notification.created_at,
    read_at: notification.read_at,
    response: notification.response,
    browser: notification.device?.browser || 'Browser',
    platform: notification.device?.platform || 'Unknown device',
  }));
  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((notification: { read_at: string | null }) => !notification.read_at).length,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
