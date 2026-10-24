import { NextRequest, NextResponse } from 'next/server';
import { registerLocalUser } from '@/lib/db/auth';
import { userRegisterSchema } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = userRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid registration details.' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const { user, error, requiresEmailConfirmation } = await registerLocalUser(name, email, password);
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Registration failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, user, requiresEmailConfirmation },
      { status: requiresEmailConfirmation ? 202 : 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
