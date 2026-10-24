import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { hashPin } from '@/lib/services/pin';

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { newPin } = await request.json();
    if (typeof newPin !== 'string' || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: 'Administrator PIN must be exactly six digits.' }, { status: 400 });
    }

    const { error: profileError } = await (auth.adminClient.from('profiles') as any)
      .update({ pin: hashPin(newPin), updated_at: new Date().toISOString() })
      .eq('id', auth.user.id);
    if (profileError) throw profileError;

    const { error: passwordError } = await auth.adminClient.auth.admin.updateUserById(auth.user.id, { password: newPin });
    if (passwordError) throw passwordError;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update administrator PIN.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { userId, newPin } = await request.json();
    if (typeof userId !== 'string' || typeof newPin !== 'string' || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: 'User ID and a valid 6-digit PIN are required.' }, { status: 400 });
    }

    const { error: profileError } = await (auth.adminClient.from('profiles') as any)
      .update({ pin: hashPin(newPin), updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (profileError) throw profileError;

    const { error: passwordError } = await auth.adminClient.auth.admin.updateUserById(userId, { password: newPin });
    if (passwordError) throw passwordError;
    return NextResponse.json({ success: true, message: 'PIN reset successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset user PIN.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}