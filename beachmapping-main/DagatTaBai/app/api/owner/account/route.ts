import { NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { hashPin } from '@/lib/services/pin';

export async function POST(request: Request) {
  try {
    const auth = await authorizeRoles(['beach_owner', 'beach_manager']);
    if (!auth.authorized) return NextResponse.json({ error: auth.message }, { status: auth.status });
    const { newPin } = await request.json();
    if (typeof newPin !== 'string' || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: 'Owner PIN must be exactly six digits.' }, { status: 400 });
    }

    const { error: profileError } = await (auth.adminClient.from('profiles') as any)
      .update({ pin: hashPin(newPin), updated_at: new Date().toISOString() })
      .eq('id', auth.user.id);
    if (profileError) throw profileError;

    const { error: passwordError } = await auth.adminClient.auth.admin.updateUserById(auth.user.id, { password: newPin });
    if (passwordError) throw passwordError;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update owner PIN.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}