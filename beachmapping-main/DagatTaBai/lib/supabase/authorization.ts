import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function authorizeRoles(allowedRoles: string[]) {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) {
    return { authorized: false as const, status: 401, message: 'Authentication required.' };
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await (adminClient.from('profiles') as any)
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) {
    return { authorized: false as const, status: 500, message: 'Could not verify account permissions.' };
  }
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { authorized: false as const, status: 403, message: 'You do not have permission to perform this action.' };
  }

  return { authorized: true as const, user: data.user, role: profile.role, adminClient };
}