'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
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

  // Periodic automatic counts for sidebar badges (without re-triggering on state change)
  useEffect(() => {
    if (shouldRenderLogin || !isAuthenticated) return;

    const fetchCounts = () => {
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

    fetchCounts();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCounts();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [shouldRenderLogin, isAuthenticated]);

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
        className={`fixed lg:static top-0 h-screen flex-shrink-0 flex flex-col justify-between z-50 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-black overflow-hidden ${
          collapsed ? 'w-[76px]' : 'w-[280px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Barangay Admin Navigation"
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
                className="p-2 text-slate-600 dark:text-neutral-300 hover:text-[#1F3F74] dark:hover:text-[#4987BA] hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <>
                {/* Hamburger Button: Positioned on the right side */}
                <div className="flex items-center justify-end w-full mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (mobileOpen) {
                        setMobileOpen(false);
                      } else {
                        setCollapsed(true);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#1F3F74] dark:text-neutral-400 dark:hover:text-[#4987BA] hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                    title="Toggle sidebar"
                    aria-label="Toggle sidebar"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>

                <Link
                  href="/admin/dashboard"
                  className="flex flex-col items-center gap-3 group focus:outline-none"
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
                  <p className="text-[10px] font-bold text-[#1F3F74] dark:text-[#4987BA] uppercase tracking-wider">
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
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center ${
                      collapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-4'
                    } rounded-2xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#1F3F74] text-white shadow-md font-semibold'
                        : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-[#1F3F74] dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 dark:text-neutral-400 group-hover:text-[#1F3F74] dark:group-hover:text-[#4987BA]'
                        }`}
                        strokeWidth={1.8}
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
      </aside>

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
          <span className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA]">
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
