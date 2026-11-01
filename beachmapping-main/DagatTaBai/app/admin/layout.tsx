'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileCheck,
  Palmtree,
  Settings,
  LogOut,
  Menu,
  X,
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingTourCount, setPendingTourCount] = useState<number>(0);
  const [pendingCoordCount, setPendingCoordCount] = useState<number>(0);
  const [previousPendingCount, setPreviousPendingCount] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isInitialLoadRef = useRef(true);
  const shouldRenderLogin = pathname === '/admin/login';

  // Check authentication on client side
  useEffect(() => {
    if (shouldRenderLogin) {
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
        const isWhitelisted = ['official.dagattabai@gmail.com', 'admin@dagattabai.ph'].includes(email);

        const { data: profile } = await (supabase.from('profiles') as any)
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const isAdmin = isWhitelisted || profile?.role === 'admin';

        if (!isAdmin) {
          console.warn('Non-admin user attempted to access admin console. Redirecting to login.');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          window.location.replace('/admin/login');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
        window.location.replace('/admin/login');
      }
    };

    void checkAuth();
  }, [pathname, shouldRenderLogin]);

  // Periodic automatic counts for sidebar badges
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
              if (count > previousPendingCount) {
                showToast(`New application received! ${count - previousPendingCount} new pending application(s).`, 'success');
              }
            }
            setPreviousPendingCount(count);
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
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [shouldRenderLogin, isAuthenticated, previousPendingCount]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    } finally {
      showToast('Administrator signed out.');
      window.location.replace('/admin/login');
    }
  };

  // If on login page, render children directly without dashboard chrome
  if (shouldRenderLogin) {
    return <>{children}</>;
  }

  // Waiting for authentication
  if (isAuthenticated === null) {
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-neutral-100">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen flex flex-col justify-between z-50 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-black ${
          collapsed ? 'w-[76px]' : 'w-[272px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[272px]' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Barangay Admin Navigation"
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Top Header inside Sidebar: Logo / Avatar + Name + Solid Blue Badge + Hamburger */}
          <div
            className={`px-4 py-4.5 border-b border-slate-200 dark:border-neutral-800 flex items-center ${
              collapsed ? 'justify-center' : 'justify-between'
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
              <div className="flex items-center justify-between w-full gap-2">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2.5 group focus:outline-none min-w-0 flex-1"
                  title="Barangay Binongkalan Admin Portal"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Image
                      src="/logo.png"
                      alt="Dagat Ta Bai Logo"
                      width={28}
                      height={28}
                      className="object-contain"
                      onError={(e) => {
                        // Fallback to text avatar if image fails
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-bold text-sm tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight truncate block">
                        Barangay Binongkalan
                      </span>
                      {/* Solid Blue Verified Badge with White Check */}
                      <span
                        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] text-white flex-shrink-0 shadow-2xs"
                        title="Verified Admin Portal"
                      >
                        <svg
                          className="w-2 h-2"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="2.5 6 5 8.5 9.5 3.5" />
                        </svg>
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 tracking-wider uppercase block mt-0.5 truncate">
                      Barangay Admin Portal
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    className="hidden lg:flex p-1.5 rounded-lg text-slate-500 hover:text-[#1F3F74] dark:text-neutral-400 dark:hover:text-[#4987BA] hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer"
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-3 pt-6 flex-1 flex flex-col" aria-label="Primary">
            <div className="space-y-2.5">
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
                      collapsed ? 'justify-center px-2 py-3.5' : 'justify-between px-4 py-3.5'
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex-shrink-0 ml-2">
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

        {/* Bottom Section: Sign Out Only */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center py-3' : 'justify-center gap-2 py-2.5'
            } px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area (Navbar removed as requested!) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Toggle (Only visible on small screens so mobile users can open sidebar) */}
        <div className="lg:hidden p-4 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA]">
              Barangay Admin
            </span>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
