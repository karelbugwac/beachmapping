/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server';
import { isSuspensionActive } from '@/lib/utils/account-status';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { revalidatePath } from 'next/cache';

type AdminClient = ReturnType<typeof createAdminClient>;

export async function persistExpiredSuspension(
  adminClient: AdminClient,
  userId: string
): Promise<void> {
  const { data: profile, error } = await (adminClient.from('profiles') as any)
    .select('account_status, suspended_until, status_changed_at, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (
    profile?.account_status !== 'suspended' ||
    isSuspensionActive('suspended', profile.suspended_until)
  ) return;

  const now = new Date().toISOString();
  let update = (adminClient.from('profiles') as any)
    .update({
      account_status: 'active',
      status_reason: null,
      status_reason_type: null,
      suspended_until: null,
      status_changed_by: null,
      status_changed_at: now,
      updated_at: now,
    })
    .eq('id', userId)
    .eq('account_status', 'suspended');
  update = profile.status_changed_at
    ? update.eq('status_changed_at', profile.status_changed_at)
    : update.is('status_changed_at', null);
  const { data: changed, error: updateError } = await update.select('id').maybeSingle();
  if (updateError) throw updateError;
  if (!changed) return;

  const { error: auditError } = await (adminClient.from('admin_audit_log') as any).insert({
    admin_id: null,
    target_user_id: userId,
    action: 'status_change',
    from_status: 'suspended',
    to_status: 'active',
    reason: 'Suspension period ended',
  });
  if (auditError) throw auditError;

  const { error: notificationError } = await (adminClient.from('user_notifications') as any).insert({
    user_id: userId,
    login_device_id: null,
    type: 'account_status',
    title: 'Account reinstated',
    message: 'Your suspension period has ended. Your account is active again.',
    action_url: profile.role === 'beach_owner' || profile.role === 'beach_manager' ? '/owner/account' : '/profile',
  });
  if (notificationError) throw notificationError;
  if (profile.role === 'beach_owner' || profile.role === 'beach_manager') {
    invalidateBeachesCache();
    revalidatePath('/', 'layout');
    revalidatePath('/map');
  }
}
