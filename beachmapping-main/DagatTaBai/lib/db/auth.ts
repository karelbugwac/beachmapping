import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { FULL_NAME_MESSAGES, validateFullName } from '@/lib/validation/fullName';
import { isAccountSuspended } from '@/lib/utils/account-suspension';
import { isSuspensionActive } from '@/lib/utils/account-status';
import { persistExpiredSuspension } from '@/lib/server/account-status';
import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';
import { EMAIL_TAKEN_MESSAGE, isDuplicateAuthEmailError } from '@/lib/validation/registration';

export interface AuthUser {
  id: string;
  full_name: string;
  account_full_name?: string | null;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  profile_image_url?: string | null;
  location?: string | null;
  status: 'active' | 'suspended';
  suspension_reason: string | null;
  suspended_at: string | null;
  suspension_ends_at: string | null;
  created_at?: string;
}

export async function getCurrentSession(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  type SessionProfile = {
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
    profile_image_url?: string | null;
    location?: string | null;
    account_status?: string | null;
    status_reason?: string | null;
    suspended_until?: string | null;
    status_changed_at?: string | null;
    status?: string | null;
    suspension_reason?: string | null;
    suspended_at?: string | null;
    suspension_ends_at?: string | null;
    created_at?: string | null;
  };
  const profileColumnSets = [
    'id, full_name, email, role, profile_image_url, location, account_status, status_reason, status_reason_type, suspended_until, status_changed_at, status, suspension_reason, suspended_at, suspension_ends_at, created_at',
    'id, full_name, email, role, profile_image_url, location, status, suspension_reason, suspended_at, suspension_ends_at, created_at',
    'id, full_name, email, role, profile_image_url, location, created_at',
  ] as const;
  const profiles = supabase.from('profiles') as any;
  let profile: SessionProfile | null = null;
  let profileError: unknown;
  for (const columns of profileColumnSets) {
    const result = await profiles
      .select(columns)
      .eq('id', data.user.id)
      .maybeSingle();
    profile = result.data;
    profileError = result.error;
    if (!profileError) break;
  }
  if (profileError) throw profileError;

  const email = data.user.email || '';
  const metadata = (data.user.user_metadata || {}) as Record<string, any>;
  const fullName =
    profile?.full_name ||
    metadata.full_name ||
    metadata.name ||
    (email ? email.split('@')[0] : 'User');
  const profileRole = profile?.role;
  const role: AuthUser['role'] =
    profileRole === 'user' ||
    profileRole === 'beach_owner' ||
    profileRole === 'beach_manager' ||
    profileRole === 'admin'
      ? profileRole
      : 'user';
  const profileImageUrl =
    profile?.profile_image_url ||
    metadata.profile_image_url ||
    metadata.avatar_url ||
    metadata.picture ||
    null;
  const accountStatus = profile?.account_status || profile?.status || metadata.status || 'active';
  const suspensionUntil = profile?.suspended_until || profile?.suspension_ends_at ||
    (typeof metadata.suspension_ends_at === 'string' ? metadata.suspension_ends_at : null);
  const suspension = {
    status: isSuspensionActive(accountStatus, suspensionUntil) ? 'suspended' as const : 'active' as const,
    suspension_reason: profile?.status_reason || profile?.suspension_reason || metadata.status_reason || null,
    suspended_at: profile?.status_changed_at || profile?.suspended_at || metadata.status_updated_at || null,
    suspension_ends_at: suspensionUntil,
  };

  return {
    id: data.user.id,
    full_name: fullName,
    account_full_name: profile?.full_name || metadata.full_name || null,
    email,
    role,
    profile_image_url: profileImageUrl,
    location: profile?.location || null,
    ...suspension,
    created_at: profile?.created_at || data.user.created_at,
  };
}

export async function destroySession(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Session cleanup is best-effort when Supabase is unreachable.
  }
}

