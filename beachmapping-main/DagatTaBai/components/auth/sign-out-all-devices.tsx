'use client';

import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { confirmAction } from '@/components/ui/confirm-dialog';
import { showToast } from '@/components/ui/feedback-toasts';
import { signOutAndClearClientState } from '@/lib/client/logout';

const PENDING_TOAST_KEY = 'dtb:pending-toast';

interface SignOutAllDevicesButtonProps {
  loginPath?: '/login' | '/owner/login';
}

export function SignOutAllDevicesButton({
  loginPath = '/login',
}: SignOutAllDevicesButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    const confirmed = await confirmAction({
      title: 'Sign out of all devices?',
      message: "You'll need to log in again everywhere, including this device.",
      cancelLabel: 'Cancel',
      confirmLabel: 'Sign out all devices',
      danger: true,
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/sign-out-all', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Could not sign out of all devices. Please try again.');
      }

      try {
        await signOutAndClearClientState();
      } catch (error: unknown) {
        console.error(
          'Could not fully clear local sign-out state:',
          error instanceof Error ? error.message : 'unknown error'
        );
      }

      try {
        window.sessionStorage.setItem(PENDING_TOAST_KEY, 'Signed out of all devices');
      } catch {
        showToast('Signed out of all devices');
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      window.location.replace(loginPath);
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : 'Could not sign out of all devices. Please try again.',
        'error'
      );
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={loading}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40 sm:w-auto"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {loading ? 'Signing out…' : 'Sign out all devices'}
    </button>
  );
}
