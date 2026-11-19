import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

/**
 * Server-side Supabase client para sa Server Components, Server Actions,
 * ug Route Handlers. Gamit ang cookies sa user (RLS applies).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies(); // Next 14: tangtanga ang "await"

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts = { ...options };
            if (process.env.NODE_ENV !== 'production') {
              opts.secure = false;
            }
            cookieStore.set(name, value, opts);
          });
        } catch {
          // Gitawag gikan sa Server Component, ok ra i-ignore.
        }
      },
    },
  });
}

let cachedAdminClient: SupabaseClient<any> | null = null;

/**
 * Admin / Service Role Client (Bypasses RLS).
 * Uses a high-performance singleton from @supabase/supabase-js without cookie overhead.
 * NEVER expose this to client components!
 */
export function createAdminClient(): SupabaseClient<any> {
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleKey;

  if (!cachedAdminClient) {
    cachedAdminClient = createClient<any>(adminUrl, adminKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return cachedAdminClient;
}
