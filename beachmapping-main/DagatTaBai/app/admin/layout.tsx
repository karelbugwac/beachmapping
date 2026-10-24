'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileCheck,
  Palmtree,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/theme-provider';
import { showToast } from '@/components/ui/feedback-toasts';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [previousPendingCount, setPreviousPendingCount] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isInitialLoadRef = useRef(true);
  const shouldRenderLogin = pathname === '/admin/login';

  // Check authentication on client side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only consider authenticated if session exists AND is valid
        const isValidSession = session && session.user && session.access_token;
        setIsAuthenticated(!!isValidSession);
        
        // If not authenticated and not on login page, redirect to login immediately
        if (!isValidSession && pathname !== '/admin/login') {
          window.location.replace('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        if (pathname !== '/admin/login') {
          window.location.replace('/admin/login');
        }
      }
    };

    checkAuth();
  }, [pathname]);

  // Fetch pending applications count for the sidebar badge with realtime updates
  useEffect(() => {
    // Don't run on login page
    if (shouldRenderLogin) return;
    
    const fetchCount = () => {
      fetch('/api/applications')
        .then((res) => res.json())
        .then((data) => {
          if (data.applications && Array.isArray(data.applications)) {
            const count = data.applications.filter((a: any) => a.status === 'pending').length;
            setPendingCount(count);
            
            // Show notification when count changes (skip initial load)
            if (!isInitialLoadRef.current) {
              if (count > previousPendingCount) {
                showToast(`New application received! ${count - previousPendingCount} new pending application(s).`, 'success');
              } else if (count < previousPendingCount) {
                showToast(`Application status updated. ${previousPendingCount - count} application(s) processed.`, 'success');
              }
            }
            setPreviousPendingCount(count);
            isInitialLoadRef.current = false;
          }
        })
        .catch(() => {});
    };

    fetchCount();
    
    // Setup realtime subscription for applications
    const supabase = createClient();
    const applicationsChannel = supabase
      .channel('admin-applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(applicationsChannel);
    };
  }, [previousPendingCount, pathname]);

  // If still checking auth and not on login page, show loading immediately
  if (isAuthenticated === null && !shouldRenderLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  // If on login page, render plain full-screen login card without sidebar
  if (shouldRenderLogin) {
    return <>{children}</>;
  }

  // If not authenticated and not on login page, show nothing (will redirect via useEffect)
  if (isAuthenticated === false) {
    return null;
  }

  // Handle Admin Logout
  const handleLogout = async () => {
    window.location.href = '/admin/login';
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Owner Applications',
      href: '/admin/applications',
      icon: FileCheck,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: 'Manage Beaches',
      href: '/admin/beaches',
      icon: Palmtree,
      badge: null,
    },
    {
      label: 'Review Moderation',
      href: '/admin/reviews',
      icon: MessageSquare,
      badge: null,
    },
    {
      label: 'Admin Account',
      href: '/admin/account',
      icon: Settings,
      badge: null,
    },
  ];

  // Always render the layout with sidebar for all other admin pages (no auth check)
  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-black text-slate-900 dark:text-white font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR (Sticky, Left)                                                    */}
      {/* ========================================================================= */}
      <aside
        className={`fixed top-0 h-screen w-72 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 p-1 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Dagat Ta Bai"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white block">
                  Dagat Ta Bai
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5 flex-1">
            <div className="px-3 pt-2 pb-2 text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">
              Management
            </div>

            {navItems.map((item: any) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick External Visitor Link */}
          <div className="p-4 border-t border-slate-800">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/70 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700/60"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>Visit Public Site</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Bottom: Admin User Identity & Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-9 h-9 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center flex-shrink-0 text-sky-300 font-bold text-xs">
                AD
              </div>
              <div className="overflow-hidden min-w-0">
                <span className="text-xs font-semibold text-white block truncate">
                  Dagat Ta Bai Admin
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  official.dagattabai@gmail.com
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                Catmon Municipal Portal
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-gray-200 capitalize">
                {pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
