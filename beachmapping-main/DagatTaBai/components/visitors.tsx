'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { generateUUID } from '@/lib/utils/uuid';

const SESSION_STORAGE_KEY = 'dagattabai_visitor_session';

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (!pathname || typeof window === 'undefined') return;

      // Skip internal / dashboard / auth routes directly on client to avoid unnecessary network calls
      if (/^\/(admin|owner|staff|profile|login|register|forgot-password|reset-password)(\/|$)/.test(pathname)) {
        return;
      }

      // Respect user's cookie preferences: if user declined or opted for essential only, do not track telemetry
      const consent = localStorage.getItem('dtb_cookie_consent_v1');
      if (consent === 'declined' || consent === 'essential_only') {
        return;
      }

      let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionId) {
        sessionId = generateUUID();
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }

      // Check client-side deduplication for today
      const today = new Date().toISOString().slice(0, 10);
      const trackMarker = `vtrack_${sessionId.slice(0, 8)}_${pathname}_${today}`;
      if (sessionStorage.getItem(trackMarker)) {
        return;
      }

      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, path: pathname }),
        keepalive: true,
      })
        .then((res) => {
          if (res.ok) {
            sessionStorage.setItem(trackMarker, '1');
          }
        })
        .catch(() => undefined);
    } catch {
      // Analytics are optional; browsing must work smoothly even if storage is disabled.
    }
  }, [pathname]);

  return null;
}