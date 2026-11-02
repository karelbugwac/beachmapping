'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
  operatorName?: string;
  beachName?: string;
  beachSlug?: string;
  isOpenNow?: boolean;
  openingHours?: string;
  reviewCount?: number;
  unreadNotifications?: number;
}

export function AppShell({
  children,
  beachName = 'Your Beach',
  beachSlug,
  reviewCount = 0,
  unreadNotifications = 0,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const pathname = usePathname();

  // Load sidebar collapsed preference
  useEffect(() => {
    let timer: number | undefined;
    try {
      const saved = localStorage.getItem('dtb_owner_sidebar_collapsed');
      if (saved === 'true') {
        timer = window.setTimeout(() => setCollapsed(true), 0);
      }
    } catch {
      // Ignore
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setPageLoading(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!pageLoading) return;
    const timer = window.setTimeout(() => setPageLoading(false), 10000);
    return () => window.clearTimeout(timer);
  }, [pageLoading]);

  const handleNavigationStart = (event: React.MouseEvent<HTMLElement>) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    const target = event.target as HTMLElement;
    const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
    if (!anchor || anchor.target === '_blank') return;

    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin === window.location.origin && destination.pathname !== pathname) {
      setPageLoading(true);
    }
  };

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dtb_owner_sidebar_collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div
      onClickCapture={handleNavigationStart}
      className="h-screen flex font-sans bg-[#f8fafc] dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden"
    >
      {/* 1. SIDEBAR (Collapsible desktop / off-canvas drawer mobile) */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        reviewCount={reviewCount}
        beachSlug={beachSlug}
        beachName={beachName}
        unreadNotifications={unreadNotifications}
      />

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {pageLoading && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-[#1F3F74] dark:bg-[#4987BA] z-[100] overflow-hidden">
            <div className="h-full w-1/2 bg-sky-400 animate-[progress_1s_ease-in-out_infinite]" />
          </div>
        )}

        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-black flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-[#1F3F74] dark:text-[#4987BA]">Beach Owner Portal</span>
        </div>

        {/* Page Content */}
        <main
          className="flex-1 p-6 sm:p-8 lg:p-10 w-full overflow-y-auto no-scrollbar"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
