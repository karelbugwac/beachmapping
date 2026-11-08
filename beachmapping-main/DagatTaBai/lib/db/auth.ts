import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  profile_image_url?: string | null;
  location?: string | null;
  created_at?: string;
}

export async function getCurrentSession(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    let profile: any = null;
    try {
      const { data: profData, error: profileError } = await (supabase.from('profiles') as any)
        .select('id, full_name, email, role, profile_image_url, location, created_at')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!profileError && profData) {
        profile = profData;
      }
    } catch {
      // Graceful fallback to user auth metadata if profiles table query fails
    }

    const email = data.user.email || '';
    const metadata = (data.user.user_metadata || {}) as Record<string, any>;
    const fullName =
      profile?.full_name ||
      metadata.full_name ||
      metadata.name ||
      (email ? email.split('@')[0] : 'User');
    const role =
      (profile?.role as AuthUser['role']) ||
      (metadata.role as AuthUser['role']) ||
      (email.toLowerCase().includes('admin') ? 'admin' : 'user');
    const profileImageUrl =
      profile?.profile_image_url ||
      metadata.profile_image_url ||
      metadata.avatar_url ||
      metadata.picture ||
      null;

    return {
      id: data.user.id,
      full_name: fullName,
      email: email,
      role: role,
      profile_image_url: profileImageUrl,
      location: profile?.location || null,
      created_at: profile?.created_at || data.user.created_at,
    };
  } catch {
    return null;
  }
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
  const current = await getCurrentSession();
  if (!current) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select('id, full_name, email, role, profile_image_url, location, created_at')
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
  const cleanName = full_name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) return { error: 'Name must be at least 2 characters long.' };
  if (password.length < 6) return { error: 'Password must be at least 6 characters long.' };

  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // Create the user via the Admin API with email_confirm: true so the account works immediately without getting blocked by unconfirmed email
    let userId: string | null = null;
    let createdAt: string | undefined = undefined;

    const { data: adminCreated, error: adminCreateError } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: cleanName, role: 'user' },
    });

    if (adminCreateError) {
      // Check if an unconfirmed account with this email already exists from an earlier attempt
      const { data: usersList } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existingUser = usersList?.users?.find(
        (u) => (u.email || '').toLowerCase() === cleanEmail
      );

      if (existingUser && !existingUser.email_confirmed_at) {
        const { data: updatedUser, error: updateErr } = await adminSupabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password,
            email_confirm: true,
            user_metadata: {
              ...(existingUser.user_metadata || {}),
              full_name: cleanName,
              role: (existingUser.user_metadata as any)?.role || 'user',
            },
          }
        );
        if (updateErr || !updatedUser.user) {
          return { error: updateErr?.message || adminCreateError.message };
        }
        userId = updatedUser.user.id;
        createdAt = updatedUser.user.created_at;
      } else if (existingUser) {
        return { error: 'An account with this email address already exists. Please sign in instead.' };
      } else {
        // Fallback to standard signUp if service role key is unavailable
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: cleanName, role: 'user' },
          },
        });
        if (signUpError || !signUpData.user) {
          return { error: signUpError?.message || adminCreateError.message };
        }
        userId = signUpData.user.id;
        createdAt = signUpData.user.created_at;
      }
    } else if (adminCreated.user) {
      userId = adminCreated.user.id;
      createdAt = adminCreated.user.created_at;
    }

    if (!userId) {
      return { error: 'Supabase did not create the account.' };
    }

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
): Promise<{ user?: AuthUser; error?: string }> {
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
        if (existingUser && !existingUser.email_confirmed_at) {
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
        .select('id, full_name, email, role, profile_image_url, created_at')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!profileError && profData) {
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
          .select('id, full_name, email, role, profile_image_url, created_at')
          .maybeSingle();
        if (insertedProfile) {
          profile = insertedProfile;
        }
      }
    } catch {
      // Ignore profile query failure, continue with auth user details
    }

    const metadata = (data.user.user_metadata || {}) as Record<string, any>;
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

    return {
      user: {
        id: data.user.id,
        full_name: fullName,
        email: data.user.email || cleanEmail,
        role: role,
        profile_image_url: profileImageUrl,
        created_at: profile?.created_at || data.user.created_at,
      },
    };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Could not connect to Supabase Auth.' };
  }
}
