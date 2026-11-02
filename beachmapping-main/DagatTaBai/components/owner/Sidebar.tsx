'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Star,
  Settings,
  LogOut,
  X,
  Menu,
  Bell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  reviewCount?: number;
  beachSlug?: string;
  beachName?: string;
  unreadNotifications?: number;
}

export function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapse,
  reviewCount = 0,
  beachName = 'Your Beach',
  unreadNotifications = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore fallback
    } finally {
      router.push('/owner/login');
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/owner/dashboard',
      icon: LayoutDashboard,
      count: 0,
    },
    {
      label: 'Manage Information',
      href: '/owner/beach',
      icon: Building2,
      count: 0,
    },
    {
      label: 'Guest Reviews',
      href: '/owner/reviews',
      icon: Star,
      count: reviewCount,
    },
    {
      label: 'Settings',
      href: '/owner/account',
      icon: Settings,
      count: 0,
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:static top-0 h-screen flex-shrink-0 flex flex-col justify-between z-50 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-black overflow-hidden ${
          collapsed ? 'w-[76px]' : 'w-[280px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[272px]' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Beach Owner Navigation"
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          <div
            className={`px-5 py-6 border-b border-slate-200 dark:border-neutral-800 flex flex-col items-center transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-2 text-slate-600 dark:text-neutral-300 hover:text-[#1F3F74] dark:hover:text-[#4987BA] hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <>
                <div className="flex items-center justify-end w-full mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (mobileOpen) onClose();
                      else onToggleCollapse();
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#1F3F74] dark:text-neutral-400 dark:hover:text-[#4987BA] hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                    title="Toggle sidebar"
                    aria-label="Toggle sidebar"
                  >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
                <Link href="/owner/dashboard" className="flex flex-col items-center gap-3" title={beachName}>
                  <Image src="/images/logo.png" alt="Dagat Ta Bai logo" width={64} height={64} className="object-contain" />
                </Link>
                <div className="text-center mt-4 space-y-3 w-full">
                  <p className="text-xs font-medium text-slate-600 dark:text-neutral-400 truncate" title={beachName}>
                    {beachName}
                  </p>
                  <p className="text-[10px] font-bold text-[#1F3F74] dark:text-[#4987BA] uppercase tracking-wider">
                    Beach Owner Portal
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

          <nav className="p-4 pt-8 flex-1 flex flex-col" aria-label="Primary">
            <div className="space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/owner/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
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

                    {/* Badge only when count > 0 */}
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

            {/* Notifications Alert if present */}
            {unreadNotifications > 0 && (
              <div
                className={`mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 ${
                  collapsed ? 'p-2 flex justify-center' : 'px-4 py-3'
                }`}
                title={`${unreadNotifications} notifications`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 truncate">
                      {unreadNotifications} new notification{unreadNotifications > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>

      </aside>
    </>
  );
}
