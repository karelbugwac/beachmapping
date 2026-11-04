'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Bell,
} from 'lucide-react';
import type { AuthUser } from '@/lib/db/auth';

// Helper function to get display name from AuthUser
function getDisplayName(user: AuthUser): string {
  return user.full_name || user.email?.split('@')[0] || 'User';
}

function isUserRole(role: unknown): role is AuthUser['role'] {
  return role === 'user' || role === 'beach_owner' || role === 'beach_manager' || role === 'admin';
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const pathname = usePathname();
  const router = useRouter();

  const isDedicatedPortal =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/staff') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Weather', href: '/weather' },
    { label: 'Apply', href: '/apply' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // Fetch session user once on mount (or when leaving dedicated portal), and listen for auth/profile updates
  useEffect(() => {
    if (isDedicatedPortal) return;
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();
        if (data.user && isMounted) {
          setUser(data.user);
          setAuthLoading(false);
          return;
        }
      } catch {}

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData?.session?.user;
        if (sbUser && isMounted) {
          setUser({
            id: sbUser.id,
            full_name:
              sbUser.user_metadata?.full_name ||
              sbUser.user_metadata?.name ||
              sbUser.email?.split('@')[0] ||
              'User',
            email: sbUser.email || '',
            role: isUserRole(sbUser.user_metadata?.role) ? sbUser.user_metadata.role : 'user',
            profile_image_url:
              sbUser.user_metadata?.profile_image_url ||
              sbUser.user_metadata?.avatar_url ||
              sbUser.user_metadata?.picture ||
              null,
            created_at: sbUser.created_at,
          });
          setAuthLoading(false);
          return;
        }
      } catch {}

      if (isMounted) setUser(null);
      if (isMounted) setAuthLoading(false);
    };

    void checkSession();

    import('@/lib/supabase/client')
      .then(({ createClient }) => {
        if (!isMounted) return;
        const supabase = createClient();
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            void checkSession();
          } else if (event === 'SIGNED_OUT') {
            if (isMounted) {
              setUser(null);
              setUnreadNotifications(0);
              setAuthLoading(false);
            }
          }
        });
        authSubscription = data.subscription;
      })
      .catch(() => {});

    const handleUserUpdate = (event: Event) => {
      const detail = (event as CustomEvent<Partial<AuthUser>>).detail;
      if (detail && isMounted) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...detail,
            full_name: detail.full_name !== undefined ? detail.full_name : prev.full_name,
            profile_image_url: detail.profile_image_url !== undefined ? detail.profile_image_url : prev.profile_image_url,
          };
        });
      }
    };
    window.addEventListener('dtb_user_updated', handleUserUpdate);

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      window.removeEventListener('dtb_user_updated', handleUserUpdate);
    };
  }, [isDedicatedPortal]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const refreshCount = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        if (response.status === 401) {
          if (isMounted) setUnreadNotifications(0);
          return;
        }
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load notification count.');
        if (isMounted) setUnreadNotifications(Number(result.unreadCount) || 0);
      } catch (error: unknown) {
        console.error('Could not refresh notification count:', error);
      }
    };

    const refreshOnUpdate = () => void refreshCount();
    void refreshCount();
    const intervalId = window.setInterval(refreshCount, 30_000);
    window.addEventListener('dtb_notifications_updated', refreshOnUpdate);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('dtb_notifications_updated', refreshOnUpdate);
    };
  }, [user, pathname]);

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    } finally {
      setUser(null);
      setMobileMenuOpen(false);
      router.push('/login');
      router.refresh();
    }
  };

  if (isDedicatedPortal) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo & Platform Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
            aria-label="Dagat Ta Bai Home"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="Dagat Ta Bai Logo"
                fill
                sizes="(max-width: 640px) 36px, 40px"
                className="object-contain"
                priority
              />
            </div>
            <span className="font-sans font-extrabold text-xl tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
              Dagat Ta Bai
            </span>
          </Link>

          {/* Center Navigation Links: Home, Weather, Apply, About, Contact */}
          <nav className="hidden md:flex items-stretch self-stretch h-full gap-0.5 lg:gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative inline-flex items-center px-3.5 lg:px-4 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-[#1F3F74] dark:text-[#4987BA] font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#1F3F74] dark:hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive ? (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1F3F74] dark:bg-[#4987BA]" />
                  ) : (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-300 dark:bg-neutral-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: User Avatar Circle (links directly to /profile) + Direct Sign Out Button */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/notifications"
                  title="Notifications"
                  aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                  className={`relative rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-800 ${
                    pathname === '/notifications'
                      ? 'text-[#1F3F74] dark:text-[#4987BA]'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Link>
                {/* Circular Profile Avatar (Direct link to Settings, NO dropdown) */}
                <Link
                  href="/profile"
                  title={`Account Settings (${getDisplayName(user)})`}
                  aria-label="Account Settings"
                  className="relative group p-0.5 rounded-full ring-2 ring-[#1F3F74]/20 dark:ring-[#4987BA]/30 hover:ring-[#1F3F74] dark:hover:ring-[#4987BA] transition-all cursor-pointer flex-shrink-0"
                >
                  <div className="relative w-8 h-8 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs">
                    <span>{getDisplayName(user).charAt(0).toUpperCase()}</span>
                    {user.profile_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={user.profile_image_url}
                        src={user.profile_image_url}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>
                </Link>

                {/* Direct Sign Out Icon Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : !authLoading ? (
              /* Public / Unauthenticated: Sign Up button */
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] rounded-full transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            ) : (
              <div className="h-9 w-24" aria-hidden="true" />
            )}
          </div>

          {/* Mobile Actions: Circular Avatar or Menu Toggle */}
          <div className="flex items-center gap-2.5 md:hidden">
            {user && (
              <>
              <Link
                href="/notifications"
                title="Notifications"
                aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                className={`relative rounded-full p-1.5 ${
                  pathname === '/notifications'
                    ? 'text-[#1F3F74] dark:text-[#4987BA]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="relative w-7 h-7 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs"
                title="Account Settings"
              >
                <span>{getDisplayName(user).charAt(0).toUpperCase()}</span>
                {user.profile_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={user.profile_image_url}
                    src={user.profile_image_url}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </Link>
            </>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-neutral-900 bg-white dark:bg-black px-4 pt-3 pb-5 space-y-3">
          <div className="space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 text-sm transition-colors rounded-r-lg ${
                    isActive
                      ? 'text-[#1F3F74] dark:text-[#4987BA] font-bold border-l-[3px] border-[#1F3F74] dark:border-[#4987BA] bg-blue-50/50 dark:bg-neutral-900/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-2">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:bg-neutral-900 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4 text-[#1F3F74] dark:text-[#4987BA]" />
                    <span>Notifications</span>
                  </span>
                  {unreadNotifications > 0 && (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-neutral-900 rounded-xl"
                >
                  <UserIcon className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                  <span>Account Settings ({getDisplayName(user)})</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : !authLoading ? (
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] rounded-full"
              >
                Sign Up
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
