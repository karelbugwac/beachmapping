import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'beach_owner' | 'beach_manager' | 'admin';
  profile_image_url?: string | null;
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
        .select('id, full_name, email, role, profile_image_url, created_at')
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
}): Promise<AuthUser | null> {
  const current = await getCurrentSession();
  if (!current) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ...(updates.full_name !== undefined ? { full_name: updates.full_name } : {}),
        ...(updates.profile_image_url !== undefined ? { profile_image_url: updates.profile_image_url } : {}),
      },
    });
    if (authError) return null;

    try {
      await (supabase.from('profiles') as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', current.id);
    } catch {
      // Ignore if profiles row update isn't allowed by RLS
    }

    return { ...current, ...updates };
  } catch {
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
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: cleanName, role: 'user' } },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Supabase did not create the account.' };

    return {
      user: {
        id: data.user.id,
        full_name: cleanName,
        email: cleanEmail,
        role: 'user',
        created_at: data.user.created_at,
      },
      requiresEmailConfirmation: !data.session,
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
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user) return { error: error?.message || 'Invalid email address or password.' };

    let profile: any = null;
    try {
      const { data: profData, error: profileError } = await (supabase.from('profiles') as any)
        .select('id, full_name, email, role, profile_image_url, created_at')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!profileError && profData) {
        profile = profData;
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
