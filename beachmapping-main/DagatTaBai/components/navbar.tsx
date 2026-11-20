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

  // Ultra-efficient passive scroll listener with RAF throttling to prevent long tasks
  useEffect(() => {
    let isTicking = false;
    const checkScroll = () => {
      const scrolled = window.scrollY > 35;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
      isTicking = false;
    };

    const handleScroll = () => {
      if (!isTicking) {
        isTicking = true;
        window.requestAnimationFrame(checkScroll);
      }
    };

    checkScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Desktop navigation links with strictly unique IDs
  const desktopLinks = [
    { id: 'desk-home', label: 'Home', href: user ? '/home' : '/' },
    { id: 'desk-weather', label: 'Weather', href: '/weather' },
    { id: 'desk-beaches', label: 'Explore Beaches', href: '/beaches' },
    { id: 'desk-apply', label: 'Apply', href: '/apply' },
    ...(user ? [{ id: 'desk-status', label: 'My application', href: '/apply/status' }] : []),
    { id: 'desk-about', label: 'About', href: '/about' },
    { id: 'desk-contact', label: 'Contact', href: '/contact' },
  ];

  // Mobile drawer links — simplified for landing page (no icons, no descriptions)
  const mobileDrawerLinks = [
    { id: 'mob-home', label: 'Home', href: user ? '/home' : '/' },
    { id: 'mob-about', label: 'About', href: '/about' },
    { id: 'mob-contact', label: 'Contact', href: '/contact' },
  ];

  // Fetch session user once on mount
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

  // On hero pages at top: nav links are hidden to keep the transparent video hero serene and clean.
  // On scroll (or on non-hero pages): nav links smoothly appear!
  const showDesktopLinks = !hasTransparentHero || isScrolled;

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
          <div className="flex items-center justify-between h-16 md:h-18">
            
            {/* ── LEFT: Logo & Brand Name (Title Case, Clean & Modern) ── */}
            <Link
              href={user ? '/home' : '/'}
              className="group flex items-center gap-2.5 sm:gap-3 flex-shrink-0 select-none py-1 transition-transform duration-200 hover:scale-[1.02]"
              aria-label="Dagat Ta Bai Home"
            >
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Dagat Ta Bai Logo"
                  width={36}
                  height={36}
                  style={{ width: 'auto', height: 'auto' }}
                  className={`object-contain transition-all duration-200 ${
                    isTransparent ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]' : ''
                  }`}
                  priority={false}
                />
              </div>

              {/* Modern Title Case Typography with Distinct Brand Accent */}
              <span
                className={`font-display font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight transition-colors duration-200 translate-y-[1.5px] inline-flex items-center ${
                  isTransparent
                    ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'
                    : 'text-[#1F3F74] dark:text-white'
                }`}
              >
                <span>Dagat Ta&nbsp;</span>
                <span className="text-[#F4BF3E] dark:text-[#F4BF3E] font-black transition-transform duration-200 group-hover:scale-105 inline-block">
                  Bai
                </span>
              </span>
            </Link>

            {/* ── CENTER: Desktop Navigation Links (Appears smoothly when scrolled) ── */}
            <nav
              aria-label="Main Navigation"
              className={`hidden md:flex items-center gap-1 lg:gap-1.5 transition-all duration-300 ease-out ${
                showDesktopLinks
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              {desktopLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' &&
                    pathname?.startsWith(link.href) &&
                    !(link.href === '/apply' && pathname?.startsWith('/apply/status')));
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`relative px-3 py-1.5 rounded-full text-xs lg:text-[13px] font-semibold transition-all duration-150 ${
                      isActive
                        ? 'text-[#1F3F74] dark:text-[#5B9BD5] bg-sky-50/80 dark:bg-sky-950/40 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* ── RIGHT: Theme Toggle (Desktop only) + CTA Button / User Profile ── */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Theme Toggle visible only on desktop — mobile uses the sidebar toggle */}
              <div className="hidden md:block">
                <ThemeToggle isTransparent={isTransparent} />
              </div>

              {user ? (
                <div className="flex items-center gap-2 sm:gap-2.5">
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

                  {/* Circular Profile Avatar with explicit dimensions */}
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
                          style={{ width: '32px', height: '32px', aspectRatio: '1 / 1' }}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </Link>

                  {/* Sign Out Button (Desktop) */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`hidden sm:inline-flex p-2 rounded-full transition-colors cursor-pointer ${
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
              ) : (
                /* Public / Visitor: Sign Up Button */
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs sm:text-[13px] font-black text-[#1F3F74] bg-[#F4BF3E] hover:bg-[#e2af35] rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 border border-amber-300/40"
                >
                  Sign Up
                </Link>
              )}

              {/* Mobile Menu Hamburger Toggle (Visible ONLY on mobile devices) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className={`md:hidden p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isTransparent
                    ? 'text-white hover:bg-white/15'
                    : 'text-slate-800 dark:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-800'
                }`}
                aria-label="Open Mobile Menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OVER NAVIGATION DRAWER (Optimized for Phone Touch UX) ── */}
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
            className="fixed inset-y-0 right-0 z-[10001] w-full max-w-xs sm:max-w-sm bg-[#0e1d35] dark:bg-[#071324] text-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-white/10"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <Link
                href={user ? '/home' : '/'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 group"
              >
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    style={{ width: 'auto', height: 'auto' }}
                    className="object-contain"
                  />
                </div>
                <span className="font-display font-extrabold text-base tracking-tight text-white translate-y-[1px] inline-flex items-center">
                  <span>Dagat Ta&nbsp;</span>
                  <span className="text-[#F4BF3E] font-black">
                    Bai
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links: Pure White Text, No Icons, No Descriptions */}
            <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              {mobileDrawerLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                      isActive
                        ? 'text-[#F4BF3E] bg-white/10 font-extrabold'
                        : 'text-white hover:text-[#F4BF3E] hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer: Modern Theme Toggle & Auth State if Logged In */}
            <div className="p-5 border-t border-white/10 space-y-4 bg-black/20">
              {/* Modern Style Theme Switch */}
              <ThemeToggle variant="drawer" />

              {/* Logged in User Management (if authenticated) */}
              {user && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1F3F74] text-white flex items-center justify-center font-bold text-[10px]">
                      {getDisplayName(user).charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-white font-medium">{getDisplayName(user)}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">{user.email}</div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
