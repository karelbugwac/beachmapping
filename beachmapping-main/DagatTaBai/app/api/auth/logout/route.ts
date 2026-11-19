import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession } from '@/lib/db/auth';

export async function POST() {
  try {
    await destroySession();

    // Clean up all auth and verifier cookies on logout
    try {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      for (const c of allCookies) {
        if (
          c.name.startsWith('sb-') ||
          c.name.includes('auth-token') ||
          c.name.includes('code-verifier') ||
          c.name.includes('oauth')
        ) {
          cookieStore.delete(c.name);
        }
      }
    } catch {
      // Best-effort cookie purge
    }

    return NextResponse.json({ success: true }, { headers: {
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    } });
  } catch {
    return NextResponse.json({ error: 'Logout could not be completed.' }, { status: 500, headers: {
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    } });
  }
}
