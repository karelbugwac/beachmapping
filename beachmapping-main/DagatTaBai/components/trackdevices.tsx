'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/feedback-toasts';
import { generateUUID } from '@/lib/utils/uuid';

const DEVICE_STORAGE_KEY = 'dtb_login_device_id';

function isDedicatedAuthPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/admin/login' ||
    pathname === '/owner/login' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  );
}

function getDeviceId(): string {
  try {
    const savedId = typeof window !== 'undefined' ? window.localStorage.getItem(DEVICE_STORAGE_KEY) : null;
    if (savedId) return savedId;
  } catch {
    // Ignore localStorage access restrictions
  }

  const deviceId = generateUUID();
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    }
  } catch {
    // Ignore localStorage access restrictions
  }
  return deviceId;
}

async function detectClientLocation(): Promise<string | null> {
  if (typeof window === 'undefined' || !navigator?.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { signal: controller.signal }
          );
          window.clearTimeout(timeoutId);
          if (!res.ok) {
            resolve(null);
            return;
          }
          const result = await res.json();
          const address = result.address || {};
          const town =
            address.town ||
            address.municipality ||
            address.city ||
            address.village ||
            address.county;
          const region = address.state || address.region;
          const detected = [town, region].filter(Boolean).join(', ');
          resolve(detected || null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 600000 }
    );
  });
}

export function LoginDeviceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (isDedicatedAuthPage(pathname)) return;

    const supabase = createClient();
    const trackedUsers = new Set<string>();
    let cancelled = false;

    const waitForServerSession = async (userId: string) => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (cancelled) return false;
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
      if (cancelled || isDedicatedAuthPage(window.location.pathname)) return;
      if (trackedUsers.has(userId)) return;
      trackedUsers.add(userId);

      try {
        if (!(await waitForServerSession(userId))) {
          trackedUsers.delete(userId);
          return;
        }

        const clientLocation = await detectClientLocation();
        if (cancelled || isDedicatedAuthPage(window.location.pathname)) {
          trackedUsers.delete(userId);
          return;
        }

        const response = await fetch('/api/auth/track-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: getDeviceId(),
            location: clientLocation,
          }),
        });
        const result = await response.json().catch(() => null);
        if (response.status === 401) {
          trackedUsers.delete(userId);
          return;
        }
        if (!response.ok) throw new Error(result?.error || 'Could not record this sign-in device.');

        if (result?.isNewLocation) {
          window.dispatchEvent(new Event('dtb_notifications_updated'));
          showToast(
            `Security Notice: New sign-in location detected (${result.newLocation}).`,
            'error'
          );
        }
      } catch (error: unknown) {
        trackedUsers.delete(userId);
        console.warn('Login device tracking skipped:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        trackedUsers.clear();
        return;
      }
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
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('dtb_login_completed', handleCompletedLogin);
    };
  }, [pathname]);

  return null;
}
