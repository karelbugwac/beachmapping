'use client';

import { useSyncExternalStore } from 'react';
import type { AuthUser } from '@/lib/db/auth';

export interface AuthSessionSnapshot {
  user: (AuthUser & { account_full_name?: string | null }) | null;
  loaded: boolean;
}

const serverSnapshot: AuthSessionSnapshot = { user: null, loaded: false };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();

export function subscribeToAuthSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthSessionSnapshot() {
  return snapshot;
}

export function publishAuthSession(
  user: AuthSessionSnapshot['user'],
  loaded = true
) {
  snapshot = { user, loaded };
  listeners.forEach((listener) => listener());
}

export function updateAuthSessionUser(update: (user: AuthSessionSnapshot['user']) => AuthSessionSnapshot['user']) {
  publishAuthSession(update(snapshot.user), snapshot.loaded);
}

export function useAuthSession() {
  return useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSessionSnapshot,
    () => serverSnapshot
  );
}
