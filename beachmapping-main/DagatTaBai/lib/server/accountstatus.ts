/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server';
import {
  resolveEffectiveAccountStatus,
  type AccountStatus,
  type EffectiveAccountStatus,
} from '@/lib/utils/account-status';
import { invalidateBeachesCache } from '@/lib/db/beaches';
import { revalidatePath } from 'next/cache';

export { resolveEffectiveAccountStatus, type EffectiveAccountStatus };

type AdminClient = ReturnType<typeof createAdminClient>;

export async function insertAccountNotification(
  adminClient: AdminClient,
  payload: {
    userid: string;
    type: 'accountstatus' | 'pin_reset';
    title: string;
    message: string;
    actionurl: string;
  }
) {
  const candidateTypes = payload.type === 'accountstatus'
    ? ['account_status', 'accountstatus']
    : ['pin_reset', 'account_status', 'accountstatus'];

  let lastError: any = null;
  for (const candidateType of candidateTypes) {
    const { error } = await (adminClient.from('usernotifications') as any).insert({
      userid: payload.userid,
      logindeviceid: null,
      type: candidateType,
      title: payload.title,
      message: payload.message,
      actionurl: payload.actionurl,
    });
    if (!error) return { error: null };
    lastError = error;
    if (error.code !== '23514') break;
  }
  return { error: lastError };
}

export async function persistExpiredSuspension(
  adminClient: AdminClient,
  userId: string
): Promise<void> {
  const [{ data: profile, error }, { data: authData }] = await Promise.all([
    (adminClient.from('profiles') as any)
      .select('accountstatus, suspendeduntil, statuschangedat, role')
      .eq('id', userId)
      .maybeSingle(),
    adminClient.auth.admin.getUserById(userId),
  ]);
  if (error) throw error;

  const effective = resolveEffectiveAccountStatus(profile, authData?.user);
  const wasSuspendedInProfile = profile?.accountstatus === 'suspended';
  const wasSuspendedInAuth = authData?.user?.app_metadata?.accountstatus === 'suspended';
  if ((!wasSuspendedInProfile && !wasSuspendedInAuth) || effective.accountstatus === 'suspended') {
    return;
  }

  const now = new Date().toISOString();
  try {
    await (adminClient.from('profiles') as any)
      .update({
        accountstatus: 'active',
        status: 'active',
        statusreason: null,
        suspensionreason: null,
        statusreasontype: null,
        suspendeduntil: null,
        suspensionendsat: null,
        statuschangedby: null,
        statuschangedat: now,
        updatedat: now,
      })
      .eq('id', userId);
  } catch {
    // Ignore if DB trigger blocks profile write
  }

  try {
    const existingAppMeta = (authData?.user?.app_metadata || {}) as Record<string, any>;
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
      app_metadata: {
        ...existingAppMeta,
        accountstatus: 'active',
        status: 'active',
        statusreason: null,
        statusreasontype: null,
        suspendeduntil: null,
        statuschangedby: null,
        statuschangedat: now,
      },
    });
  } catch {
    // Non-fatal
  }

  await (adminClient.from('adminlog') as any).insert({
    adminid: null,
    targetuserid: userId,
    action: 'status_change',
    fromstatus: 'suspended',
    tostatus: 'active',
    reason: 'Suspension period ended',
  });

  await insertAccountNotification(adminClient, {
    userid: userId,
    type: 'accountstatus',
    title: 'Account reinstated',
    message: 'Your suspension period has ended. Your account is active again.',
    actionurl: profile?.role === 'beach_owner' || profile?.role === 'beach_manager' ? '/owner/account' : '/profile',
  });

  if (profile?.role === 'beach_owner' || profile?.role === 'beach_manager') {
    invalidateBeachesCache();
    revalidatePath('/', 'layout');
    revalidatePath('/map');
  }
}
