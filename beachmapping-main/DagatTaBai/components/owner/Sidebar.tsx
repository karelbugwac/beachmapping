'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Image as ImageIcon,
  Home,
  Star,
  Settings,
  LogOut,
  X,
  ExternalLink,
  Bell,
} from 'lucide-react';
import { ThemeToggle } from '@/components/owner/ThemeToggle';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  reviewCount?: number;
  beachSlug?: string;
  beachName?: string;
  unreadNotifications?: number;
}

export function Sidebar({
  mobileOpen,
  onClose,
  reviewCount = 0,
  beachSlug,
  beachName = 'Catmon Beach Resort',
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
      label: 'Beach & Photos',
      href: '/owner/beach',
      icon: MapPin,
      count: 0,
    },
    {
      label: 'Guest Reviews',
      href: '/owner/reviews',
      icon: Star,
      count: reviewCount,
    },
    {
      label: 'Account Settings',
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
        className={`fixed lg:sticky top-0 h-screen w-[280px] sm:w-[264px] flex flex-col justify-between z-50 transition-transform duration-250 ease-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Beach Owner Navigation"
      >
        {/* Top: Brand Header & Nav List */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <Link
              href="/owner/dashboard"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>

              <div>
                <span className="block text-base font-semibold text-gray-900 dark:text-white">
                  Dagat Ta Bai
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                  Owner Portal
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1" aria-label="Primary">
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
                  className={`group relative flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </div>

                  {/* Badge only when count > 0 */}
                  {item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Notifications Item */}
            {unreadNotifications > 0 && (
              <div className="px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {unreadNotifications} new notification{unreadNotifications > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Ghost button: View Public Page */}
          <div className="px-3 pt-2">
            <Link
              href={beachSlug ? `/beaches/${beachSlug}` : '/map'}
              target="_blank"
              className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                <span>View public listing</span>
              </span>
              <span className="text-gray-400 text-xs">↗</span>
            </Link>
          </div>
        </div>

        {/* Bottom User Block */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {beachName.charAt(0)}
              </div>
              <div className="overflow-hidden min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                  {beachName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                  Beach Owner
                </span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
