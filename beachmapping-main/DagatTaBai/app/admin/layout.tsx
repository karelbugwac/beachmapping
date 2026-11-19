'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileCheck,
  Palmtree,
  Settings,
  LogOut,
  Menu,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/feedback-toasts';
import { signOutAndClearClientState } from '@/lib/client/logout';

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
  const [sidebarTooltip, setSidebarTooltip] = useState<{ label: string; left: number; top: number } | null>(null);
  // Server middleware (proxy.ts) already guards /admin/* routes, so render immediately
  // while verifying session/email in the background in parallel with child page fetches.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const authVerifiedRef = useRef(false);
  const tooltipTimerRef = useRef<number | null>(null);
  const shouldRenderLogin = pathname === '/admin/login';

  // Check authentication once on client side (do not re-query DB on every internal admin page click)
  useEffect(() => {
    if (shouldRenderLogin) {
      authVerifiedRef.current = false;
      return;
    }

    if (authVerifiedRef.current) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user: sessionUser } } = await supabase.auth.getUser();

        if (!sessionUser) {
          setIsAuthenticated(false);
          window.location.replace('/admin/login');
          return;
        }

        const email = sessionUser.email?.toLowerCase().trim() || '';
        setUserEmail(email);

        const { data: profileData } = await supabase.from('profiles')
          .select('role')
          .eq('id', sessionUser.id)
          .maybeSingle();
        const profile = profileData as { role: string | null } | null;

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

  // Load sidebar badge counts once when the admin area opens.
  useEffect(() => {
    if (shouldRenderLogin || !isAuthenticated) return;

    let active = true;
    Promise.all([
      fetch('/api/applications', { cache: 'no-store' }).then((res) => res.ok ? res.json() : null),
      fetch('/api/admin/beaches/tour-requests', { cache: 'no-store' }).then((res) => res.ok ? res.json() : null),
      fetch('/api/admin/beaches/coordinate-requests', { cache: 'no-store' }).then((res) => res.ok ? res.json() : null),
    ]).then(([applicationsData, tourData, coordinateData]) => {
      if (!active) return;
      if (Array.isArray(applicationsData?.applications)) {
        setPendingCount(applicationsData.applications.filter((application: { status?: string }) => application.status === 'pending').length);
      }
      if (typeof tourData?.pendingCount === 'number') setPendingTourCount(tourData.pendingCount);
      if (typeof coordinateData?.pendingCount === 'number') setPendingCoordCount(coordinateData.pendingCount);
    }).catch(() => {});
    return () => { active = false; };
  }, [shouldRenderLogin, isAuthenticated]);

  useEffect(() => () => {
    if (tooltipTimerRef.current !== null) window.clearTimeout(tooltipTimerRef.current);
  }, []);

  const openSidebarTooltip = (event: React.FocusEvent<HTMLAnchorElement> | React.PointerEvent<HTMLAnchorElement>, label: string) => {
    if (!collapsed) return;
    if ('pointerType' in event && event.pointerType === 'mouse' && !(event.currentTarget.matches(':hover'))) return;
    if (tooltipTimerRef.current !== null) window.clearTimeout(tooltipTimerRef.current);
    const target = event.currentTarget;
    tooltipTimerRef.current = window.setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const left = Math.min(rect.right + 12, window.innerWidth - 180);
      setSidebarTooltip({ label, left: Math.max(8, left), top: Math.max(8, Math.min(rect.top + rect.height / 2, window.innerHeight - 36)) });
    }, 150);
  };

  const closeSidebarTooltip = () => {
    if (tooltipTimerRef.current !== null) {
      window.clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setSidebarTooltip(null);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await signOutAndClearClientState(user?.id);
    } catch (error: unknown) {
      console.error('Sign-out cleanup did not complete:', error);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black text-brand-navy-500 dark:text-brand-teal-300">
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
      icon: FileCheck,
      count: pendingCount,
    },
    {
      label: 'Manage Beaches',
      href: '/admin/beaches',
      icon: Palmtree,
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
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-neutral-100">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar: Fixed height, does NOT scroll with main content */}
      <aside
        className={`fixed lg:static relative top-0 h-screen flex-shrink-0 flex flex-col justify-between z-50 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-black overflow-visible ${
          collapsed ? 'w-[76px]' : 'w-[280px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Barangay Admin Navigation"
      >
        <button
          type="button"
          onClick={() => {
            if (mobileOpen) {
              setMobileOpen(false);
            } else {
              setCollapsed((value) => !value);
            }
          }}
          className="absolute -right-3.5 top-1/2 z-[60] hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 lg:flex"
          title={mobileOpen ? 'Close sidebar' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={mobileOpen ? 'Close sidebar' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Top Header inside Sidebar: Centered Logo + Email + Position */}
          <div
            className={`px-5 py-6 border-b border-slate-200 dark:border-neutral-800 flex flex-col items-center ${
              collapsed ? 'justify-center' : 'justify-center'
            } transition-all`}
          >
            {!collapsed && (
              <>
                <Link
                  href="/admin/dashboard"
                  className="flex flex-col items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400"
                  title="Barangay Binongkalan Admin Portal"
                >
                  <Image
                    src="/images/logo.png"
                    alt="Dagat Ta Bai Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </Link>

                <div className="text-center mt-4 space-y-3">
                  <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">
                    {userEmail}
                  </p>
                  <p className="text-[10px] font-bold text-brand-navy-500 dark:text-brand-teal-300 uppercase tracking-wider">
                    Administrator
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                  >
                    <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Navigation Links: Spacious, well-utilized vertical layout */}
          <nav className="p-4 space-y-6 pt-8 flex-1 flex flex-col" aria-label="Primary">
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
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    onPointerEnter={(event) => openSidebarTooltip(event, item.label)}
                    onPointerLeave={closeSidebarTooltip}
                    onFocus={(event) => openSidebarTooltip(event, item.label)}
                    onBlur={closeSidebarTooltip}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') closeSidebarTooltip();
                    }}
                    className={`group relative flex items-center ${
                      collapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-4'
                    } rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-navy-500 text-white shadow-md font-semibold'
                        : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-brand-navy-500 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 dark:text-neutral-400 group-hover:text-brand-navy-500 dark:group-hover:text-brand-teal-300'
                        }`}
                        strokeWidth={1.8}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {item.count > 0 && !collapsed && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-sun-400 text-brand-navy-700 flex-shrink-0 ml-2">
                        {item.count}
                      </span>
                    )}

                    {item.count > 0 && collapsed && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-sun-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {collapsed && sidebarTooltip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[55] -translate-y-1/2 rounded-md bg-slate-900 px-2.5 py-1.5 text-sm text-white shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
          style={{ left: sidebarTooltip.left, top: sidebarTooltip.top }}
        >
          <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" aria-hidden="true" />
          <span className="relative">{sidebarTooltip.label}</span>
        </div>
      )}

      {/* Main Content Area: Independent scroll container so sidebar NEVER scrolls with content */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden p-4 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-black flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-brand-navy-500 dark:text-brand-teal-300">
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
