import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

function describeBrowser(userAgent: string): { browser: string; platform: string } {
  let browser = 'Browser';
  if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('OPR/')) browser = 'Opera';
  else if (userAgent.includes('CriOS/')) browser = 'Chrome';
  else if (userAgent.includes('FxiOS/')) browser = 'Firefox';
  else if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Safari/')) browser = 'Safari';
  const platform = /iPhone|iPad|iPod/i.test(userAgent)
    ? 'iOS'
    : /Android/i.test(userAgent)
      ? 'Android'
      : /Windows/i.test(userAgent)
        ? 'Windows'
        : /Macintosh|Mac OS/i.test(userAgent)
          ? 'macOS'
          : /Linux/i.test(userAgent)
            ? 'Linux'
            : 'Unknown device';

  return { browser, platform };
}

export async function POST(request: NextRequest) {
  const user = await getCurrentSession();
  if (!user) return NextResponse.json({ error: 'Sign in to register this device.' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const deviceId = typeof body === 'object' && body !== null && 'deviceId' in body
    ? (body as { deviceId: unknown }).deviceId
    : null;
  if (typeof deviceId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deviceId)) {
    return NextResponse.json({ error: 'A valid device identifier is required.' }, { status: 400 });
  }

  const location = typeof body === 'object' && body !== null && 'location' in body && typeof (body as { location: unknown }).location === 'string'
    ? ((body as { location: string }).location || '').trim()
    : null;

  const { browser, platform } = describeBrowser(request.headers.get('user-agent') || '');
  const supabase = await createServerSupabaseClient();

  // The installed Supabase client types do not expose the project's SQL RPC signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('register_login_device', {
    p_device_id: deviceId,
    p_browser: browser,
    p_platform: platform,
  });

  if (error) {
    console.error('Could not register login device:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code !== 'PGRST202' && error.code !== '42883') {
      console.warn('Non-fatal device registration warning:', error.message);
    }
  }

  // Location Security Analysis
  let isNewLocation = false;
  let newLocationStr: string | null = null;
  let previousLocationStr: string | null = null;

  if (location && location.length >= 3) {
    try {
      const admin = createAdminClient();
      const { data: authUserData } = await admin.auth.admin.getUserById(user.id);
      const metadata = authUserData?.user?.user_metadata || {};

      // Also read baseline location from user profiles table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (admin.from('profiles') as any)
        .select('location')
        .eq('id', user.id)
        .single();

      const baselineProfileLoc = profileData?.location || user.location || null;

      let knownLocations: string[] = Array.isArray(metadata.known_locations)
        ? [...metadata.known_locations]
        : [];

      if (knownLocations.length === 0 && baselineProfileLoc) {
        knownLocations.push(baselineProfileLoc);
      }

      const normalizeTown = (loc: string) => loc.split(',')[0].trim().toLowerCase();
      const incomingTown = normalizeTown(location);

      const alreadyKnown = knownLocations.some((k) => normalizeTown(k) === incomingTown);

      if (!alreadyKnown) {
        if (knownLocations.length > 0) {
          // Detected a different location from known places for the FIRST TIME
          isNewLocation = true;
          newLocationStr = location;
          previousLocationStr = knownLocations[0];

          const locationNotifications = Array.isArray(metadata.location_notifications)
            ? [...metadata.location_notifications]
            : [];

          const newNotification = {
            id: crypto.randomUUID(),
            type: 'new_location_login',
            location: newLocationStr,
            previous_location: previousLocationStr,
            browser,
            platform,
            created_at: new Date().toISOString(),
            read_at: null,
            response: null,
          };

          knownLocations.push(location);
          locationNotifications.unshift(newNotification);

          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...metadata,
              known_locations: knownLocations,
              location_notifications: locationNotifications.slice(0, 50),
            },
          });
        } else {
          // Baseline initialization (first ever detected location)
          knownLocations.push(location);
          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...metadata,
              known_locations: knownLocations,
            },
          });
        }
      }
    } catch (locErr) {
      console.error('Location tracking check failed:', locErr);
    }
  }

  return NextResponse.json({
    success: true,
    isNewLocation,
    newLocation: newLocationStr,
    previousLocation: previousLocationStr,
  });
}
