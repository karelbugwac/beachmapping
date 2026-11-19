'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle, LogOut, Mail, RefreshCw } from 'lucide-react';

interface AccountState {
  id: string;
  role: string;
  status: 'active' | 'suspended';
  suspension_reason: string | null;
  suspended_at: string | null;
  suspension_ends_at: string | null;
}

async function fetchAccountState(): Promise<AccountState | null> {
  const response = await fetch('/api/auth/session', { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to verify account status.');
  const data = await response.json();
  return data.user as AccountState | null;
}

function formatDate(value: string | null): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function AccountSuspensionGate() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const bypassGate = isAdminRoute || pathname === '/suspended' || pathname === '/login' || pathname === '/owner/login';
  const [account, setAccount] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bypassGate) return;

    let active = true;
    fetchAccountState()
      .then((user) => {
        if (!active) return;
        setAccount(user);
        setLoadError(false);
        setHasLoaded(true);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bypassGate, pathname]);

  useEffect(() => {
    if (!account || account.status !== 'suspended') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [account]);

  const logOut = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
    }
  };

  const retryAccountCheck = useCallback(async () => {
    setLoading(true);
    try {
      const user = await fetchAccountState();
      setAccount(user);
      setLoadError(false);
      setHasLoaded(true);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  if (bypassGate) return null;

  const isSuspended = account?.status === 'suspended';
  if (loading && !hasLoaded) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50 dark:bg-black" role="status" aria-live="polite">
        <span className="text-sm font-medium text-slate-600 dark:text-neutral-300">Checking account status...</span>
      </div>
    );
  }

  if (!isSuspended && !loadError) return null;

  const isOwner = account?.role === 'beach_owner' || account?.role === 'beach_manager';
  const title = isSuspended
    ? isOwner ? 'Your beach listing account has been suspended' : 'Your account has been suspended'
    : 'We could not verify your account status';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-suspension-title"
        aria-describedby="account-suspension-description"
        className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl dark:border-amber-900 dark:bg-neutral-900 sm:p-6"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
          }
          if (event.key === 'Tab') {
            const items = dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
            if (!items?.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 id="account-suspension-title" className="text-lg font-bold leading-snug text-brand-navy-600 dark:text-white">
          {title}
        </h1>
        <div id="account-suspension-description" className="mt-4 space-y-3 text-sm text-slate-700 dark:text-neutral-300">
          {isSuspended ? (
            <>
              <p><span className="font-semibold">Reason:</span> {account.suspension_reason?.trim() || 'No reason was provided. Please contact support.'}</p>
              <p><span className="font-semibold">Suspended on:</span> {formatDate(account.suspended_at)}</p>
              <p><span className="font-semibold">Duration:</span> {account.suspension_ends_at ? `Until ${formatDate(account.suspension_ends_at)}` : 'Indefinite'}</p>
              <p className="pt-1">If you believe this is a mistake, please contact support.</p>
            </>
          ) : (
            <p>We couldn&apos;t confirm your account status. Please retry or contact support.</p>
          )}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {loadError && !isSuspended && (
            <button
              type="button"
              onClick={() => void retryAccountCheck()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => void logOut()}
            disabled={loggingOut}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
          <a
            href="mailto:support@dagattabai.ph"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
