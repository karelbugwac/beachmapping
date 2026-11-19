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

    const { user, error, suspendedAccount } = await loginLocalUser(parsed.data.email, parsed.data.password);
    if (error || !user) {
      return NextResponse.json(
        suspendedAccount
          ? {
              error: error || 'Your account is suspended.',
              code: 'ACCOUNT_SUSPENDED',
              reason: suspendedAccount.reason,
              reason_type: suspendedAccount.reasonType,
              suspended_until: suspendedAccount.suspendedUntil,
            }
          : { error: error || 'Invalid email or password.' },
        { status: suspendedAccount ? 403 : 401, headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
      );
    }

    return NextResponse.json({ success: true, user }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
