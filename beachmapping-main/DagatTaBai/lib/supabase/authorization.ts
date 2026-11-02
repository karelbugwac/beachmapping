import { cookies } from 'next/headers';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

interface CachedAuth {
  user: any;
  role: string;
  expiresAt: number;
}

const AUTH_CACHE_TTL_MS = 15_000; // 15 seconds short-lived burst cache
const authCache = new Map<string, CachedAuth>();

async function getSessionCacheKey(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const authCookies = cookieStore
      .getAll()
      .filter((c) => c.name.includes('auth-token'))
      .map((c) => `${c.name}=${c.value}`)
      .join(';');
    return authCookies || null;
  } catch {
    return null;
  }
}

export async function authorizeRoles(allowedRoles: string[]) {
  const adminClient = createAdminClient();
  const cacheKey = await getSessionCacheKey();
  const now = Date.now();

  if (cacheKey) {
    const cached = authCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      if (!cached.role || !allowedRoles.includes(cached.role)) {
        return { authorized: false as const, status: 403, message: 'You do not have permission to perform this action.' };
      }
      return { authorized: true as const, user: cached.user, role: cached.role, adminClient };
    }
  }

  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) {
    if (cacheKey) authCache.delete(cacheKey);
    return { authorized: false as const, status: 401, message: 'Authentication required.' };
  }

  const userEmail = data.user.email?.toLowerCase().trim() || '';
  const allowedAdminEmails = (process.env.ADMIN_ALLOWED_EMAILS || 'official.dagattabai@gmail.com,admin@dagattabai.ph')
    .split(',')
    .map((e) => e.trim().toLowerCase());

  const { data: profile, error: profileError } = await (adminClient.from('profiles') as any)
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    return { authorized: false as const, status: 500, message: 'Could not verify account permissions.' };
  }

  let resolvedRole: string = profile?.role || data.user.user_metadata?.role || '';

  // Check if user is whitelisted admin
  if (allowedAdminEmails.includes(userEmail)) {
    resolvedRole = 'admin';
    if (profile?.role !== 'admin') {
      // Sync profile role to admin if missing
      await (adminClient.from('profiles') as any)
        .update({ role: 'admin' })
        .eq('id', data.user.id);
    }
  }

  if (cacheKey && resolvedRole) {
    if (authCache.size > 100) {
      for (const [key, val] of authCache.entries()) {
        if (val.expiresAt <= now) authCache.delete(key);
      }
    }
    authCache.set(cacheKey, {
      user: data.user,
      role: resolvedRole,
      expiresAt: now + AUTH_CACHE_TTL_MS,
    });
  }

  if (!resolvedRole || !allowedRoles.includes(resolvedRole)) {
    return { authorized: false as const, status: 403, message: 'You do not have permission to perform this action.' };
  }

  return { authorized: true as const, user: data.user, role: resolvedRole, adminClient };
}
