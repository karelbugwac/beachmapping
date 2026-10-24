import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/db/auth';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Logout failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
