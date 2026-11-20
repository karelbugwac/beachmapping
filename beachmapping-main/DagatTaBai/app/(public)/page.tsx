'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star,
  Map,
  CloudSun,
  Bot,
  Compass,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { HeroMapSection } from '@/components/hero-map-section';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useRealtimeSync } from '@/lib/realtime-sync';

interface VirtualTourItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  tourUrl: string;
  slug: string;
}

const VIRTUAL_TOURS: VirtualTourItem[] = [
  {
    id: 'ranola',
    name: 'Rañola Beach',
    tagline: 'Experience Comfort & Serenity',
    description: 'Tranquil shoreline with authentic open cottages and crystal shallows.',
    coverImage: 'https://rywgvumqhdptolijfdys.supabase.co/storage/v1/object/public/beach-media/ecc03e08-aae1-48d2-87ed-096bb02219e0/395195f5-525e-4628-a3cb-80cb697d9da0/8752e2f5-ce05-45c0-8ff9-4491f96dcc59.webp',
    tourUrl: 'https://tour.panoee.net/6ac4b494035368b0747a8077',
    slug: 'ra-ola-beach',
  },
  {
    id: 'litebay',
    name: 'LiteBay Resort',
    tagline: 'Your Comfortable Coastal Retreat',
    description: 'Peaceful private cove with shaded cottage huts and relaxing ocean breezes.',
    coverImage: 'https://rywgvumqhdptolijfdys.supabase.co/storage/v1/object/public/beach-media/b77372e3-937e-4d6d-8c9f-70140337ec9e/4c491f53-f43f-4519-b2cd-f4b5bbf67cf1/a633e921-b0c5-4afd-aa96-a758927a8b6d.jpg',
    tourUrl: 'https://tour.panoee.net/6ac4b494035368b0747a8077',
    slug: 'litebay-resort',
  },
  {
    id: 'majestique',
    name: 'Majestique View Resort',
    tagline: 'Indulge in Tranquility & Sea Views',
    description: 'Cliffside vistas overlooking the open Camotes Sea with coral reef shallows.',
    coverImage: 'https://rywgvumqhdptolijfdys.supabase.co/storage/v1/object/public/beach-media/e6aa7181-7d43-435d-9701-96d9b1cd220c/ae36c165-2f63-4566-80ac-1d44f7b62f87/fd8165c8-83dc-420c-8a52-9b4059be1d9d.webp',
    tourUrl: 'https://tour.panoee.net/6ac4b494035368b0747a8077',
    slug: 'majestique-beach',
  },
  {
    id: 'hinagdan',
    name: 'Hinagdan Beach',
    tagline: 'Natural Rock Steps & Crystal Waters',
    description: 'Iconic limestone staircase descending directly into refreshing natural tidal pools.',
    coverImage: 'https://rywgvumqhdptolijfdys.supabase.co/storage/v1/object/public/beach-media/6322f704-b8b8-4600-bb3c-d16ebc6b7494/fa4c9520-8b31-443e-b7dd-0b40a6d3c182/45569d84-fc76-4fa9-9310-837bbef53e28.jpg',
    tourUrl: 'https://tour.panoee.net/6ac4b494035368b0747a8077',
    slug: 'hinagdan-beach',
  },
];

