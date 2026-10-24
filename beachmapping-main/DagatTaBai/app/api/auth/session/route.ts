import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/db/auth';

export async function GET() {
  try {
    const user = await getCurrentSession();
    return NextResponse.json({ user });
  } catch (err: unknown) {
    return NextResponse.json({ user: null });
  }
}
