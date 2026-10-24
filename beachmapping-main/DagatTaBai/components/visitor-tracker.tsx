'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_STORAGE_KEY = 'dagattabai_visitor_session';

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }

      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, path: pathname }),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Analytics are optional; browsing must work when storage is unavailable.
    }
  }, [pathname]);

  return null;
}