interface SystemTestimonial {
  id: string;
  user_name: string;
  profile_image_url?: string | null;
  user_role?: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Helper function to mask user name: e.g. "Charisse Villamor" -> "C*** V***"
function maskUserName(name: string): string {
  if (!name || name.trim() === '' || name.toLowerCase().includes('dagat ta bai user')) {
    return 'Community member';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const p = parts[0];
    return p.length > 1 ? `${p[0]}***` : `${p}***`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first[0]}*** ${last[0]}***`;
}

function formatRole(role: string | undefined): string {
  const labels: Record<string, string> = {
    user: 'User',
    beach_owner: 'Beach owner',
    beach_manager: 'Beach manager',
    admin: 'Admin',
  };
  return role ? labels[role] || 'User' : 'User';
}

export default function HomePage() {
  const router = useRouter();
  const [systemTestimonials, setSystemTestimonials] = useState<SystemTestimonial[]>([]);
  const [loadVirtualTour, setLoadVirtualTour] = useState(false);
  const [selectedTour, setSelectedTour] = useState<VirtualTourItem | null>(null);
  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const tourTouchStartX = useRef<number | null>(null);

  const prevTour = () => {
    setActiveTourIndex((prev) => (prev - 1 + VIRTUAL_TOURS.length) % VIRTUAL_TOURS.length);
  };

  const nextTour = () => {
    setActiveTourIndex((prev) => (prev + 1) % VIRTUAL_TOURS.length);
  };

  const tourContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          router.replace('/home');
        }
      })
      .catch(() => {});
  }, [router]);

  const fetchSystemTestimonials = async () => {
    try {
      const res = await fetch('/api/platform-feedback');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const highRated = data.filter(
            (item: SystemTestimonial) => item.rating >= 4 && item.rating <= 5
          );
          setSystemTestimonials(highRated);
        }
      }
    } catch {
      setSystemTestimonials([]);
    }
  };

  useEffect(() => {
    void fetchSystemTestimonials();
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  useRealtimeSync(() => {
    void fetchSystemTestimonials();
  });

  useEffect(() => {
    if (!loadVirtualTour) return;

    const panoIframeName = 'tour-embeded';
    let rafId: number | null = null;
    let lastPostTime = 0;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const now = performance.now();
      // Throttle to ~15fps (every 66ms) so postMessage does not block main thread
      if (now - lastPostTime < 66) return;
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        lastPostTime = performance.now();
        const iframe = document.getElementById(panoIframeName) as HTMLIFrameElement | null;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: 'devicemotion',
              deviceMotionEvent: {
                acceleration: {
                  x: e.acceleration?.x ?? null,
                  y: e.acceleration?.y ?? null,
                  z: e.acceleration?.z ?? null,
                },
                accelerationIncludingGravity: {
                  x: e.accelerationIncludingGravity?.x ?? null,
                  y: e.accelerationIncludingGravity?.y ?? null,
                  z: e.accelerationIncludingGravity?.z ?? null,
                },
                rotationRate: {
                  alpha: e.rotationRate?.alpha ?? null,
                  beta: e.rotationRate?.beta ?? null,
                  gamma: e.rotationRate?.gamma ?? null,
                },
                interval: e.interval,
                timeStamp: e.timeStamp,
              },
            },
            '*'
          );
        }
      });
    };

    window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [loadVirtualTour]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200 selection:bg-brand-navy-100 selection:text-brand-navy-900 overflow-x-hidden">
      {/* Hero Section */}
      <HeroMapSection
        isAuthenticated={false}
        ctaText="-> Start Exploring"
        ctaHref="/register"
      />

      {/* Section 1: How It Works (Clean Pure White & Black — Zero Beige, Zero Pill Badges) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2.5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                How It Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Everything you need to discover, inspect, and plan your beach visit in Binongkalan, Catmon.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <ScrollReveal direction="up" delay={100} duration={600} className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#F4BF3E]/20 text-[#1F3F74] dark:text-[#F4BF3E] font-display font-black text-lg flex items-center justify-center">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Explore Verified Beaches
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Browse authentic cottage fees, real entrance rates, available amenities, and terrain conditions for all 4 beaches in Binongkalan.
                </p>
              </div>
            </ScrollReveal>

            {/* Step 2 */}
            <ScrollReveal direction="up" delay={200} duration={600} className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#F4BF3E]/20 text-[#1F3F74] dark:text-[#F4BF3E] font-display font-black text-lg flex items-center justify-center">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Inspect in 360° Virtual Tour
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Take an interactive panoramic stroll around the shoreline, sea horizons, and cottages directly on your screen before packing.
                </p>
              </div>
            </ScrollReveal>

            {/* Step 3 */}
            <ScrollReveal direction="up" delay={300} duration={600} className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#F4BF3E]/20 text-[#1F3F74] dark:text-[#F4BF3E] font-display font-black text-lg flex items-center justify-center">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Plan Routes &amp; Ask Bai
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Calculate travel routes from your starting location and chat with Bai, our 24/7 AI guide, for tide advice and local Catmon tips.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Section 2: Your Beach Guide (WHITE Background - Harmonious Spacing, Dive Header) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 relative">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2.5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                Your Beach Guide
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Explore helpful tools and information for a more informed beach experience.
              </p>
            </div>
          </ScrollReveal>

          {/* 3 Columns divided by vertical borders with clean freestanding icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-neutral-800 text-center">
            {/* Column 1: Interactive Map (Map Icon - same as hero button) */}
            <ScrollReveal direction="up" delay={100} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <Map className="w-9 h-9 text-[#1F3F74] dark:text-[#F4BF3E] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-display font-bold tracking-widest uppercase text-slate-900 dark:text-white">
                Interactive Map
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs font-sans">
                Explore verified beach resorts, inspect cottage amenities, check terrain conditions, and view authentic coastal routes across Binongkalan.
              </p>
            </ScrollReveal>

            {/* Column 2: Weather Forecast (CloudSun Icon - Sun & Clouds) */}
            <ScrollReveal direction="up" delay={200} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <CloudSun className="w-9 h-9 text-[#1F3F74] dark:text-[#F4BF3E] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-display font-bold tracking-widest uppercase text-slate-900 dark:text-white">
                Weather Forecast
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs font-sans">
                Stay updated with real-time wave telemetry, tide levels, wind advisories, and marine weather forecasts for safe and well-planned beach trips.
              </p>
            </ScrollReveal>

            {/* Column 3: Bai Coastal Chatbot (Bot Icon) */}
            <ScrollReveal direction="up" delay={300} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <Bot className="w-9 h-9 text-[#1F3F74] dark:text-[#F4BF3E] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-display font-bold tracking-widest uppercase text-slate-900 dark:text-white">
                Bai Coastal Chatbot
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs font-sans">
                Ask our 24/7 local AI guide about entrance fees, cottage reservations, travel guidelines, and local Catmon tips right when you need them.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Section 3: Take a 360° Look Around (3D Perspective Resort Carousel — Style of Bluewater) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto">
          {/* Centered Header & Subheader (Zero Pill Badges) */}
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                Take a 360° Look Around
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-sans">
                Inspect Binongkalan&apos;s coastlines before you visit. Explore real shoreline panoramas, open cabanas, and tide conditions for each destination.
              </p>
            </div>
          </ScrollReveal>

          {/* 3D Perspective Carousel Container */}
          <div
            className="relative w-full max-w-5xl mx-auto flex items-center justify-center [perspective:1400px] min-h-[490px] sm:min-h-[530px]"
            onTouchStart={(e) => {
              tourTouchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (tourTouchStartX.current === null) return;
              const diff = tourTouchStartX.current - e.changedTouches[0].clientX;
              if (diff > 50) nextTour();
              else if (diff < -50) prevTour();
              tourTouchStartX.current = null;
            }}
          >
            {/* Desktop Navigation Chevrons */}
            <div className="hidden sm:flex absolute -left-2 lg:-left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <button
                type="button"
                onClick={prevTour}
                aria-label="Previous beach tour"
                className="pointer-events-auto w-11 h-11 rounded-full border border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 text-slate-800 dark:text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer hover:border-[#1F3F74]/50"
              >
                <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
              </button>
            </div>

            <div className="hidden sm:flex absolute -right-2 lg:-right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <button
                type="button"
                onClick={nextTour}
                aria-label="Next beach tour"
                className="pointer-events-auto w-11 h-11 rounded-full border border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 text-slate-800 dark:text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer hover:border-[#1F3F74]/50"
              >
                <ChevronRight className="w-5 h-5 translate-x-0.5" />
              </button>
            </div>

            {/* The 3D Cards Stack */}
            <div className="relative w-full h-[470px] sm:h-[510px] flex items-center justify-center">
              {VIRTUAL_TOURS.map((tour, idx) => {
                let offset = idx - activeTourIndex;
                if (offset > 2) offset -= VIRTUAL_TOURS.length;
                if (offset < -2) offset += VIRTUAL_TOURS.length;

                const isCenter = offset === 0;
                const isLeft = offset === -1 || (offset === 3 - VIRTUAL_TOURS.length);
                const isRight = offset === 1 || (offset === VIRTUAL_TOURS.length - 3);
                const isVisible = isCenter || isLeft || isRight;

                let zIndex = 0;
                let transformValue = '';
                if (isCenter) {
                  transformValue = 'translate3d(0, 0, 0) scale(1) rotateY(0deg)';
                  zIndex = 25;
                } else if (isLeft) {
                  transformValue = 'translate3d(-52%, 0, -60px) scale(0.88) rotateY(20deg)';
                  zIndex = 10;
                } else if (isRight) {
                  transformValue = 'translate3d(52%, 0, -60px) scale(0.88) rotateY(-20deg)';
                  zIndex = 10;
                } else {
                  transformValue = 'translate3d(0, 0, -200px) scale(0.5)';
                  zIndex = 0;
                }

                return (
                  <div
                    key={tour.id}
                    onClick={() => {
                      if (isLeft) prevTour();
                      if (isRight) nextTour();
                    }}
                    style={{
                      transform: transformValue,
                      zIndex,
                      opacity: isVisible ? (isCenter ? 1 : 0.72) : 0,
                      pointerEvents: isVisible ? 'auto' : 'none',
                    }}
                    className={`absolute w-[290px] sm:w-[340px] md:w-[380px] transition-all duration-500 ease-out origin-center cursor-pointer ${
                      isCenter ? 'cursor-default' : 'hover:opacity-90'
                    }`}
                  >
                    <div className="flex flex-col bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300">
                      {/* Photo Top with aspect 4:3 */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tour.coverImage}
                          alt={tour.name}
                          width={400}
                          height={300}
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '100%', aspectRatio: '4 / 3' }}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        {/* Left / Right 3D shadow gradient overlay */}
                        {!isCenter && (
                          <div
                            className={`absolute inset-0 bg-gradient-to-${
                              isLeft ? 'r' : 'l'
                            } from-black/40 to-transparent pointer-events-none`}
                          />
                        )}
                      </div>

                      {/* Card Body (Inspired by Bluewater Maribago in Image 4) */}
                      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between text-center space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-display font-medium text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                            {tour.name}
                          </h3>
                          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-sans italic leading-relaxed">
                            {tour.tagline}
                          </p>
                        </div>

                        {/* Yellow Action Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTour(tour);
                            }}
                            className="w-full px-6 py-3 rounded-none bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] font-display uppercase tracking-[0.16em] font-black text-xs transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 cursor-pointer text-center"
                          >
                            Explore 360°
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicator Dots Below */}
          <div className="flex items-center justify-center gap-2.5 pt-6 sm:pt-8">
            {VIRTUAL_TOURS.map((tour, idx) => {
              const isActive = idx === activeTourIndex;
              return (
                <button
                  key={tour.id}
                  type="button"
                  onClick={() => setActiveTourIndex(idx)}
                  aria-label={`View tour for ${tour.name}`}
                  className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-8 bg-[#F4BF3E]'
                      : 'w-2 bg-slate-300 dark:bg-neutral-700 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: What People Are Saying (WHITE Background - Harmonious Spacing, Dive Header) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 relative">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={600}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2.5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                What People Are Saying
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans">
                Read honest feedback from users how Dagat Ta Bai helps people make informed beach decisions
              </p>
            </div>
          </ScrollReveal>

          {systemTestimonials.length > 0 ? (
            /* On mobile: flex overflow-x-auto with snap-x for side-swiping; On sm+: standard responsive grid */
            <div className="flex overflow-x-auto pb-4 pt-1 snap-x snap-mandatory gap-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {systemTestimonials.map((item, index) => (
                <div
                  key={item.id}
                  className="w-[82vw] max-w-[320px] flex-shrink-0 snap-center sm:w-auto sm:max-w-none sm:flex-shrink"
                >
                  <ScrollReveal direction="up" delay={index * 100} duration={600} className="h-full">
                    <div className="h-full min-h-[220px] min-w-0 p-6 sm:p-7 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between gap-5 hover:border-brand-navy-500/30 hover:shadow-md transition-all duration-200">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-navy-50 text-sm font-bold text-brand-navy-500 dark:bg-brand-navy-900/60 dark:text-brand-navy-200">
                              <span>{item.user_name?.trim().charAt(0).toUpperCase() || 'U'}</span>
                              {item.profile_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.profile_image_url}
                                  alt={`${maskUserName(item.user_name)} profile`}
                                  width={40}
                                  height={40}
                                  loading="lazy"
                                  decoding="async"
                                  style={{ width: '40px', height: '40px', aspectRatio: '1 / 1' }}
                                  className="absolute inset-0 h-10 w-10 rounded-full object-cover shrink-0"
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                item.user_name?.trim().charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                {maskUserName(item.user_name)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {formatRole(item.user_role)}
                              </div>
                            </div>
                          </div>

                          {/* Display the 5 stars */}
                          <div className="flex items-center gap-0.5 text-brand-sun-700 flex-shrink-0" title={`${item.rating}.0 out of 5 stars`}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < Math.round(item.rating)
                                    ? 'fill-brand-sun-400 text-brand-sun-700'
                                    : 'fill-slate-200 text-slate-300 dark:fill-neutral-800 dark:text-neutral-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="break-words text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1 [overflow-wrap:anywhere]">
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      </div>
                      <time className="text-xs text-slate-400 dark:text-slate-500" dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </time>
                    </div>
                  </ScrollReveal>
                </div>
              ))}
            </div>
          ) : (
            <ScrollReveal direction="up" duration={600}>
              <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No community feedback yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Share how Dagat Ta Bai has helped you plan your next beach visit.
                </p>
                <Link href="/feedback" className="mt-4 inline-flex text-sm font-semibold text-brand-navy-500 hover:underline dark:text-brand-teal-300">
                  Leave feedback
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Section 5: Be Part of Dagat Ta Bai (DARK DIVE BLUE Background #124168 - Harmonious Spacing, Single Clean Button) */}
      <section className="w-full bg-brand-navy-500 dark:bg-brand-navy-700 text-white border-b border-white/10 transition-colors duration-200 relative overflow-hidden">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10 text-center space-y-5">
          <ScrollReveal direction="up" duration={650}>
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-white leading-tight">
                Be Part of Dagat Ta Bai
              </h2>
              <p className="text-xs sm:text-sm text-brand-navy-100/90 max-w-lg mx-auto leading-relaxed font-sans">
                Are you a beach or resort owner? Join our platform and let more people discover your place
              </p>
            </div>

            <div className="flex justify-center pt-6 sm:pt-7">
              {/* Yellow Button */}
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] text-xs sm:text-sm font-display uppercase tracking-[0.14em] font-black transition-all duration-200 shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Apply as Beach Owner
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 360° Interactive Viewer Modal */}
      {selectedTour && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-5xl bg-slate-950 border border-white/20 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4BF3E] animate-pulse" />
                <h3 className="font-display font-bold text-base sm:text-lg">
                  {selectedTour.name} — 360° Virtual Tour
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/beaches/${selectedTour.slug}`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] text-xs font-bold transition-colors"
                >
                  <span>View Beach Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedTour(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close 360 Tour"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Iframe Content */}
            <div className="relative w-full h-[55vh] sm:h-[65vh] bg-black">
              <iframe
                title={selectedTour.name}
                src={selectedTour.tourUrl}
                width="100%"
                height="100%"
                tabIndex={-1}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; magnetometer; picture-in-picture; web-share; xr-spatial-tracking"
                className="w-full h-full border-0 block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
