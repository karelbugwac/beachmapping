'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ArrowRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  resortName: string;
  subtext: string;
  image: string;
  slug: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'ranola',
    resortName: 'Rañola Beach Resort',
    subtext: 'Tranquil shores, authentic open cottages, and crystal shallows in Catmon, Cebu.',
    image: '/ranola.jpg',
    slug: 'ra-ola-beach',
  },
  {
    id: 'litebay',
    resortName: 'LiteBay Resort',
    subtext: 'Peaceful private cove with shaded cottage huts and relaxing Camotes Sea breezes.',
    image: '/litebay.jpg',
    slug: 'litebay-resort',
  },
  {
    id: 'hinagdan',
    resortName: 'Hinagdan Beach Resort',
    subtext: 'Iconic limestone cliffside stairway descending into refreshing natural tidal pools.',
    image: '/hinagdan.jpg',
    slug: 'hinagdan-beach',
  },
  {
    id: 'majestique',
    resortName: 'Majestique View Resort',
    subtext: 'Elevated cliffside ocean deck and sunset viewing overlooking pristine coral reefs.',
    image: '/majestique.webp',
    slug: 'majestique-beach',
  },
];

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
}: HeroMapSectionProps) {
  const [userRole, setUserRole] = useState<'visitor' | 'owner' | 'other'>(isAuthenticated ? 'other' : 'visitor');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

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

  // Automatic slideshow timer: transitions cleanly every 5.5s
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide((index + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const showOwnerButton = userRole === 'owner';
  const resolvedCtaText = ctaText || (isAuthenticated || userRole !== 'visitor' ? 'Explore Beaches' : '-> Start Exploring');
  const resolvedCtaHref = ctaHref || (isAuthenticated || userRole !== 'visitor' ? '/map' : '/register');
  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section
      aria-label="Binongkalan Beach Resorts Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[85vh] sm:h-[90vh] lg:h-[94vh] min-h-[560px] overflow-hidden text-white select-none transition-colors duration-200"
    >
      {/* ── Background Slides: Smooth Crossfade + Subtle Ken-Burns Zoom ── */}
      <div className="absolute inset-0 z-0 bg-black">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.resortName}
                fill
                priority={idx === 0}
                unoptimized
                sizes="100vw"
                className={`object-cover object-center transition-transform duration-[8000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />
            </div>
          );
        })}

        {/* High-Contrast Gradient Overlay for Crisp Text & Navbar Legibility */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/45 to-black/55 pointer-events-none" />
      </div>

      {/* ── Main Hero Content (Aligned to Side on Desktop to Showcase Photo, Centered Lower on Mobile) ── */}
      <div className="relative z-30 flex flex-col justify-end md:justify-center items-center md:items-start h-full px-5 sm:px-8 lg:px-12 text-center md:text-left pt-20 pb-12 sm:pb-16 md:pb-0 max-w-7xl mx-auto w-full">
        <div className="space-y-3 sm:space-y-4 max-w-2xl w-full">

          {/* Dynamic Beach Name Headline: Refined & Elegant Size, Never Dominating Screen */}
          <h1
            key={`title-${activeSlide.id}`}
            className="font-display font-medium tracking-tight text-white leading-[1.14] text-2xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            {activeSlide.resortName}
          </h1>

          {/* Subtitle: Resort Vibe Description */}
          <p
            key={`desc-${activeSlide.id}`}
            className="text-xs sm:text-sm md:text-base text-white/90 font-light leading-relaxed max-w-xl mx-auto md:mx-0 drop-shadow-md animate-in fade-in duration-700"
          >
            {activeSlide.subtext}
          </p>

          {/* Call to Action Button Row: Aligned to side on desktop, centered on mobile */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
            <Link
              href={resolvedCtaHref}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-display uppercase tracking-[0.14em] font-medium text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 group border border-amber-300/60 cursor-pointer"
            >
              <span>{isAuthenticated || userRole !== 'visitor' ? 'Explore Beaches' : 'Start Exploring'}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            {showOwnerButton && (
              <Link
                href="/owner/dashboard"
                className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/70 bg-white/10 px-6 py-3 font-display uppercase tracking-[0.12em] font-medium text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:max-w-none sm:text-sm"
              >
                <Store size={18} className="shrink-0" />
                <span>Go to Dashboard</span>
              </Link>
            )}
          </div>

          {/* Owner feature prompt: Apply here hyperlink in yellow font color */}
          <p className="text-xs sm:text-sm text-white/85 drop-shadow-md pt-1 font-sans">
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
