'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Map,
  Store,
} from 'lucide-react';

export function HeroMapSection() {
  const [userRole, setUserRole] = useState<'visitor' | 'owner' | 'other'>('visitor');

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Session check failed with status ${response.status}`);
        }

        const data: { user?: { role?: string } | null } = await response.json();
        if (!isMounted) return;

        const role = data.user?.role;
        setUserRole(
          role === 'beach_owner' || role === 'beach_manager'
            ? 'owner'
            : data.user
              ? 'other'
              : 'visitor'
        );
      } catch (error) {
        console.error('Unable to check the hero session:', error);
      }
    };

    void checkSession();

    void import('@/lib/supabase/client')
      .then(({ createClient }) => {
        if (!isMounted) return;

        const supabase = createClient();
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            void checkSession();
          } else if (event === 'SIGNED_OUT' && isMounted) {
            setUserRole('visitor');
          }
        });
        authSubscription = data.subscription;
      })
      .catch((error: unknown) => {
        console.error('Unable to subscribe to hero auth changes:', error);
      });

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  const showOwnerButton = userRole === 'owner';

  return (
    <section className="relative w-full h-[80vh] sm:h-[85vh] lg:h-[90vh] min-h-[500px] overflow-hidden text-slate-900 dark:text-white transition-colors duration-200">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          src="/beach1.mp4"
          preload="metadata"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center center' }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4 sm:space-y-5">
            <h1 className="font-sans font-extrabold tracking-tight text-white leading-[1.2] text-2xl sm:text-3xl lg:text-4xl drop-shadow-lg">
              Discover the Coastal Paradise of Binongkalan
            </h1>

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
              There&apos;s more to every destination than meets the eye.
            </p>
          </div>

          <div className="mt-7 min-h-[160px] sm:min-h-[108px]">
            <div className="flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/map"
                className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2 px-7 py-3 rounded-full bg-brand-navy-500 hover:bg-brand-navy-600 dark:bg-brand-navy-500 dark:hover:bg-brand-navy-600 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-brand-navy-900/30 hover:shadow-brand-navy-900/50 hover:-translate-y-0.5 active:translate-y-0 group border border-white/20 cursor-pointer sm:w-auto sm:max-w-none"
              >
                <Map className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Explore Beaches</span>
              </Link>
              {showOwnerButton && (
                <Link
                  href="/owner/dashboard"
                  className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/70 bg-white/10 px-6 py-3 font-medium text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:max-w-none sm:text-sm"
                >
                  <Store size={18} className="shrink-0" />
                  <span>Go to Dashboard</span>
                </Link>
              )}
            </div>
            {userRole === 'visitor' && (
              <p className="mt-5 text-sm text-white/90 drop-shadow-md sm:text-base">
                Want to showcase your resort in Binongkalan?{' '}
                <Link
                  href="/apply"
                  className="group/apply inline-flex whitespace-nowrap items-center gap-1 font-semibold text-brand-sun-400 underline underline-offset-4 hover:text-brand-sun-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  Apply as Beach Owner
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover/apply:translate-x-0.5"
                  />
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
