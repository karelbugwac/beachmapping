import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function authorizeRoles(allowedRoles: string[]) {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) {
    return { authorized: false as const, status: 401, message: 'Authentication required.' };
  }

  const userEmail = data.user.email?.toLowerCase().trim() || '';
  const allowedAdminEmails = (process.env.ADMIN_ALLOWED_EMAILS || 'official.dagattabai@gmail.com,admin@dagattabai.ph')
    .split(',')
    .map((e) => e.trim().toLowerCase());

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await (adminClient.from('profiles') as any)
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    return { authorized: false as const, status: 500, message: 'Could not verify account permissions.' };
  }

  const role = profile?.role || data.user.user_metadata?.role;

  // Check if user is whitelisted admin
  if (allowedAdminEmails.includes(userEmail) && allowedRoles.includes('admin')) {
    if (profile?.role !== 'admin') {
      // Sync profile role to admin if missing
      await (adminClient.from('profiles') as any)
        .update({ role: 'admin' })
        .eq('id', data.user.id);
    }
    return { authorized: true as const, user: data.user, role: 'admin', adminClient };
  }

  if (!role || !allowedRoles.includes(role)) {
    return { authorized: false as const, status: 403, message: 'You do not have permission to perform this action.' };
  }

  return { authorized: true as const, user: data.user, role, adminClient };
}
