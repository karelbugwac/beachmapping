'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import type { AuthUser } from '@/lib/db/auth';
import { publishAuthSession, updateAuthSessionUser } from '@/lib/client/auth-session-store';
import { signOutAndClearClientState } from '@/lib/client/logout';

// Helper function to get display name from AuthUser
function getDisplayName(user: AuthUser): string {
  return user.full_name || user.email?.split('@')[0] || 'User';
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { theme, toggleTheme } = useTheme();

  const isDedicatedPortal =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/staff') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  useEffect(() => {
    let frameId: number | null = null;
    const updateScrollState = () => {
      frameId = null;
      const nextIsScrolled = isHomePage && window.scrollY > 50;
      setIsScrolled((current) => current === nextIsScrolled ? current : nextIsScrolled);
    };
    const scheduleScrollStateUpdate = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(updateScrollState);
    };

    scheduleScrollStateUpdate();
    window.addEventListener('scroll', scheduleScrollStateUpdate, { passive: true });
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleScrollStateUpdate);
    };
  }, [isHomePage]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Weather Forecast', href: '/weather' },
    { label: 'Apply', href: '/apply' },
    ...(user ? [{ label: 'My application', href: '/apply/status' }] : []),
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // Fetch session user once on mount (or when leaving dedicated portal), and listen for auth/profile updates
  useEffect(() => {
    if (isDedicatedPortal) return;
    let isMounted = true;
    let authGeneration = 0;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const checkSession = async () => {
      const requestGeneration = authGeneration;
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();
        if (!isMounted || requestGeneration !== authGeneration) return;
        const sessionUser = res.ok && data.user ? data.user as AuthUser : null;
        setUser(sessionUser);
        publishAuthSession(sessionUser);
      } catch {
        if (!isMounted || requestGeneration !== authGeneration) return;
        setUser(null);
        publishAuthSession(null);
      } finally {
        if (isMounted && requestGeneration === authGeneration) {
          setAuthLoading(false);
        }
      }
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
              authGeneration += 1;
              setUser(null);
              publishAuthSession(null);
              setUnreadNotifications(0);
              setAuthLoading(false);
            }
          }
        });
        authSubscription = data.subscription;
      })
      .catch(() => {});

    const handleLogout = () => {
      authGeneration += 1;
      setUser(null);
      publishAuthSession(null);
      setUnreadNotifications(0);
      setAuthLoading(false);
    };
    window.addEventListener('dtb_logout_completed', handleLogout);

    const handleUserUpdate = (event: Event) => {
      const detail = (event as CustomEvent<Partial<AuthUser>>).detail;
      if (detail && isMounted) {
        setUser((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            ...detail,
            full_name: detail.full_name !== undefined ? detail.full_name : prev.full_name,
            profile_image_url: detail.profile_image_url !== undefined ? detail.profile_image_url : prev.profile_image_url,
          };
          updateAuthSessionUser(() => updated);
          return updated;
        });
      }
    };
    const handleLoginCompleted = () => {
      void checkSession();
    };
    window.addEventListener('dtb_user_updated', handleUserUpdate);
    window.addEventListener('dtb_login_completed', handleLoginCompleted);

    return () => {
      isMounted = false;
      window.removeEventListener('dtb_logout_completed', handleLogout);
      authSubscription?.unsubscribe();
      window.removeEventListener('dtb_user_updated', handleUserUpdate);
      window.removeEventListener('dtb_login_completed', handleLoginCompleted);
    };
  }, [isDedicatedPortal]);

  useEffect(() => {
    if (!user || isDedicatedPortal) return;

    let isMounted = true;
    const refreshCount = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        if (response.status === 401) {
          if (isMounted) setUnreadNotifications(0);
          return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(`Notification endpoint returned ${response.status} without a JSON response.`);
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
  }, [user, pathname, isDedicatedPortal]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOutAndClearClientState(user?.id);
    } catch (error: unknown) {
      console.error('Sign-out cleanup did not complete:', error);
    } finally {
      setUser(null);
      publishAuthSession(null);
      setMobileMenuOpen(false);
      window.location.replace('/login');
    }
  };

  if (isDedicatedPortal) return null;

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        isHomePage
          ? isScrolled
            ? 'bg-brand-navy-700/95 dark:bg-black/95 border-white/10 backdrop-blur-md shadow-sm -mb-16 md:-mb-[72px]'
            : 'bg-transparent border-transparent -mb-16 md:-mb-[72px]'
          : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-900'
      }`}
    >
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
                src="/logo.png"
                alt="Dagat Ta Bai Logo"
                fill
                sizes="(max-width: 640px) 36px, 40px"
                className="object-contain"
                priority
              />
            </div>
            <span className="font-sans font-extrabold text-xl tracking-tight text-brand-navy-500 dark:text-brand-teal-300">
              Dagat Ta Bai
            </span>
          </Link>

          {/* Center Navigation Links: Home, Weather, Apply, About, Contact */}
          <nav className="hidden min-w-0 md:flex items-stretch self-stretch h-full gap-0 lg:gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' &&
                  pathname?.startsWith(link.href) &&
                  !(link.href === '/apply' && pathname?.startsWith('/apply/status')));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative inline-flex shrink-0 items-center whitespace-nowrap px-0.5 lg:px-3.5 text-[11px] lg:text-sm font-medium transition-colors duration-150 ${
                    isHomePage
                      ? isActive
                        ? 'text-brand-teal-200 font-bold'
                        : 'text-white hover:text-brand-teal-100'
                      : isActive
                        ? 'text-brand-navy-500 dark:text-brand-teal-300 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy-500 dark:hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive ? (
                    <span className={`absolute bottom-0 left-0 right-0 h-[3px] ${isHomePage ? 'bg-brand-teal-300' : 'bg-brand-navy-500 dark:bg-brand-teal-600'}`} />
                  ) : (
                    <span className={`absolute bottom-0 left-0 right-0 h-[2px] ${isHomePage ? 'bg-white/70' : 'bg-slate-300 dark:bg-neutral-700'} scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center`} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: User Avatar Circle (links directly to /profile) + Direct Sign Out Button */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {/* Theme Toggle Button with Ocean Wave Transition */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-[#1F3F74] dark:hover:text-[#4987BA] hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'Switch to light mode (Sunlit Shore)' : 'Switch to dark mode (Night Tide)'}
              title={theme === 'dark' ? 'Switch to Sunlit Shore (Light)' : 'Switch to Night Tide (Dark)'}
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px] text-amber-400" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-[#1F3F74]" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/notifications"
                  title="Notifications"
                  aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                  className={`relative rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-800 ${
                    pathname === '/notifications'
                      ? 'text-brand-navy-500 dark:text-brand-teal-300'
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
                  className="relative group p-0.5 rounded-full ring-2 ring-brand-teal-400/20 dark:ring-brand-teal-400/30 hover:ring-brand-teal-400 dark:hover:ring-brand-teal-400 transition-all cursor-pointer flex-shrink-0"
                >
                  <div className="relative w-8 h-8 rounded-full bg-brand-navy-500 dark:bg-brand-teal-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs">
                    <span>{getDisplayName(user).charAt(0).toUpperCase()}</span>
                    {user.profile_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={user.profile_image_url}
                        src={user.profile_image_url}
                        alt=""
                        width={32}
                        height={32}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        style={{ aspectRatio: '1 / 1' }}
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
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-navy-500 dark:hover:bg-brand-navy-600 rounded-full transition-colors shadow-sm"
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
                  isHomePage
                    ? 'text-white'
                    : pathname === '/notifications'
                      ? 'text-brand-navy-500 dark:text-brand-teal-300'
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
                className="relative w-7 h-7 rounded-full bg-brand-navy-500 dark:bg-brand-teal-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs"
                title="Account Settings"
              >
                <span>{getDisplayName(user).charAt(0).toUpperCase()}</span>
                {user.profile_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={user.profile_image_url}
                    src={user.profile_image_url}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    style={{ aspectRatio: '1 / 1' }}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </Link>
            </>
            )}

            {/* Mobile Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to Sunlit Shore (Light)' : 'Switch to Night Tide (Dark)'}
              title={theme === 'dark' ? 'Switch to Sunlit Shore (Light)' : 'Switch to Night Tide (Dark)'}
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px] text-amber-400" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-[#1F3F74]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 rounded-lg transition-colors ${
                isHomePage
                  ? 'text-white hover:bg-white/10'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full z-[60] max-h-[calc(100dvh-var(--navbar-height))] overflow-y-auto overscroll-contain border-b border-slate-200 dark:border-neutral-900 bg-white dark:bg-black px-4 pt-3 pb-5 space-y-3 md:hidden">
          <div className="space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' &&
                  pathname?.startsWith(link.href) &&
                  !(link.href === '/apply' && pathname?.startsWith('/apply/status')));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 text-sm transition-colors rounded-r-lg ${
                    isActive
                      ? 'text-brand-navy-500 dark:text-brand-teal-300 font-bold border-l-[3px] border-brand-navy-500 dark:border-brand-teal-600 bg-brand-navy-50/50 dark:bg-neutral-900/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-2">
            {/* Mobile Drawer Theme Switcher */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#1F3F74]" />
                )}
                <span>{theme === 'dark' ? 'Sunlit Shore (Light)' : 'Night Tide (Dark)'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Theme</span>
            </button>
            {user ? (
              <div>
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
                className="block text-center px-4 py-2.5 text-xs font-bold text-white bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-navy-500 dark:hover:bg-brand-navy-600 rounded-full"
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
