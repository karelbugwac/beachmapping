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
    .select('accountstatus, suspendeduntil, statuschangedat, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (
    profile?.accountstatus !== 'suspended' ||
    isSuspensionActive('suspended', profile.suspendeduntil)
  ) return;

  const now = new Date().toISOString();
  let update = (adminClient.from('profiles') as any)
    .update({
      accountstatus: 'active',
      statusreason: null,
      statusreasontype: null,
      suspendeduntil: null,
      statuschangedby: null,
      statuschangedat: now,
      updatedat: now,
    })
    .eq('id', userId)
    .eq('accountstatus', 'suspended');
  update = profile.statuschangedat
    ? update.eq('statuschangedat', profile.statuschangedat)
    : update.is('statuschangedat', null);
  const { data: changed, error: updateError } = await update.select('id').maybeSingle();
  if (updateError) throw updateError;
  if (!changed) return;

  const { error: auditError } = await (adminClient.from('adminlog') as any).insert({
    adminid: null,
    targetuserid: userId,
    action: 'status_change',
    fromstatus: 'suspended',
    tostatus: 'active',
    reason: 'Suspension period ended',
  });
  if (auditError) throw auditError;

  const { error: notificationError } = await (adminClient.from('usernotifications') as any).insert({
    userid: userId,
    logindeviceid: null,
    type: 'accountstatus',
    title: 'Account reinstated',
    message: 'Your suspension period has ended. Your account is active again.',
    actionurl: profile.role === 'beach_owner' || profile.role === 'beach_manager' ? '/owner/account' : '/profile',
  });
  if (notificationError) throw notificationError;
  if (profile.role === 'beach_owner' || profile.role === 'beach_manager') {
    invalidateBeachesCache();
    revalidatePath('/', 'layout');
    revalidatePath('/map');
  }
}