export async function updateSessionUser(updates: {
  full_name?: string;
  profile_image_url?: string | null;
  location?: string | null;
}): Promise<AuthUser | null> {
  if (updates.full_name !== undefined) {
    const nameValidation = validateFullName(updates.full_name);
    if (!nameValidation.ok) return null;
    updates = { ...updates, full_name: nameValidation.value };
  }

  const current = await getCurrentSession();
  if (!current) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select('id, full_name, email, role, profile_image_url, location, account_status, status_reason, suspended_until, status_changed_at, status, suspension_reason, suspended_at, suspension_ends_at, created_at')
      .maybeSingle();
    if (profileError || !profile) {
      console.error('Profile database update failed:', profileError);
      return null;
    }

    return {
      ...current,
      full_name: profile.full_name,
      email: profile.email || current.email,
      role: profile.role,
      profile_image_url: profile.profile_image_url,
      location: profile.location,
      status: isSuspensionActive(profile.account_status || profile.status, profile.suspended_until || profile.suspension_ends_at) ? 'suspended' : 'active',
      suspension_reason: profile.status_reason || profile.suspension_reason || null,
      suspended_at: profile.status_changed_at || profile.suspended_at || null,
      suspension_ends_at: profile.suspended_until || profile.suspension_ends_at || null,
      created_at: profile.created_at,
    };
  } catch (error: unknown) {
    console.error('Profile update failed:', error);
    return null;
  }
}

export async function registerLocalUser(
  full_name: string,
  email: string,
  password: string
): Promise<{ user?: AuthUser; error?: string; requiresEmailConfirmation?: boolean }> {
  const nameValidation = validateFullName(full_name);
  if (!nameValidation.ok) return { error: FULL_NAME_MESSAGES.serverRejected };
  const cleanName = nameValidation.value;
  const cleanEmail = email.trim().toLowerCase();
  if (password.length < 6) return { error: 'Password must be at least 6 characters long.' };

  try {
    const adminSupabase = createAdminClient();

    const { data: adminCreated, error: adminCreateError } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName, role: 'user' },
    });

    if (adminCreateError) {
      if (isDuplicateAuthEmailError(adminCreateError)) {
        return { error: EMAIL_TAKEN_MESSAGE };
      }
      return { error: 'Registration could not be completed. Please try again.' };
    }

    if (!adminCreated.user) {
      return { error: 'Supabase did not create the account.' };
    }
    const userId = adminCreated.user.id;
    const createdAt = adminCreated.user.created_at;

    // Ensure profile record exists in public.profiles
    try {
      await (adminSupabase.from('profiles') as any).upsert(
        {
          id: userId,
          email: cleanEmail,
          full_name: cleanName,
          role: 'user',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // Non-fatal if trigger already created the profile
    }

    return {
      user: {
        id: userId,
        full_name: cleanName,
        email: cleanEmail,
        role: 'user',
        status: 'active',
        suspension_reason: null,
        suspended_at: null,
        suspension_ends_at: null,
        created_at: createdAt || new Date().toISOString(),
      },
      requiresEmailConfirmation: false,
    };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Could not connect to Supabase Auth.' };
  }
}

