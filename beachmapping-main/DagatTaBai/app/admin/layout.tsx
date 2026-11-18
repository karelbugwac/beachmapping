'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/feedback-toasts';
import { useRealtimeSync } from '@/lib/realtime-sync';
import { ShorelineMarker, VerifiedSanctuary } from '@/components/ui/coastal-icons';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingTourCount, setPendingTourCount] = useState<number>(0);
  const [pendingCoordCount, setPendingCoordCount] = useState<number>(0);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  // Server middleware (proxy.ts) already guards /admin/* routes, so render immediately
  // while verifying session/email in the background in parallel with child page fetches.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const isInitialLoadRef = useRef(true);
  const previousPendingCountRef = useRef(0);
  const authVerifiedRef = useRef(false);
  const shouldRenderLogin = pathname === '/admin/login';

  // Check authentication once on client side (do not re-query DB on every internal admin page click)
  useEffect(() => {
    if (shouldRenderLogin) {
      authVerifiedRef.current = false;
      setIsAuthenticated(true);
      return;
    }

    if (authVerifiedRef.current) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setIsAuthenticated(false);
          window.location.replace('/admin/login');
          return;
        }

        const email = session.user.email?.toLowerCase().trim() || '';
        setUserEmail(email);
        const isWhitelisted = ['official.dagattabai@gmail.com', 'admin@dagattabai.ph'].includes(email);

        if (isWhitelisted || session.user.user_metadata?.role === 'admin') {
          authVerifiedRef.current = true;
          setIsAuthenticated(true);
          return;
        }

        const { data: profile } = await (supabase.from('profiles') as any)
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const isAdmin = profile?.role === 'admin';

        if (!isAdmin) {
          console.warn('Non-admin user attempted to access admin console. Redirecting to login.');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          window.location.replace('/admin/login');
          return;
        }

        authVerifiedRef.current = true;
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
        window.location.replace('/admin/login');
      }
    };

    void checkAuth();
  }, [shouldRenderLogin]);

  const fetchCounts = () => {
    if (shouldRenderLogin || !isAuthenticated) return;

    fetch('/api/applications', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.applications && Array.isArray(data.applications)) {
          const count = data.applications.filter((a: any) => a.status === 'pending').length;
          setPendingCount(count);

          if (!isInitialLoadRef.current) {
            if (count > previousPendingCountRef.current) {
              showToast(
                `New application received! ${count - previousPendingCountRef.current} new pending application(s).`,
                'success'
              );
            }
          }
          previousPendingCountRef.current = count;
          isInitialLoadRef.current = false;
        }
      })
      .catch(() => {});

    fetch('/api/admin/beaches/tour-requests', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.pendingCount === 'number') {
          setPendingTourCount(data.pendingCount);
        }
      })
      .catch(() => {});

    fetch('/api/admin/beaches/coordinate-requests', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.pendingCount === 'number') {
          setPendingCoordCount(data.pendingCount);
        }
      })
      .catch(() => {});
  };

  // Periodic automatic counts for sidebar badges (without re-triggering on state change)
  useEffect(() => {
    if (shouldRenderLogin || !isAuthenticated) return;
    fetchCounts();
  }, [shouldRenderLogin, isAuthenticated]);

  useRealtimeSync(() => {
    fetchCounts();
  }, { enabled: !shouldRenderLogin && isAuthenticated });

  useEffect(() => {
    if (!mobileOpen) return;

    const sidebar = sidebarRef.current;
    const firstControl = sidebar?.querySelector<HTMLElement>('[aria-label="Collapse sidebar"]');
    firstControl?.focus();

    const handleMenuKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        mobileMenuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !sidebar) return;
      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')
      ).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    sidebar?.addEventListener('keydown', handleMenuKeydown);
    return () => sidebar?.removeEventListener('keydown', handleMenuKeydown);
  }, [mobileOpen]);

  const closeMobileMenu = () => {
    setMobileOpen(false);
    mobileMenuButtonRef.current?.focus();
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    } finally {
      authVerifiedRef.current = false;
      showToast('Signed out successfully.', 'success');
      window.location.replace('/admin/login');
    }
  };

  // If on login page, render children directly without dashboard chrome
  if (shouldRenderLogin) {
    return <>{children}</>;
  }

  // Redirecting unauthenticated user
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black text-[#1F3F74] dark:text-[#4987BA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
      </div>
    );
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      count: 0,
    },
    {
      label: 'Owner Applications',
      href: '/admin/applications',
      icon: VerifiedSanctuary,
      count: pendingCount,
    },
    {
      label: 'Manage Beaches',
      href: '/admin/beaches',
      icon: ShorelineMarker,
      count: pendingTourCount + pendingCoordCount,
    },
    {
      label: 'User Management',
      href: '/admin/users',
      icon: Users,
      count: 0,
    },
    {
      label: 'Settings',
      href: '/admin/account',
      icon: Settings,
      count: 0,
    },
  ];

  return (
    <div className="admin-console h-screen h-[100dvh] w-full flex overflow-hidden bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-neutral-100">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-colors active:bg-black/70 lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          onClick={closeMobileMenu}
          aria-label="Close navigation"
        />
      )}

      {/* Admin Sidebar: Fixed height, does NOT scroll with main content */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:static top-0 h-screen h-[100dvh] flex-shrink-0 flex flex-col justify-between z-50 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-black overflow-hidden ${
          collapsed ? 'w-[76px]' : 'w-[280px]'
        } ${
          mobileOpen ? 'visible translate-x-0 w-[280px]' : 'invisible -translate-x-full lg:visible lg:translate-x-0'
        }`}
        aria-label="Barangay Admin Navigation"
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? true : undefined}
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Top Header inside Sidebar: Centered Logo + Email + Position */}
          <div
            className={`px-5 py-6 border-b border-slate-200 dark:border-neutral-800 flex flex-col items-center ${
              collapsed ? 'justify-center' : 'justify-center'
            } transition-all`}
          >
            {collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-700 active:bg-slate-200 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-sky-300 dark:active:bg-neutral-800"
                title="Expand sidebar"
                aria-label="Expand sidebar"
                aria-expanded={false}
                aria-controls="admin-navigation"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            ) : (
              <>
                <div className="flex items-center justify-end w-full mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (mobileOpen) {
                        closeMobileMenu();
                      } else {
                        setCollapsed(true);
                      }
                    }}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-700 active:bg-slate-200 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-sky-300 dark:active:bg-neutral-800"
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                    aria-expanded={true}
                    aria-controls="admin-navigation"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <Link
                  href="/admin/dashboard"
                  prefetch={false}
                  className="flex flex-col items-center gap-3 group rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  title="Barangay Binongkalan Admin Portal"
                >
                  <Image
                    src="/logo.png"
                    alt="Dagat Ta Bai Logo"
                    width={64}
                    height={64}
                    className="rounded-xl bg-sand-50 p-1.5 object-contain"
                  />
                </Link>

                <div className="text-center mt-4 space-y-3">
                  <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">
                    {userEmail}
                  </p>
                  <p className="text-[10px] font-bold text-brand-700 dark:text-sky-300 uppercase tracking-wider">
                    Administrator
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Navigation Links: Spacious, well-utilized vertical layout */}
          <nav id="admin-navigation" className="p-4 space-y-6 pt-8 flex-1 flex flex-col" aria-label="Primary">
            <div className="space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center ${
                      collapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-4'
                    } rounded-2xl text-xs sm:text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                      isActive
                        ? 'bg-brand-700 text-white shadow-md font-semibold'
                        : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-brand-700 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 dark:text-neutral-400 group-hover:text-brand-700 dark:group-hover:text-sky-300'
                        }`}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {item.count > 0 && !collapsed && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex-shrink-0 ml-2">
                        {item.count}
                      </span>
                    )}

                    {item.count > 0 && collapsed && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <div className={`p-4 border-t border-slate-200 dark:border-neutral-800 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-11 w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 active:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950/30 dark:active:bg-rose-950/50"
            title={collapsed ? 'Sign out' : undefined}
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area: Independent scroll container so sidebar NEVER scrolls with content */}
      <div className="flex-1 flex flex-col h-screen h-[100dvh] min-w-0 overflow-hidden">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden p-4 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-black flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            ref={mobileMenuButtonRef}
            onClick={() => {
              setCollapsed(false);
              setMobileOpen(true);
            }}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:active:bg-neutral-800"
            aria-label="Open sidebar"
            aria-expanded={mobileOpen}
            aria-controls="admin-navigation"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-semibold">Menu</span>
          </button>
          <span className="font-bold text-sm text-brand-700 dark:text-sky-300">
            Admin Portal
          </span>
        </div>

        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
