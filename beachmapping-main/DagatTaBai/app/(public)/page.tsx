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
  MapPin,
  Waves,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Wind,
  Thermometer,
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
    description: 'Tranquil shoreline with authentic open cottages and crystal shallows in Binongkalan.',
    coverImage: '/ranola.jpg',
    tourUrl: 'https://tour.panoee.net/6ac4b494035368b0747a8077',
    slug: 'ra-ola-beach',
  },
  {
    id: 'litebay',
    name: 'LiteBay Resort',
    tagline: 'Your Comfortable Coastal Retreat',
    description: 'Peaceful private cove with shaded cottage huts and relaxing Camotes Sea breezes.',
    coverImage: '/litebay.jpg',
    tourUrl: 'https://tour.panoee.net/6ac4b494035368b0747a8077',
    slug: 'litebay-resort',
  },
  {
    id: 'majestique',
    name: 'Majestique View Resort',
    tagline: 'Indulge in Tranquility & Sea Views',
    description: 'Cliffside vistas overlooking the open Camotes Sea with coral reef shallows.',
    coverImage: '/majestique.webp',
    tourUrl: 'https://tour.panoee.net/6ac4b494035368b0747a8077',
    slug: 'majestique-beach',
  },
  {
    id: 'hinagdan',
    name: 'Hinagdan Beach',
    tagline: 'Natural Rock Steps & Crystal Waters',
    description: 'Iconic limestone staircase descending directly into refreshing natural tidal pools.',
    coverImage: '/hinagdan.jpg',
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
        ctaText="Start Exploring"
        ctaHref="/register"
      />

      {/* Section 1: Your Beach Guide (Modern IDE / Product Showcase UI — Interactive & Functional) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                Your Beach Guide
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Discover verified resorts, monitor live marine tide telemetry, and navigate Binongkalan with real-time coastal intelligence.
              </p>
            </div>
          </ScrollReveal>

          {/* 3 Modern Feature Showcases (IDE / SaaS Style UI Previews) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Feature 1: Interactive GIS Beach Map & Cottage Navigator */}
            <ScrollReveal direction="up" delay={100} duration={600} className="flex flex-col">
              <div className="flex-1 rounded-2xl bg-slate-50/70 dark:bg-[#0c0c0c] border border-slate-200/90 dark:border-neutral-800 overflow-hidden shadow-sm hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all flex flex-col justify-between">
                {/* Mockup Header Bar */}
                <div className="px-4 py-3 bg-white dark:bg-neutral-900/80 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-neutral-500 truncate max-w-[180px]">
                    gis.dagattabai.ph/binongkalan
                  </span>
                  <Map className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Mockup Screen Content */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#1F3F74]/10 dark:bg-sky-500/10 text-[#1F3F74] dark:text-[#F4BF3E]">
                        <Compass className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">
                        GIS Shoreline Radar
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      4 Resorts Active
                    </span>
                  </div>

                  {/* Active Destination Card Preview */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-2 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Rañola Beach Resort</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#1F3F74] dark:text-[#F4BF3E]" />
                          Binongkalan, Catmon • 8.4 km
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-[#F4BF3E] border border-amber-200/50 dark:border-amber-900/50">
                        ₱50 Entrance
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-600 dark:text-slate-300">
                      <div className="p-1.5 rounded-md bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-700/50">
                        <span className="text-slate-400 block text-[9px] uppercase font-mono">Cottages</span>
                        <span className="font-semibold text-slate-800 dark:text-white">₱300 - ₱1,500</span>
                      </div>
                      <div className="p-1.5 rounded-md bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-700/50">
                        <span className="text-slate-400 block text-[9px] uppercase font-mono">Shoreline</span>
                        <span className="font-semibold text-slate-800 dark:text-white">White Pebble / Sand</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Feature Note */}
                <div className="p-4 bg-white/70 dark:bg-neutral-900/50 border-t border-slate-200/70 dark:border-neutral-800/80">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Interactive Coastal Map
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                    Inspect cottage rates, road accessibility, and verified amenity details for all 4 beaches.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 2: Real-Time Marine Telemetry & Tide Forecast */}
            <ScrollReveal direction="up" delay={200} duration={600} className="flex flex-col">
              <div className="flex-1 rounded-2xl bg-slate-50/70 dark:bg-[#0c0c0c] border border-slate-200/90 dark:border-neutral-800 overflow-hidden shadow-sm hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all flex flex-col justify-between">
                {/* Mockup Header Bar */}
                <div className="px-4 py-3 bg-white dark:bg-neutral-900/80 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-neutral-500 truncate max-w-[180px]">
                    telemetry.visayan-sea/tides
                  </span>
                  <CloudSun className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Mockup Screen Content */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#1F3F74]/10 dark:bg-sky-500/10 text-[#1F3F74] dark:text-[#F4BF3E]">
                        <Waves className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">
                        Coastal Marine HUD
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Safe for Swimming
                    </span>
                  </div>

                  {/* Tide HUD Gauge */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Next Peak Tide</span>
                        <div className="text-base font-extrabold text-[#1F3F74] dark:text-[#F4BF3E]">
                          High Tide +1.4m
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 block">Estimated Time</span>
                        <div className="text-xs font-bold text-slate-800 dark:text-white">
                          2:15 PM Today
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-600 dark:text-slate-300">
                      <div className="p-1.5 rounded-md bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-700/50 flex items-center gap-2">
                        <Wind className="w-3.5 h-3.5 text-[#1F3F74] dark:text-sky-400" />
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-mono">Breeze</span>
                          <span className="font-semibold text-slate-800 dark:text-white">12 km/h NE</span>
                        </div>
                      </div>
                      <div className="p-1.5 rounded-md bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-700/50 flex items-center gap-2">
                        <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-mono">Sea Temp</span>
                          <span className="font-semibold text-slate-800 dark:text-white">28°C Warm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Feature Note */}
                <div className="p-4 bg-white/70 dark:bg-neutral-900/50 border-t border-slate-200/70 dark:border-neutral-800/80">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Tide &amp; Weather Telemetry
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                    Real-time water level forecasts and sea conditions so you arrive right when the water is optimal.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 3: Bai AI 24/7 Local Coastal Assistant */}
            <ScrollReveal direction="up" delay={300} duration={600} className="flex flex-col">
              <div className="flex-1 rounded-2xl bg-slate-50/70 dark:bg-[#0c0c0c] border border-slate-200/90 dark:border-neutral-800 overflow-hidden shadow-sm hover:border-[#1F3F74]/30 dark:hover:border-sky-500/30 transition-all flex flex-col justify-between">
                {/* Mockup Header Bar */}
                <div className="px-4 py-3 bg-white dark:bg-neutral-900/80 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-neutral-500 truncate max-w-[180px]">
                    ai.dagattabai.ph/assistant
                  </span>
                  <Bot className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Mockup Chat Screen Content */}
                <div className="p-4 sm:p-5 space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#1F3F74]/10 dark:bg-sky-500/10 text-[#1F3F74] dark:text-[#F4BF3E]">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-900 dark:text-white">
                        Bai Assistant
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online 24/7
                    </span>
                  </div>

                  {/* Chat Bubbles */}
                  <div className="space-y-2.5 pt-1 text-[11px]">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#1F3F74] text-white px-3.5 py-2 shadow-xs leading-relaxed">
                        Asa nindot mag overnight sa Binongkalan nga naay cottage?
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-tl-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-slate-200 px-3.5 py-2 shadow-xs leading-relaxed space-y-1">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-[#1F3F74] dark:text-[#F4BF3E]">
                          <Sparkles className="w-3 h-3" />
                          <span>Bai AI</span>
                        </div>
                        <p>
                          Maayong adlaw! Girekomendar ang <strong className="text-slate-900 dark:text-white">LiteBay Resort</strong> ug <strong className="text-slate-900 dark:text-white">Majestique View</strong>. Naay open cottages sugod ₱500 ug high tide karong 2:15 PM!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Feature Note */}
                <div className="p-4 bg-white/70 dark:bg-neutral-900/50 border-t border-slate-200/70 dark:border-neutral-800/80">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Bai Coastal Assistant
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                    Ask questions anytime in Bisaya or English for verified rates, travel tips, and route recommendations.
                  </p>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* Section 2: How It Works (Clean Pure White & Black — Zero Beige, Zero Pill Badges) */}
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

      {/* Section 3: Take a 360° Look Around (Touch-Swipeable 3D Carousel with Generous Spacing — No Overlapping Cards) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto">
          {/* Centered Header & Subheader */}
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight text-[#1F3F74] dark:text-white leading-tight">
                Take a 360° Look Around
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-sans">
                Inspect Binongkalan&apos;s coastlines before you visit. Swipe through real shoreline panoramas, open cabanas, and beach views.
              </p>
            </div>
          </ScrollReveal>

          {/* Swipeable 3D Perspective Carousel Container */}
          <div
            className="relative w-full max-w-6xl mx-auto flex items-center justify-center [perspective:1400px] min-h-[490px] sm:min-h-[530px] touch-pan-y"
            onTouchStart={(e) => {
              tourTouchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (tourTouchStartX.current === null) return;
              const diff = tourTouchStartX.current - e.changedTouches[0].clientX;
              if (diff > 40) nextTour();
              else if (diff < -40) prevTour();
              tourTouchStartX.current = null;
            }}
          >
            {/* The 3D Cards Stack: Generous Spacing on Desktop (translate ±108%), Clean Centered Card on Mobile */}
            <div className="relative w-full h-[470px] sm:h-[510px] flex items-center justify-center">
              {VIRTUAL_TOURS.map((tour, idx) => {
                let offset = idx - activeTourIndex;
                if (offset > 2) offset -= VIRTUAL_TOURS.length;
                if (offset < -2) offset += VIRTUAL_TOURS.length;

                const isCenter = offset === 0;
                const isLeft = offset === -1 || (offset === 3 - VIRTUAL_TOURS.length);
                const isRight = offset === 1 || (offset === VIRTUAL_TOURS.length - 3);

                // Desktop 3D positions with clear separation (no overlapping cards clipping text)
                let desktopTransform = 'translate3d(0, 0, -200px) scale(0.5)';
                let desktopZIndex = 0;
                let desktopOpacity = 0;

                if (isCenter) {
                  desktopTransform = 'translate3d(0, 0, 0) scale(1) rotateY(0deg)';
                  desktopZIndex = 30;
                  desktopOpacity = 1;
                } else if (isLeft) {
                  desktopTransform = 'translate3d(-108%, 0, -40px) scale(0.92) rotateY(12deg)';
                  desktopZIndex = 15;
                  desktopOpacity = 0.85;
                } else if (isRight) {
                  desktopTransform = 'translate3d(108%, 0, -40px) scale(0.92) rotateY(-12deg)';
                  desktopZIndex = 15;
                  desktopOpacity = 0.85;
                }

                return (
                  <div
                    key={tour.id}
                    onClick={() => {
                      if (isLeft) prevTour();
                      if (isRight) nextTour();
                    }}
                    style={{
                      transform: desktopTransform,
                      zIndex: desktopZIndex,
                    }}
                    className={`absolute w-[88vw] max-w-[340px] md:max-w-[360px] lg:max-w-[380px] transition-all duration-500 ease-out origin-center cursor-pointer ${
                      isCenter
                        ? 'opacity-100 pointer-events-auto cursor-default'
                        : 'hidden md:block hover:opacity-100 pointer-events-auto'
                    }`}
                  >
                    <div className="flex flex-col bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300">
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
                        {/* 3D side card subtle shadow */}
                        {!isCenter && (
                          <div
                            className={`hidden md:block absolute inset-0 bg-gradient-to-${
                              isLeft ? 'r' : 'l'
                            } from-black/30 to-transparent pointer-events-none`}
                          />
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between text-center space-y-4">
                        <div className="space-y-1.5">
                          <h3 className="font-display font-medium text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                            {tour.name}
                          </h3>
                          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-sans italic leading-relaxed">
                            {tour.tagline}
                          </p>
                        </div>

                        {/* Yellow Action Button: Black text, not bold */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTour(tour);
                            }}
                            className="w-full px-6 py-3 rounded-none bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-display uppercase tracking-[0.14em] font-medium text-xs transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 cursor-pointer text-center"
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
              {/* Yellow Button: Black text, not bold */}
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black text-xs sm:text-sm font-display uppercase tracking-[0.14em] font-medium transition-all duration-200 shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0"
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
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black text-xs font-medium transition-colors"
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
