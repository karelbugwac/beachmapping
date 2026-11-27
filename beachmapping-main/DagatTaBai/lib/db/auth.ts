import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { FULL_NAME_MESSAGES, validateFullName } from '@/lib/validation/fullName';
import { isAccountSuspended } from '@/lib/utils/account-suspension';
import { isSuspensionActive, resolveEffectiveAccountStatus } from '@/lib/utils/account-status';
import { persistExpiredSuspension } from '@/lib/server/accountstatus';
import { ADMIN_MESSAGES } from '@/lib/validation/admin-messages';
import { EMAIL_TAKEN_MESSAGE, isDuplicateAuthEmailError } from '@/lib/validation/registration';

export interface AuthUser {
  id: string;
  fullname: string;
  account_full_name?: string | null;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  profileimageurl?: string | null;
  location?: string | null;
  status: 'active' | 'suspended';
  suspensionreason: string | null;
  statusreasontype?: string | null;
  suspendedat: string | null;
  suspensionendsat: string | null;
  createdat?: string;
}

export async function getCurrentSession(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  type SessionProfile = {
    fullname?: string | null;
    email?: string | null;
    role?: string | null;
    profileimageurl?: string | null;
    location?: string | null;
    accountstatus?: string | null;
    statusreason?: string | null;
    statusreasontype?: string | null;
    suspendeduntil?: string | null;
    statuschangedat?: string | null;
    status?: string | null;
    suspensionreason?: string | null;
    suspendedat?: string | null;
    suspensionendsat?: string | null;
    createdat?: string | null;
  };
  const profileColumnSets = [
    'id, fullname, email, role, profileimageurl, location, accountstatus, statusreason, statusreasontype, suspendeduntil, statuschangedat, status, suspensionreason, suspendedat, suspensionendsat, createdat',
    'id, fullname, email, role, profileimageurl, location, status, suspensionreason, suspendedat, suspensionendsat, createdat',
    'id, fullname, email, role, profileimageurl, location, createdat',
    'id, full_name, email, role, profile_image_url, location, created_at',
    'id, email, role',
  ] as const;
  const adminSupabase = createAdminClient();
  const profiles = adminSupabase.from('profiles') as any;
  let profile: SessionProfile | null = null;
  let profileError: unknown;
  for (const columns of profileColumnSets) {
    const result = await profiles
      .select(columns)
      .eq('id', data.user.id)
      .maybeSingle();
    if (result.data) {
      profile = {
        ...result.data,
        fullname: result.data.fullname ?? result.data.full_name,
        profileimageurl: result.data.profileimageurl ?? result.data.profile_image_url,
        createdat: result.data.createdat ?? result.data.created_at,
      };
    } else {
      profile = null;
    }
    profileError = result.error;
    if (!profileError) break;
  }
  if (profileError) {
    console.warn('Could not load full profile columns in getCurrentSession:', profileError);
  }

  let freshAuthUser: any = data.user;
  try {
    const { data: adminAuthData } = await adminSupabase.auth.admin.getUserById(data.user.id);
    if (adminAuthData?.user) freshAuthUser = adminAuthData.user;
  } catch {
    // Fallback to session user if admin lookup fails
  }

  const email = data.user.email || '';
  const metadata = (freshAuthUser.user_metadata || {}) as Record<string, any>;
  const fullName =
    profile?.fullname ||
    metadata.full_name ||
    metadata.name ||
    (email ? email.split('@')[0] : 'User');
  const profileRole = profile?.role || metadata.role || freshAuthUser.app_metadata?.role || (email.toLowerCase() === 'official.dagattabai@gmail.com' ? 'admin' : undefined);
  const role: AuthUser['role'] =
    profileRole === 'user' ||
    profileRole === 'beach_owner' ||
    profileRole === 'beach_manager' ||
    profileRole === 'admin'
      ? profileRole
      : 'user';
  const profileImageUrl =
    profile?.profileimageurl ||
    metadata.profile_image_url ||
    metadata.avatar_url ||
    metadata.picture ||
    null;
  const effective = resolveEffectiveAccountStatus(profile, freshAuthUser);
  const suspension = {
    status: effective.status,
    suspensionreason: effective.statusreason,
    statusreasontype: effective.statusreasontype,
    suspendedat: effective.statuschangedat,
    suspensionendsat: effective.suspendeduntil,
  };

  return {
    id: data.user.id,
    fullname: fullName,
    account_full_name: profile?.fullname || metadata.full_name || null,
    email,
    role,
    profileimageurl: profileImageUrl,
    location: profile?.location || null,
    ...suspension,
    createdat: profile?.createdat || data.user.created_at,
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
  fullname?: string;
  profileimageurl?: string | null;
  location?: string | null;
}): Promise<AuthUser | null> {
  if (updates.fullname !== undefined) {
    const nameValidation = validateFullName(updates.fullname);
    if (!nameValidation.ok) return null;
    updates = { ...updates, fullname: nameValidation.value };
  }

  const current = await getCurrentSession();
  if (!current) return null;

  try {
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await (adminSupabase.from('profiles') as any)
      .update({ ...updates, updatedat: new Date().toISOString() })
      .eq('id', current.id)
      .select('id, fullname, email, role, profileimageurl, location, accountstatus, statusreason, suspendeduntil, statuschangedat, status, suspensionreason, suspendedat, suspensionendsat, createdat')
      .maybeSingle();
    if (profileError || !profile) {
      console.error('Profile database update failed:', profileError);
      return null;
    }

    return {
      ...current,
      fullname: profile.fullname,
      email: profile.email || current.email,
      role: profile.role,
      profileimageurl: profile.profileimageurl,
      location: profile.location,
      status: isSuspensionActive(profile.accountstatus || profile.status, profile.suspendeduntil || profile.suspensionendsat) ? 'suspended' : 'active',
      suspensionreason: profile.statusreason || profile.suspensionreason || null,
      suspendedat: profile.statuschangedat || profile.suspendedat || null,
      suspensionendsat: profile.suspendeduntil || profile.suspensionendsat || null,
      createdat: profile.createdat,
    };
  } catch (error: unknown) {
    console.error('Profile update failed:', error);
    return null;
  }
}

