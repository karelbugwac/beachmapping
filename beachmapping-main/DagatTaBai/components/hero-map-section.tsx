'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';

interface HeroSlide {
  id: string;
  resortName: string;
  tagline: string;
  subtext: string;
  image: string;
  slug: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'ranola',
    resortName: 'Rañola Beach Resort',
    tagline: 'Your Tropical Escape in Binongkalan',
    subtext: 'Tranquil shores, authentic open cottages, and crystal shallows in Catmon, Cebu.',
    image: '/ranola.jpg',
    slug: 'ra-ola-beach',
  },
  {
    id: 'litebay',
    resortName: 'LiteBay Resort',
    tagline: 'Your Comfortable Coastal Retreat',
    subtext: 'Peaceful private cove with shaded cottage huts and relaxing Camotes Sea breezes.',
    image: '/litebay.jpg',
    slug: 'litebay-resort',
  },
  {
    id: 'hinagdan',
    resortName: 'Hinagdan Beach Resort',
    tagline: 'Natural Rock Steps & Crystal Waters',
    subtext: 'Iconic limestone cliffside stairway descending into refreshing natural tidal pools.',
    image: '/hinagdan.jpg',
    slug: 'hinagdan-beach',
  },
  {
    id: 'majestique',
    resortName: 'Majestique View Resort',
    tagline: 'Panoramic Camotes Sea Vistas',
    subtext: 'Elevated cliffside ocean deck and sunset viewing overlooking pristine reefs.',
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
  greeting,
  subGreeting,
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

  // Automatic slideshow timer (every 6 seconds unless paused on user interaction)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
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

      {/* ── Desktop Prev / Next Chevrons ── */}
      <div className="hidden sm:flex absolute inset-y-0 inset-x-4 lg:inset-x-8 z-30 items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous resort slide"
          className="pointer-events-auto w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white/90 hover:text-white border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer hover:border-white/50"
        >
          <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next resort slide"
          className="pointer-events-auto w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white/90 hover:text-white border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer hover:border-white/50"
        >
          <ChevronRight className="w-5 h-5 translate-x-0.5" />
        </button>
      </div>

      {/* ── Main Hero Content (Inspired by Bluewater Maribago) ── */}
      <div className="relative z-30 flex flex-col items-center justify-center h-full px-5 sm:px-8 lg:px-12 text-center pt-20 sm:pt-24 pb-16 sm:pb-20 max-w-5xl mx-auto">
        <div className="space-y-4 sm:space-y-6 w-full">
          
          {/* Eyebrow: Resort Location & Identity */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[#F4BF3E] text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase shadow-md transition-all duration-500">
            <span>{activeSlide.resortName} • Binongkalan</span>
          </div>

          {/* Dynamic Headline: Smooth crossfade matching the current resort */}
          <h1
            key={`title-${activeSlide.id}`}
            className="font-display font-medium tracking-tight text-white leading-[1.15] text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            {activeSlide.tagline}
          </h1>

          {/* Subtitle: Resort Vibe Description */}
          <p
            key={`desc-${activeSlide.id}`}
            className="text-xs sm:text-sm md:text-base text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md animate-in fade-in duration-700"
          >
            {activeSlide.subtext}
          </p>

          {/* Call to Action Button Row */}
          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={resolvedCtaHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] font-black text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 group border border-amber-300/60 cursor-pointer"
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
          <p className="text-xs sm:text-sm text-white/85 drop-shadow-md pt-2">
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

      {/* ── Slide Indicators / Dashes at the Bottom ── */}
      <div className="absolute bottom-6 sm:bottom-8 inset-x-0 z-30 flex items-center justify-center gap-2.5">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${slide.resortName}`}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                isActive
                  ? 'w-8 bg-[#F4BF3E]'
                  : 'w-2 bg-white/40 hover:bg-white/75'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
