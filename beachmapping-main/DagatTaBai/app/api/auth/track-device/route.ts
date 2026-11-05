import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    ? body.deviceId
    : null;
  if (typeof deviceId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deviceId)) {
    return NextResponse.json({ error: 'A valid device identifier is required.' }, { status: 400 });
  }

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

    if (error.code === 'PGRST202' || error.code === '42883') {
      return NextResponse.json({
        error: 'Login-device notification setup is missing in Supabase. Apply the 20261104_login_device_notifications.sql migration, then retry.',
        code: error.code,
      }, { status: 503 });
    }

    return NextResponse.json({
      error: error.message || 'Could not record this sign-in device.',
      code: error.code,
    }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
