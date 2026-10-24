import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Creates a browser-side Supabase client with typed schema.
 * Uses public anon key safe for browser exposure.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
