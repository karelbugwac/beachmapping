'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check, CircleAlert, Clock3, MonitorSmartphone, ShieldCheck, MapPin, LogOut } from 'lucide-react';
import { showToast } from '@/components/ui/feedback-toasts';
import { SignOutAllDevicesButton } from '@/components/auth/signout';

interface NotificationItem {
  id: string;
  type: 'new_device_login' | 'new_location_login' | 'tour_status';
  createdat: string;
  readat: string | null;
  response: 'confirmed' | 'unrecognized' | null;
  title?: string | null;
  message?: string | null;
  actionurl?: string | null;
  browser: string;
  platform: string;
  location?: string | null;
  previous_location?: string | null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load notifications.');
        if (isMounted) setNotifications(result.notifications);
      } catch (error: unknown) {
        if (isMounted) showToast(error instanceof Error ? error.message : 'Could not load notifications.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleAction = async (notification: NotificationItem, action: 'read' | 'confirmed' | 'unrecognized' | 'logout_device') => {
    setBusyId(notification.id);
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (result.notification) {
        setNotifications((current) => current.map((item) => item.id === notification.id ? result.notification : item));
        window.dispatchEvent(new Event('dtb_notifications_updated'));
      }
      if (!response.ok) throw new Error(result.error || 'Could not update this notification.');
      if (action === 'confirmed') showToast('Activity confirmed as authorized.');
      if (action === 'unrecognized') showToast('Activity reported. Check your email for a password reset link.');
      if (action === 'logout_device') showToast('Signed out from this device successfully.');
      if (action === 'read') showToast('Notification marked as read.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not update this notification.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = notifications.filter((item) => !item.readat).length;

  return (
    <main className="min-h-[70vh] bg-white dark:bg-black px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-brand-navy-500 dark:text-white sm:text-4xl">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand-navy-50 px-3 py-1.5 text-xs font-semibold text-brand-navy-500 dark:bg-brand-navy-900/60 dark:text-brand-teal-200">
              {unreadCount} unread
            </span>
          )}
        </header>

        <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy-500 dark:text-brand-teal-300" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Security</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-neutral-400">
                Sign out everywhere if you no longer recognize a device.
              </p>
            </div>
          </div>
          <SignOutAllDevicesButton />
        </section>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center" aria-label="Loading notifications">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand-navy-500/20 border-t-brand-navy-500 dark:border-brand-teal-200/20 dark:border-t-brand-teal-200" />
          </div>
        ) : notifications.length === 0 ? (
          <section className="py-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-navy-500 text-white shadow-sm dark:bg-brand-navy-500">
              <Bell className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">You&apos;re all caught up</h2>
          </section>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isLocationAlert = notification.type === 'new_location_login';
              const isTourAlert = notification.type === 'tour_status';
              const isDeviceAlert = notification.type === 'new_device_login';
              return (
                <article
                  key={notification.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition-colors dark:bg-neutral-900 sm:p-6 ${
                    notification.readat ? 'border-slate-200 dark:border-neutral-800' : 'border-brand-navy-200 ring-1 ring-brand-teal-400 dark:border-brand-navy-900 dark:ring-brand-teal-400'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      notification.response === 'unrecognized'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
                        : notification.response === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : isLocationAlert
                            ? 'bg-brand-teal-50 text-brand-teal-600 dark:bg-brand-teal-700/60 dark:text-brand-teal-300'
                            : 'bg-brand-navy-50 text-brand-navy-500 dark:bg-brand-navy-900/60 dark:text-brand-teal-200'
                    }`}>
                      {notification.response === 'unrecognized'
                        ? <CircleAlert className="h-5 w-5" />
                        : notification.response === 'confirmed'
                          ? <ShieldCheck className="h-5 w-5" />
                          : isLocationAlert
                            ? <MapPin className="h-5 w-5" />
                            : <MonitorSmartphone className="h-5 w-5" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                          {notification.title || (isLocationAlert ? 'New sign-in location detected' : 'New sign-in detected')}
                        </h2>
                        {!notification.readat && <span className="h-2 w-2 rounded-full bg-brand-navy-600" aria-label="Unread" />}
                      </div>

                      {isTourAlert ? (
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.message}</p>
                      ) : isLocationAlert ? (
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          Your account was accessed from a new location: <strong className="font-semibold text-slate-800 dark:text-slate-100">{notification.location}</strong>
                          {' '}via {notification.browser} on {notification.platform}.
                        </p>
                      ) : (
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          Your account was accessed using <strong className="font-semibold text-slate-800 dark:text-slate-100">{notification.browser}</strong> on <strong className="font-semibold text-slate-800 dark:text-slate-100">{notification.platform}</strong>.
                        </p>
                      )}

                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        <time dateTime={notification.createdat}>{formatDate(notification.createdat)}</time>
                      </p>

                      {isTourAlert ? (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          {notification.actionurl && (
                            <Link
                              href={notification.actionurl}
                              className="rounded-lg bg-brand-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-600"
                            >
                              View tour
                            </Link>
                          )}
                          {!notification.readat && (
                            <button
                              type="button"
                              disabled={busyId === notification.id}
                              onClick={() => void handleAction(notification, 'read')}
                              className="text-sm font-semibold text-brand-navy-600 underline dark:text-brand-teal-200"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      ) : notification.response === 'confirmed' ? (
                        <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><Check className="h-4 w-4" />You confirmed this activity.</p>
                      ) : notification.response === 'unrecognized' ? (
                        <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-300"><CircleAlert className="h-4 w-4" />You reported this activity as unrecognized.</p>
                      ) : (
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={busyId === notification.id}
                            onClick={() => void handleAction(notification, 'confirmed')}
                            className="rounded-lg bg-brand-navy-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-500 disabled:cursor-wait disabled:opacity-60"
                          >
                            This was me
                          </button>
                          <button
                            type="button"
                            disabled={busyId === notification.id}
                            onClick={() => void handleAction(notification, 'unrecognized')}
                            className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                          >
                            This wasn&apos;t me
                          </button>
                          {isDeviceAlert && (
                            <button
                              type="button"
                              disabled={busyId === notification.id}
                              onClick={() => void handleAction(notification, 'logout_device')}
                              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-700 dark:text-slate-300 dark:hover:bg-neutral-800"
                            >
                              <LogOut className="h-4 w-4 inline-block mr-1" />
                              Log out from this device
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
