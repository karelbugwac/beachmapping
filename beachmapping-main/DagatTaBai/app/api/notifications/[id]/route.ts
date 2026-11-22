import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

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
    ? (body as { action: unknown }).action
    : null;
  if (action !== 'read' && action !== 'confirmed' && action !== 'unrecognized' && action !== 'logout_device') {
    return NextResponse.json({ error: 'Choose a valid notification action.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const update = action === 'read' || action === 'logout_device'
    ? { readat: now }
    : { readat: now, response: action, respondedat: now };

  // 1. Try updating database table first
  let dbNotification: any = null;
  try {
    const supabase = await createServerSupabaseClient();
    let query = (supabase.from('usernotifications') as any)
      .update(update)
      .eq('id', id)
      .eq('userid', user.id);
    if (action !== 'read') query = query.is('response', null).neq('type', 'tour_status');

    const { data } = await query
      .select('id, type, title, message, actionurl, createdat, readat, response, device:logindevices!user_notifications_login_device_id_fkey(browser, platform)')
      .maybeSingle();

    if (data) {
      dbNotification = {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        actionurl: data.actionurl,
        createdat: data.createdat,
        readat: data.readat,
        response: data.response,
        browser: data.device?.browser || 'Browser',
        platform: data.device?.platform || 'Unknown device',
      };
    }
  } catch (err) {
    console.warn('DB notification update bypassed:', err);
  }

  if (dbNotification) {
    if (action === 'unrecognized') {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${request.nextUrl.origin}/reset-password`,
      });
    }
    if (action === 'logout_device') {
      // Delete the login device associated with this notification
      try {
        const admin = createAdminClient();
        const { data: authUserData } = await admin.auth.admin.getUserById(user.id);
        const metadata = authUserData?.user?.user_metadata || {};
        const loginDevices: any[] = Array.isArray(metadata.login_devices)
          ? [...metadata.login_devices]
          : [];
        
        // Find and remove the device that matches this notification
        const filteredDevices = loginDevices.filter((device: any) => {
          // Match by checking if device login matches notification timestamp
          return !(device.login_at === dbNotification.createdat);
        });
        
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...metadata,
            login_devices: filteredDevices,
          },
        });
      } catch (err) {
        console.warn('Failed to remove login device:', err);
      }
    }
    return NextResponse.json({ notification: dbNotification });
  }

  // 2. Check and update location notifications in user metadata
  try {
    const admin = createAdminClient();
    const { data: authUserData } = await admin.auth.admin.getUserById(user.id);
    const metadata = authUserData?.user?.user_metadata || {};
    const locationNotifications: any[] = Array.isArray(metadata.location_notifications)
      ? [...metadata.location_notifications]
      : [];

    const targetIdx = locationNotifications.findIndex((item) => item.id === id);
    if (targetIdx !== -1) {
      const existing = locationNotifications[targetIdx];
      const updatedItem = {
        ...existing,
        readat: now,
        response: action === 'read' ? existing.response : action,
        respondedat: action === 'read' ? (existing.respondedat ?? existing.responded_at ?? null) : now,
      };

      locationNotifications[targetIdx] = updatedItem;

      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          location_notifications: locationNotifications,
        },
      });

      if (action === 'unrecognized') {
        const supabase = await createServerSupabaseClient();
        await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${request.nextUrl.origin}/reset-password`,
        });
      }

      return NextResponse.json({ notification: updatedItem });
    }
  } catch (err) {
    console.error('Location notification update failed:', err);
  }

  return NextResponse.json({ error: 'Notification was already handled or not found.' }, { status: 404 });
}