export async function loginLocalUser(
  email: string,
  password: string
): Promise<{ user?: AuthUser; error?: string; suspendedAccount?: { reason: string | null; reasonType: string | null; suspendedUntil: string | null } }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const supabase = await createServerSupabaseClient();
    let { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    // If login failed because the account was created before email auto-confirmation (e.g., "Email not confirmed"),
    // auto-confirm the account via Admin API and retry signing in.
    if (error) {
      try {
        const adminSupabase = createAdminClient();
        const { data: usersList } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingUser = usersList?.users?.find(
          (u) => (u.email || '').toLowerCase() === cleanEmail
        );
        let legacySuspension = existingUser?.user_metadata?.status === 'suspended';
        if (existingUser?.banned_until && Date.parse(existingUser.banned_until) > Date.now()) {
          const { data: accountProfile, error: accountProfileError } = await (adminSupabase
            .from('profiles') as any)
            .select('status')
            .eq('id', existingUser.id)
            .maybeSingle();
          if (accountProfileError) throw accountProfileError;
          legacySuspension ||= accountProfile?.status === 'suspended';
        }
        if (existingUser && legacySuspension && existingUser.banned_until && Date.parse(existingUser.banned_until) > Date.now()) {
          const { error: unbanError } = await adminSupabase.auth.admin.updateUserById(existingUser.id, {
            ban_duration: '0s',
          });
          if (unbanError) throw unbanError;
          const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          data = retry.data;
          error = retry.error;
        } else if (existingUser && !existingUser.email_confirmed_at) {
          await adminSupabase.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
          });
          const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          data = retry.data;
          error = retry.error;
        }
      } catch {
        // Ignore admin fallback error and return original auth error
      }
    }

    if (error || !data.user) return { error: error?.message || 'Invalid email address or password.' };

    let profile: any = null;
    try {
      const adminSupabase = createAdminClient();
      const { data: profData, error: profileError } = await (adminSupabase.from('profiles') as any)
        .select('id, full_name, email, role, profile_image_url, account_status, status_reason, status_reason_type, suspended_until, status, suspension_reason, suspended_at, suspension_ends_at, created_at')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (profData) {
        profile = profData;
      } else if (!profData) {
        // Ensure a profile row exists for this user
        const metadata = (data.user.user_metadata || {}) as Record<string, any>;
        const fallbackName = metadata.full_name || metadata.name || cleanEmail.split('@')[0];
        const fallbackRole = metadata.role || 'user';
        const { data: insertedProfile } = await (adminSupabase.from('profiles') as any)
          .upsert(
            {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              full_name: fallbackName,
              role: fallbackRole,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select('id, full_name, email, role, profile_image_url, account_status, status_reason, status_reason_type, suspended_until, status, suspension_reason, suspended_at, suspension_ends_at, created_at')
          .maybeSingle();
        if (insertedProfile) {
          profile = insertedProfile;
        }
      }
    } catch (profileLoadError) {
      console.error('Failed to verify account status after login:', profileLoadError);
      return { error: 'Could not verify account status. Please try again.' };
    }

    const metadata = (data.user.user_metadata || {}) as Record<string, any>;
    const accountStatus = profile?.account_status || profile?.status || 'active';
    const suspendedUntil = profile?.suspended_until || profile?.suspension_ends_at || null;
    if (accountStatus === 'suspended' && !isSuspensionActive('suspended', suspendedUntil)) {
      await persistExpiredSuspension(createAdminClient(), data.user.id);
      if (profile) {
        profile.account_status = 'active';
        profile.status = 'active';
      }
    } else if (isSuspensionActive(accountStatus, suspendedUntil)) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error('Could not clear suspended user session:', signOutError);
      return {
        error: ADMIN_MESSAGES.suspended,
        suspendedAccount: {
          reason: profile?.status_reason || profile?.suspension_reason || null,
          reasonType: profile?.status_reason_type || null,
          suspendedUntil,
        },
      };
    }

    const fullName =
      profile?.full_name ||
      metadata.full_name ||
      metadata.name ||
      cleanEmail.split('@')[0];
    const role =
      (profile?.role as AuthUser['role']) ||
      (metadata.role as AuthUser['role']) ||
      (cleanEmail.toLowerCase().includes('admin') ? 'admin' : 'user');
    const profileImageUrl =
      profile?.profile_image_url ||
      metadata.profile_image_url ||
      metadata.avatar_url ||
      metadata.picture ||
      null;
    const suspension = {
      status: profile?.status === 'suspended' || metadata.status === 'suspended' ? 'suspended' as const : 'active' as const,
      suspension_reason: profile?.suspension_reason || metadata.status_reason || null,
      suspended_at: profile?.suspended_at || metadata.status_updated_at || null,
      suspension_ends_at: profile?.suspension_ends_at || metadata.suspension_ends_at || null,
    };
    if (!isAccountSuspended(suspension)) {
      suspension.status = 'active';
    }

    return {
      user: {
        id: data.user.id,
        full_name: fullName,
        email: data.user.email || cleanEmail,
        role: role,
        profile_image_url: profileImageUrl,
        ...suspension,
        created_at: profile?.created_at || data.user.created_at,
      },
    };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Could not connect to Supabase Auth.' };
  }
}
