'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ArrowRight, ChevronDown } from 'lucide-react';

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
    subtext: 'Known for its clear waters and rock shoreline.',
    image: '/ranola.jpg',
    slug: 'ranola',
  },
  {
    id: 'litebay',
    resortName: 'LiteBay Resort',
    subtext: 'Known for its peaceful seaside setting and affordable beach getaway.',
    image: '/litebay.jpg',
    slug: 'litebay',
  },
  {
    id: 'hinagdan',
    resortName: 'Hinagdan Beach Resort',
    subtext: 'Known for its cliffside location and cliff-jumping experience.',
    image: '/hinagdan.jpg',
    slug: 'hinagdan',
  },
  {
    id: 'majestique',
    resortName: 'Majestique View Resort',
    subtext: 'Elevated cliffside ocean deck and sunset viewing overlooking pristine coral reefs.',
    image: '/majestique.jpg',
    slug: 'majestiqueview',
  },
];

interface HeroMapSectionProps {
  isAuthenticated?: boolean;
  ctaText?: string;
  ctaHref?: string;
  greeting?: string;
  subGreeting?: string;
  bare?: boolean;
}

export function HeroMapSection({
  isAuthenticated = false,
  ctaText,
  ctaHref,
  greeting,
  bare = false,
}: HeroMapSectionProps) {
  const [userRole, setUserRole] = useState<'visitor' | 'owner' | 'other'>(isAuthenticated ? 'other' : 'visitor');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSlugs, setActiveSlugs] = useState<Set<string> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const loadActiveSlugs = async () => {
      try {
        const res = await fetch('/api/beaches', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data)) {
          const slugs = new Set<string>();
          for (const b of data) {
            if (b?.slug) slugs.add(String(b.slug).toLowerCase());
            if (b?.name) slugs.add(String(b.name).toLowerCase());
          }
          setActiveSlugs(slugs);
        }
      } catch {
        // Fallback to all slides
      }
    };
    void loadActiveSlugs();
    return () => {
      active = false;
    };
  }, []);

  const visibleSlides = React.useMemo(() => {
    if (!activeSlugs) return HERO_SLIDES;
    const filtered = HERO_SLIDES.filter(
      (s) =>
        activeSlugs.has(s.slug.toLowerCase()) ||
        activeSlugs.has(s.id.toLowerCase()) ||
        activeSlugs.has(s.resortName.toLowerCase())
    );
    return filtered.length > 0 ? filtered : HERO_SLIDES;
  }, [activeSlugs]);

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

  // Automatic slideshow timer: transitions cleanly every 3 seconds
  useEffect(() => {
    if (isPaused || visibleSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % visibleSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, visibleSlides.length]);

  const goToSlide = useCallback((index: number) => {
    if (visibleSlides.length === 0) return;
    setCurrentSlide((index + visibleSlides.length) % visibleSlides.length);
  }, [visibleSlides.length]);

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
  const safeIndex = currentSlide % visibleSlides.length;
  const activeSlide = visibleSlides[safeIndex] || HERO_SLIDES[0];

  return (
    <section
      aria-label="Binongkalan Beach Resorts Showcase"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[88vh] sm:h-[100vh] lg:h-[108vh] min-h-[600px] overflow-hidden text-white select-none transition-colors duration-200"
    >
      {/* ── Background Slides: Smooth Crossfade + Subtle Ken-Burns Zoom ── */}
      <div className="absolute inset-0 z-0 bg-black">
        {visibleSlides.map((slide, idx) => {
          const isActive = idx === safeIndex;
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
                quality={100}
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          );
        })}

        {/* Light & Clean Gradient Overlay: Keeps middle of photos bright, vivid & crystal clear */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-black/10 to-black/20 pointer-events-none sm:from-black/85 sm:via-black/15 sm:to-black/35" />
      </div>

      {/* ── Main Hero Content (Adjusted lower down to emphasize resort scenery, refined sizing) ── */}
      <div className="relative z-30 flex flex-col justify-end items-center md:items-start h-full px-5 sm:px-8 lg:px-12 text-center md:text-left pt-24 pb-32 sm:pb-32 md:pb-36 max-w-7xl mx-auto w-full">
        {bare ? (
          <div className="space-y-3 max-w-xl w-full">
            {greeting && (
              <h1 className="font-display font-medium tracking-tight text-white leading-[1.16] text-xl sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
                {greeting}
              </h1>
            )}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2.5">
              <Link
                href={resolvedCtaHref}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-display uppercase tracking-[0.12em] font-medium text-xs transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 group border border-amber-300/50 cursor-pointer"
              >
                <span>{resolvedCtaText}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ) : (
        <div className="space-y-2.5 sm:space-y-3 max-w-xl w-full">

          {/* Dynamic Beach Name Headline: Refined & Elegant Size, Emphasizing Beach Photography */}
          <h1
            key={`title-${activeSlide.id}`}
            className="font-display font-medium tracking-tight text-white leading-[1.16] text-xl sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            {activeSlide.resortName}
          </h1>

          {/* Subtitle: Resort Vibe Description */}
          <p
            key={`desc-${activeSlide.id}`}
            className="text-xs sm:text-[13px] md:text-sm text-white/90 font-display font-light leading-relaxed max-w-lg mx-auto md:mx-0 drop-shadow-md animate-in fade-in duration-700"
          >
            {activeSlide.subtext}
          </p>

          {/* Call to Action Button Row: Compact & Refined Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2.5">
            <Link
              href={resolvedCtaHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-display uppercase tracking-[0.12em] font-medium text-xs transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 group border border-amber-300/50 cursor-pointer"
            >
              <span>{isAuthenticated || userRole !== 'visitor' ? 'Explore Beaches' : 'Start Exploring'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            {showOwnerButton && (
              <Link
                href="/owner/dashboard"
                className="inline-flex min-h-[38px] w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/70 bg-white/10 px-5 py-2 font-display uppercase tracking-[0.12em] font-medium text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:max-w-none"
              >
                <Store size={16} className="shrink-0" />
                <span>Go to Dashboard</span>
              </Link>
            )}
          </div>

          {/* Owner feature prompt: Apply here hyperlink in yellow font color */}
          <p className="text-[11px] sm:text-xs text-white/85 drop-shadow-md pt-0.5 font-display">
            Own a beach or resort in Binongkalan and want to get featured?{' '}
            <Link
              href={isAuthenticated ? '/apply' : '/register?redirect=/apply'}
              className="text-[#F4BF3E] hover:text-[#ffe082] font-bold underline underline-offset-4 transition-colors"
            >
              Apply here
            </Link>
          </p>

        </div>
        )}
      </div>

      {/* ── Scroll Indicator: hints there's more content below ── */}
      <div className="absolute bottom-12 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1 text-white/90">
        <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] drop-shadow-md">
          Scroll
        </span>
        <ChevronDown className="h-5 w-5 animate-bounce drop-shadow-md" />
      </div>
    </section>
  );
}
