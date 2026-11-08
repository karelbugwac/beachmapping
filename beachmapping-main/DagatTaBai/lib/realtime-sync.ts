'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export type RealtimeSyncScope =
  | 'all'
  | 'beaches'
  | 'reviews'
  | 'requests'
  | 'applications'
  | 'users'
  | 'feedback'
  | 'notifications';

const BROADCAST_CHANNEL_NAME = 'dtb_realtime_sync';
const STORAGE_EVENT_KEY = 'dtb_realtime_sync_ts';
const SUPABASE_CHANNEL_NAME = 'dtb-live-sync';

/**
 * Broadcasts an immediate real-time sync signal across:
 * 1. Same-tab listeners (window CustomEvent)
 * 2. Cross-tab / cross-window listeners (BroadcastChannel & localStorage event)
 * 3. Cross-device / cross-browser listeners (Supabase Realtime Broadcast)
 */
export function notifyRealtimeSync(scope: RealtimeSyncScope = 'all') {
  if (typeof window === 'undefined') return;

  const payload = { scope, ts: Date.now() };

  // 1. Same-window custom event
  try {
    window.dispatchEvent(new CustomEvent('dtb_realtime_sync', { detail: payload }));
  } catch {}

  // 2. Cross-tab BroadcastChannel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage(payload);
      bc.close();
    }
  } catch {}

  // 3. Cross-tab localStorage event fallback
  try {
    window.localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(payload));
  } catch {}

  // 4. Cross-device Supabase Realtime broadcast
  try {
    const supabase = createClient();
    const channel = supabase.channel(SUPABASE_CHANNEL_NAME);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel
          .send({
            type: 'broadcast',
            event: 'sync',
            payload,
          })
          .finally(() => {
            void supabase.removeChannel(channel);
          });
      }
    });
  } catch {}
}

/**
 * Subscribes a component to real-time data changes across User, Beach Owner, and Admin portals.
 */
export function useRealtimeSync(
  onSync: () => void,
  options?: {
    pollIntervalMs?: number;
    debounceMs?: number;
    enabled?: boolean;
  }
) {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const debounceMs = options?.debounceMs ?? 250;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const triggerSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onSyncRef.current();
      }, debounceMs);
    };

    // 1. Same-window CustomEvent listener
    const handleCustomEvent = () => triggerSync();
    window.addEventListener('dtb_realtime_sync', handleCustomEvent);

    // 2. Cross-tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = () => triggerSync();
      }
    } catch {}

    // 3. Cross-tab localStorage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_EVENT_KEY) {
        triggerSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Visibility & Focus listener (instant refresh when switching tabs/windows)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        triggerSync();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // 5. Supabase Realtime (postgres_changes on public schema + broadcast channel)
    const supabase = createClient();
    const channel = supabase
      .channel(`${SUPABASE_CHANNEL_NAME}-${Math.random().toString(36).slice(2, 9)}`)
      .on('broadcast', { event: 'sync' }, () => {
        triggerSync();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          triggerSync();
        }
      )
      .subscribe();

    // 6. Fast polling fallback while tab is visible
    const intervalId =
      pollIntervalMs > 0
        ? window.setInterval(() => {
            if (document.visibilityState === 'visible') {
              onSyncRef.current();
            }
          }, pollIntervalMs)
        : null;

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('dtb_realtime_sync', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
      if (intervalId) window.clearInterval(intervalId);
      try {
        void supabase.removeChannel(channel);
      } catch {}
    };
  }, [pollIntervalMs, debounceMs, enabled]);
}
