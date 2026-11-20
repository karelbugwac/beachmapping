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
  Eye,
  X,
  ExternalLink,
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

      {/* Section 1: How It Works */}
      <section className="w-full bg-slate-50 dark:bg-black/95 border-b border-slate-200/80 dark:border-neutral-900 transition-colors duration-200 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1F3F74] dark:text-[#F4BF3E] bg-[#F4BF3E]/20 dark:bg-amber-950/60 border border-[#F4BF3E]/40 px-3 py-1 rounded-full">
                Simple 3-Step Guide
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                How It Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Everything you need to discover, inspect, and plan your beach visit in Binongkalan, Catmon.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <ScrollReveal direction="up" delay={100} duration={600} className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all">
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
            <ScrollReveal direction="up" delay={200} duration={600} className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all">
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
            <ScrollReveal direction="up" delay={300} duration={600} className="relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all">
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
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-brand-navy-500 dark:text-brand-teal-300 leading-tight">
                Your Beach Guide
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Explore helpful tools and information for a more informed beach experience.
              </p>
            </div>
          </ScrollReveal>

          {/* 3 Columns divided by vertical borders with clean freestanding icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-neutral-800 text-center">
            {/* Column 1: Interactive Map (Map Icon - same as hero button) */}
            <ScrollReveal direction="up" delay={100} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <Map className="w-9 h-9 text-brand-navy-500 dark:text-brand-teal-300 stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                Interactive Map
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Explore verified beach resorts, inspect cottage amenities, check terrain conditions, and view authentic coastal routes across Binongkalan.
              </p>
            </ScrollReveal>

            {/* Column 2: Weather Forecast (CloudSun Icon - Sun & Clouds) */}
            <ScrollReveal direction="up" delay={200} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <CloudSun className="w-9 h-9 text-brand-navy-500 dark:text-brand-teal-300 stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                Weather Forecast
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Stay updated with real-time wave telemetry, tide levels, wind advisories, and marine weather forecasts for safe and well-planned beach trips.
              </p>
            </ScrollReveal>

            {/* Column 3: Bai Coastal Chatbot (Bot Icon) */}
            <ScrollReveal direction="up" delay={300} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <Bot className="w-9 h-9 text-brand-navy-500 dark:text-brand-teal-300 stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                Bai Coastal Chatbot
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Ask our 24/7 local AI guide about entrance fees, cottage reservations, travel guidelines, and local Catmon tips right when you need them.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Section 3: Take a 360° Look Around (4 Virtual Tours Luxury Showcase — Style of Reference Image 2) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Centered Header & Subheader */}
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1F3F74] dark:text-[#F4BF3E] bg-[#F4BF3E]/20 dark:bg-amber-950/60 border border-[#F4BF3E]/40 px-3.5 py-1 rounded-full">
                Interactive Panoramic Previews
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                Take a 360° Look Around
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                Inspect Binongkalan&apos;s coastlines before you visit. Explore real shoreline panoramas, open cabanas, and tide conditions for each destination.
              </p>
            </div>
          </ScrollReveal>

          {/* 4 Virtual Tour Cards: Luxury Showcase (Image 2 style with perspective card feel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {VIRTUAL_TOURS.map((tour, idx) => (
              <ScrollReveal
                key={tour.id}
                direction="up"
                delay={idx * 100}
                duration={600}
                className="group flex flex-col bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Image Top with 360 Badge */}
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
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                    <Eye className="w-3 h-3 text-[#F4BF3E]" />
                    <span>360° Tour</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between text-center space-y-3 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-neutral-950/40">
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                      {tour.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-snug">
                      {tour.tagline}
                    </p>
                  </div>

                  {/* Yellow Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTour(tour)}
                      className="w-full px-5 py-2.5 rounded-none bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Explore 360°</span>
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: What People Are Saying (WHITE Background - Harmonious Spacing, Dive Header) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 relative">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={600}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-brand-navy-500 dark:text-brand-teal-300 leading-tight">
                What People Are Saying
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
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
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
                Be Part of Dagat Ta Bai
              </h2>
              <p className="text-xs sm:text-sm text-brand-navy-100/90 max-w-lg mx-auto leading-relaxed">
                Are you a beach or resort owner? Join our platform and let more people discover your place
              </p>
            </div>

            <div className="flex justify-center pt-6 sm:pt-7">
              {/* Yellow Button */}
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-[#1F3F74] text-xs sm:text-sm font-black transition-all duration-200 shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0"
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
