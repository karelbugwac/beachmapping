'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const role = (session.user.user_metadata?.role as string) || (session.user.app_metadata?.role as string);
          if (role === 'admin') {
            router.replace('/admin/dashboard');
            return;
          }
          const { data: profile } = await (supabase.from('profiles') as any)
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile?.role === 'admin') {
            router.replace('/admin/dashboard');
            return;
          }
        }
      } catch {
        // Fallback to login page
      }
      router.replace('/admin/login');
    };
    void checkAndRedirect();
  }, [router]);

  return null;
}