export async function registerLocalUser(
  fullname: string,
  email: string,
  password: string
): Promise<{ user?: AuthUser; error?: string; requiresEmailConfirmation?: boolean }> {
  const nameValidation = validateFullName(fullname);
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
          fullname: cleanName,
          role: 'user',
          updatedat: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // Non-fatal if trigger already created the profile
    }

    return {
      user: {
        id: userId,
        fullname: cleanName,
        email: cleanEmail,
        role: 'user',
        status: 'active',
        suspensionreason: null,
        suspendedat: null,
        suspensionendsat: null,
        createdat: createdAt || new Date().toISOString(),
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
    let freshAuthUser: any = data.user;
    try {
      const adminSupabase = createAdminClient();
      const [{ data: profData, error: profileError }, { data: adminAuthData }] = await Promise.all([
        (adminSupabase.from('profiles') as any)
          .select('id, fullname, email, role, profileimageurl, accountstatus, statusreason, statusreasontype, suspendeduntil, statuschangedat, status, suspensionreason, suspendedat, suspensionendsat, createdat')
          .eq('id', data.user.id)
          .maybeSingle(),
        adminSupabase.auth.admin.getUserById(data.user.id),
      ]);
      if (adminAuthData?.user) {
        freshAuthUser = adminAuthData.user;
      }
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
              fullname: fallbackName,
              role: fallbackRole,
              updatedat: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
          .select('id, fullname, email, role, profileimageurl, accountstatus, statusreason, statusreasontype, suspendeduntil, statuschangedat, status, suspensionreason, suspendedat, suspensionendsat, createdat')
          .maybeSingle();
        if (insertedProfile) {
          profile = insertedProfile;
        }
      }
    } catch (profileLoadError) {
      console.error('Failed to verify account status after login:', profileLoadError);
      return { error: 'Could not verify account status. Please try again.' };
    }

    const metadata = (freshAuthUser.user_metadata || {}) as Record<string, any>;
    const effective = resolveEffectiveAccountStatus(profile, freshAuthUser);
    const wasSuspended = profile?.accountstatus === 'suspended' || freshAuthUser.app_metadata?.accountstatus === 'suspended';
    if (wasSuspended && effective.accountstatus === 'active') {
      await persistExpiredSuspension(createAdminClient(), data.user.id).catch(() => {});
      if (profile) {
        profile.accountstatus = 'active';
        profile.status = 'active';
      }
    } else if (effective.accountstatus === 'suspended') {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error('Could not clear disabled user session:', signOutError);
      return {
        error: ADMIN_MESSAGES.suspended,
        suspendedAccount: {
          reason: effective.statusreason,
          reasonType: effective.statusreasontype,
          suspendedUntil: effective.suspendeduntil,
        },
      };
    }

    const fullName =
      profile?.fullname ||
      metadata.full_name ||
      metadata.name ||
      cleanEmail.split('@')[0];
    const role =
      (profile?.role as AuthUser['role']) ||
      (metadata.role as AuthUser['role']) ||
      (cleanEmail.toLowerCase().includes('admin') ? 'admin' : 'user');
    const profileImageUrl =
      profile?.profileimageurl ||
      metadata.profile_image_url ||
      metadata.avatar_url ||
      metadata.picture ||
      null;
    const suspension = {
      status: profile?.status === 'suspended' || metadata.status === 'suspended' ? 'suspended' as const : 'active' as const,
      suspensionreason: profile?.suspensionreason || metadata.status_reason || null,
      suspendedat: profile?.suspendedat || metadata.status_updated_at || null,
      suspensionendsat: profile?.suspensionendsat || metadata.suspension_ends_at || null,
    };
    if (!isAccountSuspended(suspension)) {
      suspension.status = 'active';
    }

    return {
      user: {
        id: data.user.id,
        fullname: fullName,
        email: data.user.email || cleanEmail,
        role: role,
        profileimageurl: profileImageUrl,
        ...suspension,
        createdat: profile?.createdat || data.user.created_at,
      },
    };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Could not connect to Supabase Auth.' };
  }
}
