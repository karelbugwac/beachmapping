import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { hashPin } from '@/lib/services/pin';
import { validateAdminMutationRequest, noStoreHeaders } from '@/lib/server/admin-request';
import { isSuspensionActive } from '@/lib/utils/account-status';

export async function POST(request: NextRequest) {
  const originError = validateAdminMutationRequest(request);
  if (originError) return originError;

  const sessionClient = await createServerSupabaseClient();
  const { data: authData, error: authError } = await sessionClient.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401, headers: noStoreHeaders() });
  }

  const adminClient = createAdminClient();
  const { data: profileData, error: profileError } = await adminClient.from('profiles')
    .select('role, account_status, suspended_until, pin_reset_required')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Could not verify owner PIN reset:', profileError);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
  const profile = profileData as {
    role: string;
    account_status: 'active' | 'under_review' | 'suspended';
    suspended_until: string | null;
    pin_reset_required: boolean;
  } | null;
  if (!profile || !['beach_owner', 'beach_manager'].includes(profile.role)) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
  }
  if (isSuspensionActive(profile.account_status, profile.suspended_until)) {
    return NextResponse.json({ error: 'Your account is suspended.' }, { status: 403, headers: noStoreHeaders() });
  }
  if (!profile.pin_reset_required) {
    return NextResponse.json({ error: 'A new PIN is not required for this account.' }, { status: 409, headers: noStoreHeaders() });
  }

  const body = await request.json();
  if (typeof body?.pin !== 'string' || !/^\d{6}$/.test(body.pin)) {
    return NextResponse.json({ error: 'Please enter a new 6-digit numeric PIN.' }, { status: 400, headers: noStoreHeaders() });
  }

  const { error: authPasswordError } = await adminClient.auth.admin.updateUserById(authData.user.id, {
    password: body.pin,
  });
  if (authPasswordError) {
    console.error('Failed to sync owner PIN with sign-in:', authPasswordError);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }

  const { data: updatedData, error: updateError } = await adminClient.from('profiles')
    .update({
      pin: hashPin(body.pin),
      updated_at: new Date().toISOString(),
    })
    .eq('id', authData.user.id)
    .eq('pin_reset_required', true)
    .select('id')
    .maybeSingle();
  if (updateError) {
    console.error('Failed to save owner PIN:', updateError);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
  const updated = updatedData as { id: string } | null;
  if (!updated) {
    return NextResponse.json({ error: 'A new PIN is not required for this account.' }, { status: 409, headers: noStoreHeaders() });
  }

  const { error: signOutError } = await sessionClient.auth.signOut({ scope: 'global' });
  if (signOutError) {
    console.error('Could not invalidate owner sessions after PIN reset:', signOutError);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }

  const { error: clearRequirementError } = await adminClient.from('profiles')
    .update({ pin_reset_required: false, updated_at: new Date().toISOString() })
    .eq('id', authData.user.id)
    .eq('pin_reset_required', true);
  if (clearRequirementError) {
    console.error('Could not finish owner PIN reset:', clearRequirementError);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }

  return NextResponse.json({ success: true }, { headers: noStoreHeaders() });
}
