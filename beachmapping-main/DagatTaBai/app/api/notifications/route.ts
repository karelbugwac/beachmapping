import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface NotificationRow {
  id: string;
  type: 'new_device_login' | 'new_location_login';
  created_at: string;
  read_at: string | null;
  response: 'confirmed' | 'unrecognized' | null;
  device?: { browser: string | null; platform: string | null } | null;
  browser?: string;
  platform?: string;
  location?: string | null;
  previous_location?: string | null;
}

export async function GET() {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: 'Sign in to view notifications.' }, { status: 401 });

  let dbNotifications: NotificationRow[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('user_notifications') as any)
      .select('id, type, created_at, read_at, response, device:login_devices!user_notifications_login_device_id_fkey(browser, platform)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data)) {
      dbNotifications = data.map((notification: NotificationRow) => ({
        id: notification.id,
        type: notification.type || 'new_device_login',
        created_at: notification.created_at,
        read_at: notification.read_at,
        response: notification.response,
        browser: notification.device?.browser || 'Browser',
        platform: notification.device?.platform || 'Unknown device',
      }));
    }
  } catch (err) {
    console.error('Could not load DB notifications:', err);
  }

  // Fetch location notifications from user metadata
  let locationNotifications: NotificationRow[] = [];
  try {
    const admin = createAdminClient();
    const { data: authUserData } = await admin.auth.admin.getUserById(user.id);
    if (Array.isArray(authUserData?.user?.user_metadata?.location_notifications)) {
      locationNotifications = authUserData.user.user_metadata.location_notifications.map((item: NotificationRow) => ({
        id: item.id,
        type: 'new_location_login',
        created_at: item.created_at,
        read_at: item.read_at,
        response: item.response,
        browser: item.browser || 'Browser',
        platform: item.platform || 'Unknown device',
        location: item.location,
        previous_location: item.previous_location,
      }));
    }
  } catch (err) {
    console.error('Could not load location notifications:', err);
  }

  const combined = [...dbNotifications, ...locationNotifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({
    notifications: combined,
    unreadCount: combined.filter((notification) => !notification.read_at).length,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
