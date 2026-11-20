'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Map,
  Store,
} from 'lucide-react';
import { AdaptiveVideo } from '@/components/ui/adaptive-video';

interface HeroMapSectionProps {
  isAuthenticated?: boolean;
  ctaText?: string;
  ctaHref?: string;
  greeting?: string;
  subGreeting?: string;
}

export function HeroMapSection({
  isAuthenticated = false,
  ctaText,
  ctaHref,
  greeting,
  subGreeting,
}: HeroMapSectionProps) {
  const [userRole, setUserRole] = useState<'visitor' | 'owner' | 'other'>(isAuthenticated ? 'other' : 'visitor');

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
  const resolvedCtaText = ctaText || (isAuthenticated || userRole !== 'visitor' ? 'Explore Beaches' : '-> Start Exploring');
  const resolvedCtaHref = ctaHref || (isAuthenticated || userRole !== 'visitor' ? '/map' : '/register');

  return (
    <section className="relative w-full h-[80vh] sm:h-[85vh] lg:h-[90vh] min-h-[500px] overflow-hidden text-slate-900 dark:text-white transition-colors duration-200">
      {/* Video Background with Adaptive HLS streaming and WebP poster */}
      <div className="absolute inset-0 z-0">
        <AdaptiveVideo
          hlsSrc="/videos/beach-hero/master.m3u8"
          fallbackMp4="/beach1.mp4"
          poster="/images/beach-hero-poster.webp"
          className="w-full h-full object-cover"
          objectPosition="center center"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 text-center pt-16 sm:pt-20">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
          {greeting && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-sky-200 text-xs sm:text-sm font-bold shadow-md animate-in fade-in duration-300">
              <span>{greeting}</span>
            </div>
          )}

          <h1 className="font-sans font-extrabold tracking-tight text-white leading-[1.2] text-2xl sm:text-3xl lg:text-4xl drop-shadow-lg">
            {subGreeting || 'Discover the Coastal Paradise of Binongkalan'}
          </h1>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            There&apos;s more to every destination than meets the eye.
          </p>

          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={resolvedCtaHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#16325c] text-white font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-brand-navy-900/40 hover:shadow-brand-navy-900/60 hover:-translate-y-0.5 active:translate-y-0 group border border-white/20 cursor-pointer"
            >
              <span>{resolvedCtaText}</span>
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

          {/* Owner feature prompt: Apply here hyperlink in yellow font color */}
          <p className="text-xs sm:text-sm text-white/90 drop-shadow-md pt-2">
            Own a beach or resort in Binongkalan and want to get featured?{' '}
            <Link
              href={isAuthenticated ? '/apply' : '/register?redirect=/apply'}
              className="text-[#F4BF3E] hover:text-[#ffe082] font-bold underline underline-offset-4 transition-colors"
            >
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
