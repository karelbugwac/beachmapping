import { NextRequest, NextResponse } from 'next/server';
import { loginLocalUser } from '@/lib/db/auth';
import { userLoginSchema } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = userLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid login details.' }, { status: 400 });
    }

    const { user, error } = await loginLocalUser(parsed.data.email, parsed.data.password);
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Invalid email or password.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
