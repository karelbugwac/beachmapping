import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { isAccountSuspended } from '@/lib/utils/account-suspension';

export function roleAuthorizationFailureStatus(
  role: string | null | undefined,
  allowedRoles: string[]
): 403 | null {
  return role && allowedRoles.includes(role) ? null : 403;
}

export async function authorizeRoles(allowedRoles: string[]) {
  const adminClient = createAdminClient();

  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) {
    return { authorized: false as const, status: 401, message: 'Authentication required.' };
  }

  const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;

  const { data: initialProfile, error: profileError } = await (adminClient.from('profiles') as any)
    .select('role, status, suspensionreason, suspendedat, suspensionendsat')
    .eq('id', data.user.id)
    .maybeSingle();
  let profile = initialProfile;

  if (profileError) {
    if (profileError.code !== '42703' && profileError.code !== 'PGRST204') {
      console.error('Failed to verify account permissions:', profileError);
      return { authorized: false as const, status: 500, message: 'Could not verify account permissions.' };
    }

    console.warn('Account suspension columns are unavailable; apply the account-suspensions migration.');
    const legacyProfile = await (adminClient.from('profiles') as any)
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    if (legacyProfile.error) {
      console.error('Failed to verify account role:', legacyProfile.error);
      return { authorized: false as const, status: 500, message: 'Could not verify account permissions.' };
    }
    profile = {
      ...legacyProfile.data,
      status: metadata.status === 'suspended' ? 'suspended' : 'active',
      suspensionendsat: typeof metadata.suspension_ends_at === 'string'
        ? metadata.suspension_ends_at
        : null,
    };
  }
  if (isAccountSuspended(profile)) {
    return { authorized: false as const, status: 403, message: 'Your account has been suspended.' };
  }

  const resolvedRole: string = profile?.role || '';

  const failureStatus = roleAuthorizationFailureStatus(resolvedRole, allowedRoles);
  if (failureStatus) {
    return { authorized: false as const, status: failureStatus, message: 'You do not have permission to perform this action.' };
  }

  return { authorized: true as const, user: data.user, role: resolvedRole, adminClient };
}
