/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRoles } from '@/lib/supabase/authorization';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdministratorAccount, validateAdminMutationRequest, noStoreHeaders } from '@/lib/server/adminrequest';
import { isAllowedAdminResetTarget } from '@/lib/server/resetpolicy';

async function checkRateLimit(
  adminClient: ReturnType<typeof createAdminClient>,
  adminId: string,
  targetId: string,
) {
  const reserveRateLimit = adminClient.rpc as unknown as (
    functionName: 'reserve_admin_reset_rate_limit',
    args: { p_admin_id: string; p_target_user_id: string }
  ) => Promise<{ data: number | null; error: { message: string } | null }>;
  const { data: retryAfter, error } = await reserveRateLimit('reserve_admin_reset_rate_limit', {
    p_admin_id: adminId,
    p_target_user_id: targetId,
  });
  if (error) throw new Error(error.message);
  if (typeof retryAfter !== 'number') throw new Error('The reset rate limit could not be verified.');
  return retryAfter > 0 ? retryAfter : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originError = validateAdminMutationRequest(request);
  if (originError) return originError;

  try {
    const auth = await authorizeRoles(['admin']);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status, headers: noStoreHeaders() });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body?.action;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404, headers: noStoreHeaders() });
    }
    if (action !== 'reset_password' && action !== 'reset_pin') {
      return NextResponse.json({ error: 'Invalid reset action.' }, { status: 400, headers: noStoreHeaders() });
    }

    const { data: target, error: targetError } = await (auth.adminClient.from('profiles') as any)
      .select('id, email, fullname, role, pinresetrequired')
      .eq('id', id)
      .maybeSingle();
    if (targetError) throw targetError;
    const roleMatches = isAllowedAdminResetTarget(action, target?.role);
    if (!target || !roleMatches || isAdministratorAccount(target) || target.id === auth.user.id) {
      return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403, headers: noStoreHeaders() });
    }

    const retryAfter = await checkRateLimit(auth.adminClient, auth.user.id, id);
    if (retryAfter) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in a few minutes.' },
        { status: 429, headers: { ...noStoreHeaders(), 'Retry-After': String(retryAfter) } }
      );
    }

    if (action === 'reset_password') {
      if (!target.email) {
        return NextResponse.json({ error: 'The account has no email address.' }, { status: 400, headers: noStoreHeaders() });
      }
      const configuredSiteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
      if (!configuredSiteUrl) {
        console.error('Password reset requires SITE_URL or NEXT_PUBLIC_SITE_URL configuration.');
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
      }
      const siteUrl = new URL(configuredSiteUrl);
      const { error: resetError } = await auth.adminClient.auth.resetPasswordForEmail(target.email, {
        redirectTo: new URL('/reset-password', siteUrl).toString(),
      });
      if (resetError) throw resetError;
    } else {
      const { error: resetError } = await (auth.adminClient.from('profiles') as any)
        .update({
          pin: null,
          pinresetrequired: true,
          updatedat: new Date().toISOString(),
        })
        .eq('id', id);
      if (resetError) throw resetError;

      const { error: notificationError } = await (auth.adminClient.from('usernotifications') as any).insert({
        userid: id,
        logindeviceid: null,
        type: 'pin_reset',
        title: 'Create a new owner PIN',
        message: 'Your PIN was reset by an administrator. Create a new PIN the next time you sign in.',
        actionurl: '/owner/reset-pin',
      });
      if (notificationError) throw notificationError;
    }

    const { error: auditError } = await (auth.adminClient.from('adminlog') as any).insert({
      adminid: auth.user.id,
      targetuserid: id,
      action,
      reason: null,
    });
    if (auditError) throw auditError;

    return NextResponse.json({
      success: true,
      message: action === 'reset_password'
        ? 'Password reset email sent.'
        : 'PIN reset. The owner must create a new PIN the next time they sign in.',
    }, { headers: noStoreHeaders() });
  } catch (error: unknown) {
    console.error('Admin account reset failed:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: noStoreHeaders() });
  }
}
