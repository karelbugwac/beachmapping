'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Bell,
  Waves,
  Sparkles,
  CheckCircle2,
  CheckCheck,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import type { AuthUser } from '@/lib/db/auth';

// Helper function to get display name from AuthUser
function getDisplayName(user: AuthUser): string {
  return user.full_name || user.email?.split('@')[0] || 'User';
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'weather' | 'review' | 'system' | 'beach';
  link?: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Welcome to Dagat Ta Bai!',
    message: 'Your account is verified. You can now explore Catmon beaches and leave ratings.',
    time: 'Just now',
    read: false,
    type: 'system',
    link: '/map',
  },
  {
    id: 'notif-2',
    title: 'Tide & Sea Advisory: Catmon Coast',
    message: 'Mild currents and calm sea surface expected along Binongkalan this afternoon.',
    time: '2h ago',
    read: false,
    type: 'weather',
    link: '/weather',
  },
  {
    id: 'notif-3',
    title: 'New 360° Sanctuary Panorama',
    message: 'Interactive virtual view is now active for Tinubdan Spring & Sanctuary.',
    time: '1d ago',
    read: false,
    type: 'beach',
    link: '/map',
  },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [user, setUser] = useState<AuthUser | null>(null);

  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Dedicated admin, owner, and staff portals have their own specialized layout/sidebar
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/owner') || pathname?.startsWith('/staff')) {
    return null;
  }

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Weather', href: '/weather' },
    { label: 'Guidelines', href: '/community-guidelines' },
    { label: 'Feedback', href: '/feedback' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // Fetch session user on mount and route changes
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
      })
      .catch(() => setUser(null));
  }, [pathname]);

  // Load read notifications from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const readIds: string[] = JSON.parse(localStorage.getItem('dtb_read_notifs') || '[]');
        if (Array.isArray(readIds) && readIds.length > 0) {
          setNotifications((prev) =>
            prev.map((n) => (readIds.includes(n.id) ? { ...n, read: true } : n))
          );
        }
      } catch {
        // Ignore JSON error
      }
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setProfileDropdownOpen(false);
      router.push('/');
      router.refresh();
    } catch {
      window.location.href = '/';
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (typeof window !== 'undefined') {
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem('dtb_read_notifs', JSON.stringify(allIds));
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (typeof window !== 'undefined') {
      try {
        const readIds: string[] = JSON.parse(localStorage.getItem('dtb_read_notifs') || '[]');
        if (!readIds.includes(notif.id)) {
          readIds.push(notif.id);
          localStorage.setItem('dtb_read_notifs', JSON.stringify(readIds));
        }
      } catch {}
    }
    setNotificationsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          {/* Logo -> Name */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Dagat Ta Bai Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <span className="font-sans font-bold text-xl sm:text-2xl tracking-tight text-slate-950 dark:text-white leading-none">
              Dagat Ta Bai
            </span>
          </Link>

          {/* Center Navigation Links: Home, Weather, About, Contact */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-[#0284c7] dark:text-[#38bdf8] bg-sky-50 dark:bg-sky-950/50 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Notification Bell + Profile / Sign Up + Theme Toggle */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    aria-label="Notifications"
                    className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#09090b] animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white font-heading">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                              {unreadCount} new
                            </span>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                                n.read
                                  ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                                  : 'bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                              }`}
                            >
                              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5">
                                {n.type === 'weather' ? (
                                  <Waves className="w-3.5 h-3.5" />
                                ) : n.type === 'beach' ? (
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {n.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                                    {n.time}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                                  {n.message}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-2" />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link
                          href="/weather"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                          View coastal forecast & tides
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Icon + Name dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-[11px] overflow-hidden flex-shrink-0">
                      {user.profile_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.profile_image_url}
                          alt={getDisplayName(user)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getDisplayName(user).charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="max-w-[120px] truncate">{getDisplayName(user)}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {getDisplayName(user)}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                          {user.email || ''}
                        </div>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>Go to Profile</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Public / Unauthenticated: Sign Up button */
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-full transition-colors shadow-xs"
              >
                Sign Up
              </Link>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(true);
                }}
                className="relative p-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-1 ring-white dark:ring-[#09090b]">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#09090b] px-4 pt-3 pb-5 space-y-3">
          <div className="space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#0284c7] dark:text-[#38bdf8] bg-sky-50 dark:bg-sky-950/50 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notifications ({unreadCount} new)</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-xl"
                >
                  <UserIcon className="w-4 h-4 text-sky-600" />
                  <span>Go to Profile ({getDisplayName(user)})</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 text-xs font-bold text-white bg-slate-950 dark:bg-white dark:text-slate-950 rounded-full"
              >
                Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
