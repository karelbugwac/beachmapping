'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  Bell,
  Home,
  Compass,
  Map,
  CloudSun,
  Calendar,
  Store,
  ShieldCheck,
  Info,
  Mail,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
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
  const router = useRouter();

  const isDedicatedPortal =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/staff') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  const hasTransparentHero = pathname === '/' || pathname === '/home';
  const isTransparent = hasTransparentHero && !isScrolled;

  useEffect(() => {
    let frameId: number | null = null;
    const updateScrollState = () => {
      frameId = null;
      const scrolled = window.scrollY > 35;
      setIsScrolled((current) => (current === scrolled ? current : scrolled));
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
  }, []);

  const navLinks = [
    { label: 'Home', href: user ? '/home' : '/', icon: Home, description: 'Return to main portal' },
    { label: 'Explore Beaches', href: '/beaches', icon: Compass, description: 'Verified resort profiles & amenities' },
    { label: 'Interactive Map', href: '/map', icon: Map, description: 'Full-screen coastline map & route calculator' },
    { label: 'Weather & Tides', href: '/weather', icon: CloudSun, description: 'Live sea conditions & forecasts' },
    { label: 'Trip Planner', href: user ? '/home#planner' : '/map', icon: Calendar, description: '4-day beach weather planner' },
    { label: 'Apply as Beach Owner', href: '/apply', icon: Store, description: 'Register your resort or cottage' },
    ...(user ? [{ label: 'My Application Status', href: '/apply/status', icon: ShieldCheck, description: 'Track your application' }] : []),
    { label: 'About Catmon', href: '/about', icon: Info, description: 'Learn about Binongkalan coastline' },
    { label: 'Contact & Support', href: '/contact', icon: Mail, description: 'Inquiries & direct assistance' },
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
        const sessionUser = res.ok && data.user ? (data.user as AuthUser) : null;
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
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
    <>
      <header
        className={`${
          hasTransparentHero ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
        } z-40 transition-all duration-300 ease-in-out ${
          isTransparent
            ? 'bg-transparent border-transparent shadow-none'
            : 'bg-white/95 dark:bg-[#0c1424]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800/80 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            {/* ── LEFT: Hamburger Menu Button ── */}
            <div className="flex-1 flex items-center justify-start">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:bg-white/15 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]'
                    : 'text-slate-800 dark:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800'
                }`}
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.2em]">
                  Menu
                </span>
              </button>
            </div>

            {/* ── CENTER: Brand Crest (Stacked Logo & Luxury Typography) ── */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <Link
                href={user ? '/home' : '/'}
                className="group flex flex-col items-center justify-center text-center select-none py-1 transition-transform duration-200 hover:scale-[1.02]"
                aria-label="Dagat Ta Bai Home"
              >
                {/* Crest Icon */}
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 mb-0.5 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src="/logo.png"
                    alt="Dagat Ta Bai Logo"
                    fill
                    sizes="36px"
                    className={`object-contain transition-all duration-200 ${
                      isTransparent ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]' : ''
                    }`}
                    priority
                  />
                </div>

                {/* Brand Title: High-end coastal typography */}
                <span
                  className={`font-display text-sm sm:text-base md:text-lg font-black tracking-[0.22em] sm:tracking-[0.26em] uppercase leading-none transition-colors duration-200 ${
                    isTransparent
                      ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'
                      : 'text-[#1F3F74] dark:text-[#5B9BD5]'
                  }`}
                >
                  Dagat Ta Bai
                </span>

                {/* Subtitle: Binongkalan · Catmon */}
                <span
                  className={`text-[7.5px] sm:text-[8.5px] font-sans font-semibold tracking-[0.28em] sm:tracking-[0.32em] uppercase mt-1 leading-none transition-colors duration-200 ${
                    isTransparent
                      ? 'text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Binongkalan · Catmon
                </span>
              </Link>
            </div>

            {/* ── RIGHT: Theme Toggle & Actions (Sign Up / User Profile) ── */}
            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
              {/* Theme Toggle Button with wave sailboat transition */}
              <ThemeToggle isTransparent={isTransparent} />

              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Notifications Bell */}
                  <Link
                    href="/notifications"
                    title="Notifications"
                    aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                    className={`relative rounded-full p-2 transition-colors ${
                      isTransparent
                        ? 'text-white hover:bg-white/15 drop-shadow-sm'
                        : pathname === '/notifications'
                          ? 'text-[#1F3F74] dark:text-[#5B9BD5]'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>

                  {/* Circular Profile Avatar */}
                  <Link
                    href="/profile"
                    title={`Account Settings (${getDisplayName(user)})`}
                    aria-label="Account Settings"
                    className={`relative group p-0.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                      isTransparent
                        ? 'ring-2 ring-white/50 hover:ring-white'
                        : 'ring-2 ring-brand-teal-400/30 hover:ring-[#1F3F74] dark:hover:ring-[#5B9BD5]'
                    }`}
                  >
                    <div className="relative w-8 h-8 rounded-full bg-[#1F3F74] dark:bg-[#285091] text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs">
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

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isTransparent
                        ? 'text-white/80 hover:text-rose-300 hover:bg-white/15'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : !authLoading ? (
                /* Public / Visitor: Sign Up Button */
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#285091] rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 border border-white/20"
                >
                  Sign Up
                </Link>
              ) : (
                <div className="h-8 w-20" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── SLIDE-OVER NAVIGATION DRAWER ── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="fixed inset-y-0 left-0 z-[10001] w-full max-w-xs sm:max-w-sm bg-white dark:bg-[#0c1424] text-slate-900 dark:text-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 border-r border-slate-200 dark:border-neutral-800"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
              <Link
                href={user ? '/home' : '/'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 group"
              >
                <div className="relative w-8 h-8">
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
                </div>
                <div>
                  <div className="font-display font-black text-sm tracking-[0.2em] text-[#1F3F74] dark:text-[#5B9BD5] uppercase leading-none">
                    Dagat Ta Bai
                  </div>
                  <div className="text-[7.5px] tracking-[0.25em] text-slate-400 uppercase font-semibold mt-1 leading-none">
                    Binongkalan · Catmon
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
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
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-[#1F3F74]/10 dark:bg-[#1F3F74]/30 text-[#1F3F74] dark:text-[#5B9BD5] font-bold border-l-4 border-[#1F3F74] dark:border-[#5B9BD5]'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#1F3F74] dark:text-[#5B9BD5]' : 'text-slate-400 dark:text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-tight">{link.label}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                        {link.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-neutral-800/80 space-y-4 bg-slate-50/50 dark:bg-black/20">
              {/* Theme Toggle */}
              <ThemeToggle variant="drawer" />

              {/* Auth Actions */}
              {user ? (
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1F3F74] text-white flex items-center justify-center font-bold text-[10px]">
                      {getDisplayName(user).charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div>{getDisplayName(user)}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">{user.email}</div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : !authLoading ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#285091] rounded-full shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : null}

              {/* Direct Gmail support link */}
              <div className="text-center pt-1">
                <a
                  href="mailto:support.dagattabai@gmail.com"
                  className="text-[11px] text-slate-400 hover:text-[#1F3F74] dark:hover:text-[#5B9BD5] transition-colors"
                >
                  support.dagattabai@gmail.com
                </a>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
