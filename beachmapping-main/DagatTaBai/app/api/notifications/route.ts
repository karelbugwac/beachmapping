import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface NotificationRow {
  id: string;
  type: 'new_device_login' | 'new_location_login' | 'tour_status';
  createdat: string;
  readat: string | null;
  response: 'confirmed' | 'unrecognized' | null;
  title?: string | null;
  message?: string | null;
  actionurl?: string | null;
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
    const { data, error } = await (supabase.from('usernotifications') as any)
      .select('id, type, title, message, actionurl, createdat, readat, response, device:logindevices!user_notifications_login_device_id_fkey(browser, platform)')
      .eq('userid', user.id)
      .order('createdat', { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data)) {
      dbNotifications = data.map((notification: NotificationRow) => ({
        id: notification.id,
        type: notification.type || 'new_device_login',
        title: notification.title,
        message: notification.message,
        actionurl: notification.actionurl,
        createdat: notification.createdat,
        readat: notification.readat,
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
      locationNotifications = authUserData.user.user_metadata.location_notifications.map((item: NotificationRow & Record<string, any>) => ({
        id: item.id,
        type: 'new_location_login',
        createdat: item.createdat ?? item.created_at,
        readat: item.readat ?? item.read_at,
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
    (a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
  );

  return NextResponse.json({
    notifications: combined,
    unreadCount: combined.filter((notification) => !notification.readat).length,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
