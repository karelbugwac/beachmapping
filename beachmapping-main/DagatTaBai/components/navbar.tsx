'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { AuthUser } from '@/lib/db/auth';

// Helper function to get display name from AuthUser
function getDisplayName(user: AuthUser): string {
  return user.full_name || user.email?.split('@')[0] || 'User';
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  const isDedicatedPortal =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/staff') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Weather', href: '/weather' },
    { label: 'Apply', href: '/apply' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // Fetch session user on mount and route changes, with listener
  useEffect(() => {
    if (isDedicatedPortal) return;
    let isMounted = true;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();
        if (data.user && isMounted) {
          setUser(data.user);
          return;
        }
      } catch {}

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData?.session?.user;
        if (sbUser && isMounted) {
          setUser({
            id: sbUser.id,
            full_name:
              sbUser.user_metadata?.full_name ||
              sbUser.user_metadata?.name ||
              sbUser.email?.split('@')[0] ||
              'User',
            email: sbUser.email || '',
            role: (sbUser.user_metadata?.role as any) || 'user',
            profile_image_url:
              sbUser.user_metadata?.avatar_url ||
              sbUser.user_metadata?.picture ||
              null,
            created_at: sbUser.created_at,
          });
          return;
        }
      } catch {}

      if (isMounted) setUser(null);
    };

    checkSession();

    const handleUserUpdate = (e: any) => {
      if (e.detail && isMounted) {
        setUser((prev) => {
          if (!prev) return e.detail;
          return {
            ...prev,
            ...e.detail,
            full_name: e.detail.full_name !== undefined ? e.detail.full_name : prev.full_name,
            profile_image_url: e.detail.profile_image_url !== undefined ? e.detail.profile_image_url : prev.profile_image_url,
          };
        });
      }
    };
    window.addEventListener('dtb_user_updated', handleUserUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('dtb_user_updated', handleUserUpdate);
    };
  }, [pathname, isDedicatedPortal]);

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    } finally {
      setUser(null);
      setMobileMenuOpen(false);
      router.push('/login');
      router.refresh();
    }
  };

  if (isDedicatedPortal) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo & Platform Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
            aria-label="Dagat Ta Bai Home"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="Dagat Ta Bai Logo"
                fill
                sizes="(max-width: 640px) 36px, 40px"
                className="object-contain"
                priority
              />
            </div>
            <span className="font-sans font-extrabold text-xl tracking-tight text-[#1F3F74] dark:text-[#4987BA]">
              Dagat Ta Bai
            </span>
          </Link>

          {/* Center Navigation Links: Home, Weather, Apply, About, Contact */}
          <nav className="hidden md:flex items-stretch self-stretch h-full gap-0.5 lg:gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative inline-flex items-center px-3.5 lg:px-4 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-[#1F3F74] dark:text-[#4987BA] font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#1F3F74] dark:hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive ? (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1F3F74] dark:bg-[#4987BA]" />
                  ) : (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-300 dark:bg-neutral-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: User Avatar Circle (links directly to /profile) + Direct Sign Out Button */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Circular Profile Avatar (Direct link to Settings, NO dropdown) */}
                <Link
                  href="/profile"
                  title={`Account Settings (${getDisplayName(user)})`}
                  aria-label="Account Settings"
                  className="relative group p-0.5 rounded-full ring-2 ring-[#1F3F74]/20 dark:ring-[#4987BA]/30 hover:ring-[#1F3F74] dark:hover:ring-[#4987BA] transition-all cursor-pointer flex-shrink-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs">
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
                </Link>

                {/* Direct Sign Out Icon Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Public / Unauthenticated: Sign Up button */
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] rounded-full transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            )}
          </div>

          {/* Mobile Actions: Circular Avatar or Menu Toggle */}
          <div className="flex items-center gap-2.5 md:hidden">
            {user && (
              <Link
                href="/profile"
                className="w-7 h-7 rounded-full bg-[#1F3F74] dark:bg-[#4987BA] text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs"
                title="Account Settings"
              >
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
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-neutral-900 bg-white dark:bg-black px-4 pt-3 pb-5 space-y-3">
          <div className="space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 text-sm transition-colors rounded-r-lg ${
                    isActive
                      ? 'text-[#1F3F74] dark:text-[#4987BA] font-bold border-l-[3px] border-[#1F3F74] dark:border-[#4987BA] bg-blue-50/50 dark:bg-neutral-900/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-2">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-neutral-900 rounded-xl"
                >
                  <UserIcon className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                  <span>Account Settings ({getDisplayName(user)})</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 text-xs font-bold text-white bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] rounded-full"
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
