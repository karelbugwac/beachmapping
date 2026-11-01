'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

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
  beachName = 'Catmon Beach Resort',
  beachSlug,
  reviewCount = 0,
  unreadNotifications = 0,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Load sidebar collapsed preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dtb_owner_sidebar_collapsed');
      if (saved === 'true') {
        setCollapsed(true);
      }
    } catch {
      // Ignore
    }
  }, []);

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
    <div className="h-screen flex font-sans bg-[#f8fafc] dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
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
        {/* Topbar Landmark */}
        <Topbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          beachName={beachName}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Page Content */}
        <main className="flex-1 p-5 sm:p-7 max-w-[1440px] w-full mx-auto overflow-y-auto no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
