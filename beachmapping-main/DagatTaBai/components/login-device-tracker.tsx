'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const DEVICE_STORAGE_KEY = 'dtb_login_device_id';

function getDeviceId(): string {
  const savedId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
  if (savedId) return savedId;

  const deviceId = window.crypto.randomUUID();
  window.localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
  return deviceId;
}

export function LoginDeviceTracker() {
  useEffect(() => {
    const supabase = createClient();
    const trackedUsers = new Set<string>();

    const waitForServerSession = async (userId: string) => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (response.ok) {
          const result = await response.json();
          if (result.user?.id === userId) return true;
        }

        if (attempt < 5) {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
      }

      return false;
    };

    const trackLogin = async (userId: string) => {
      if (trackedUsers.has(userId)) return;
      trackedUsers.add(userId);

      try {
        if (!(await waitForServerSession(userId))) {
          trackedUsers.delete(userId);
          return;
        }

        const response = await fetch('/api/auth/track-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: getDeviceId() }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || 'Could not record this sign-in device.');
      } catch (error: unknown) {
        trackedUsers.delete(userId);
        console.error('Login device tracking failed:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        void trackLogin(session.user.id);
      }
    });
    const handleCompletedLogin = (event: Event) => {
      const { userId } = (event as CustomEvent<{ userId: string }>).detail;
      if (userId) void trackLogin(userId);
    };
    window.addEventListener('dtb_login_completed', handleCompletedLogin);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('dtb_login_completed', handleCompletedLogin);
    };
  }, []);

  return null;
}
