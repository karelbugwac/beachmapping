'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Map,
  Compass,
  MapPin,
  Calendar,
  CloudSun,
  Bot,
  Star,
  ExternalLink,
  Route,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BeachTripPlanner } from '@/components/beach-trip-planner';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useRealtimeSync } from '@/lib/realtime-sync';
import type { BeachRecord } from '@/lib/db/beaches';

interface SystemTestimonial {
  id: string;
  user_name: string;
  profile_image_url?: string | null;
  user_role?: string;
  rating: number;
  comment: string;
  created_at: string;
}

function getBisayaGreeting(name: string): { greeting: string; periodText: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Maayong buntag, ${name}!`,
      periodText: 'Maayong buntag gikan sa Catmon',
      icon: '☀️',
    };
  } else if (hour >= 12 && hour < 13) {
    return {
      greeting: `Maayong udto, ${name}!`,
      periodText: 'Maayong udto sa kabaybayonan',
      icon: '🌤️',
    };
  } else if (hour >= 13 && hour < 18) {
    return {
      greeting: `Maayong hapon, ${name}!`,
      periodText: 'Maayong hapon gikan sa Catmon',
      icon: '🌅',
    };
  } else {
    return {
      greeting: `Maayong gabii, ${name}!`,
      periodText: 'Maayong gabii sa Dagat Ta Bai',
      icon: '🌙',
    };
  }
}

export default function AuthenticatedHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; full_name?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [testimonials, setTestimonials] = useState<SystemTestimonial[]>([]);
  const [loadVirtualTour, setLoadVirtualTour] = useState(false);
  const plannerRef = useRef<HTMLDivElement | null>(null);

  // Check auth session: if not signed in, redirect to login
  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.user) {
          setUser(data.user);
        } else {
          router.replace('/login?redirect=/home');
        }
        setAuthChecked(true);
      })
      .catch(() => {
        if (!active) return;
        router.replace('/login?redirect=/home');
      });

    return () => {
      active = false;
    };
  }, [router]);

  // Load beaches and testimonials
  const loadContent = async () => {
    try {
      const [bRes, tRes] = await Promise.all([
        fetch('/api/beaches', { cache: 'no-store' }),
        fetch('/api/platform-feedback', { cache: 'no-store' }),
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData)) setBeaches(bData);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        if (Array.isArray(tData)) {
          setTestimonials(tData.filter((i: SystemTestimonial) => i.rating >= 4));
        }
      }
    } catch (err) {
      console.error('Failed to load home content:', err);
    }
  };

  useEffect(() => {
    void loadContent();
  }, []);

  useRealtimeSync(() => {
    void loadContent();
  });

  const displayName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Bai';
  const greetingData = getBisayaGreeting(displayName);

  const scrollToPlanner = () => {
    plannerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!authChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-black text-[#1F3F74] dark:text-[#4987BA]">
        <div className="animate-spin rounded-full h-9 w-9 border-3 border-[#1F3F74] dark:border-[#4987BA] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200">
      
      {/* ── 1. WELCOME HERO WITH BISAYA GREETING ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30] text-white pt-24 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-sky-200 text-xs sm:text-sm font-semibold shadow-sm">
            <span className="text-base">{greetingData.icon}</span>
            <span>{greetingData.periodText}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {greetingData.greeting}
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl leading-relaxed">
              Andam na ba ka mosuhid sa kabaybayonan sa Catmon? Discover verified beach listings, plan trips with 4-day weather forecasts, or calculate real-time coastal driving routes.
            </p>
          </div>

          {/* Quick Actions Row: Compact Luxury Styling */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-[#1F3F74] text-xs font-display uppercase tracking-[0.12em] font-medium shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Map className="w-4 h-4 text-[#1F3F74]" />
              <span>Explore Live Map</span>
            </Link>

            <button
              type="button"
              onClick={scrollToPlanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/40 text-white text-xs font-display uppercase tracking-[0.12em] font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-sky-300" />
              <span>4-Day Trip Planner</span>
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-bai-chat'))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-display uppercase tracking-[0.12em] font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Chat with Bai</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. QUICK HUB SHORTCUTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            href="/map"
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-[#1F3F74]/30 transition group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#1F3F74] dark:text-[#4987BA] flex items-center justify-center transition group-hover:scale-105">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interactive Beach Map</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Explore verified beach resorts, shoreline terrain, and live turn-by-turn routing across Binongkalan.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Map <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <button
            type="button"
            onClick={scrollToPlanner}
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-sky-500/30 transition group flex flex-col justify-between text-left cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center transition group-hover:scale-105">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Beach Trip Planner</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Check marine weather up to 4 days ahead, rain probability, wind, and swim advisories before visiting.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Check Forecast <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-bai-chat'))}
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-amber-500/30 transition group flex flex-col justify-between text-left cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center transition group-hover:scale-105">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bai AI Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Ask about entrance rates, cottage reservations, guidelines, and insider travel tips in Catmon.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Talk with Bai <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <Link
            href="/feedback"
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition group-hover:scale-105">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rate &amp; Review</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Drop your verified feedback and rating to help visitors plan better coastal getaways.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Leave Review <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

        </div>
      </section>

      {/* ── 3. TRIP PLANNER & 4-DAY FORECAST INTEGRATION ── */}
      <section ref={plannerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <ScrollReveal direction="up" duration={600}>
          <div className="mb-6 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800">
              <CloudSun className="w-3.5 h-3.5" />
              <span>Marine Weather Outlook</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
              4-Day Beach Trip Planner
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-2xl">
              Choose your planned visit day below to inspect high/low temperatures, rain chance, wind speed, and coastal swimming advice for Barangay Binongkalan, Catmon.
            </p>
          </div>

          <BeachTripPlanner
            beachName="Barangay Binongkalan, Catmon, Cebu"
            latitude={10.6348}
            longitude={124.0275}
          />
        </ScrollReveal>
      </section>

      {/* ── 4. FEATURED BEACH DESTINATIONS IN BINONGKALAN ── */}
      <section className="bg-white dark:bg-neutral-950 border-y border-slate-200 dark:border-neutral-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-[#4987BA]">
                Coastal Destinations in Binongkalan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400">
                Verified beach listings with actual shoreline photos, cottage rates, and direct route calculation.
              </p>
            </div>
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F3F74] dark:text-[#4987BA] hover:underline"
            >
              <span>View All on Interactive Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {beaches.slice(0, 4).map((beach) => (
              <div
                key={beach.id}
                className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Beach Cover Image */}
                  <div className="relative w-full h-44 bg-slate-800 overflow-hidden">
                    {beach.cover_image ? (
                      <Image
                        src={beach.cover_image}
                        alt={beach.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, 300px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1F3F74] to-[#0c1a30]">
                        <Compass className="w-8 h-8 text-sky-200 opacity-60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {Number(beach.average_rating) > 0 && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1 border border-white/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{Number(beach.average_rating).toFixed(1)}</span>
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-3 right-3">
                      <h3 className="text-sm font-bold text-white drop-shadow-md truncate">
                        {beach.name}
                      </h3>
                      <p className="text-[11px] text-sky-200 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{beach.location || 'Binongkalan, Catmon'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="p-4 space-y-2 text-xs text-slate-600 dark:text-neutral-400">
                    <p className="line-clamp-2 text-[11px] leading-relaxed">
                      {beach.description || 'Verified beach destination along the Binongkalan shoreline.'}
                    </p>
                    {beach.entrance_fee && (
                      <div className="text-[11px] font-bold text-[#1F3F74] dark:text-[#4987BA] pt-1">
                        Entrance: ₱{beach.entrance_fee_adults || beach.entrance_fee}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Row */}
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-neutral-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <Link
                      href={`/map?beach=${encodeURIComponent(beach.slug)}&route=true`}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#1F3F74] hover:bg-[#285091] text-white text-[11px] font-bold transition shadow-xs"
                      title="Calculate driving route in map"
                    >
                      <Route className="w-3 h-3" />
                      <span>Route</span>
                    </Link>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${beach.latitude},${beach.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-[11px] font-bold transition"
                      title="Open directions in Google Maps"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Directions</span>
                    </a>
                  </div>

                  <Link
                    href={`/beaches/${encodeURIComponent(beach.slug)}`}
                    className="block text-center py-1.5 text-xs font-semibold text-[#1F3F74] dark:text-[#4987BA] hover:underline"
                  >
                    View Beach Profile &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. IMMERSIVE 360° TOUR SECTION ── */}
      <section className="bg-[#1F3F74] dark:bg-[#14284b] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8 text-center">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Take a 360° Look Around
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Explore the shoreline from different perspectives and preview resort facilities with our interactive panoramic virtual tour.
            </p>
          </div>

          <div
            onClick={() => setLoadVirtualTour(true)}
            className="relative overflow-hidden shadow-2xl border border-white/20 bg-black w-full h-[360px] sm:h-[460px] lg:h-[500px]"
          >
            {loadVirtualTour ? (
              <iframe
                id="tour-embeded-home"
                title="Panoee 360 Tour"
                src="https://tour.panoee.net/6ac4b494035368b0747a8077"
                width="100%"
                height="100%"
                tabIndex={-1}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; magnetometer; picture-in-picture; web-share; xr-spatial-tracking; unload"
                className="w-full h-full border-0 block"
              />
            ) : (
              <div className="flex flex-col h-full w-full items-center justify-center bg-slate-950 text-white p-6 space-y-3 cursor-pointer group">
                <Compass className="w-10 h-10 text-sky-300 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-bold text-sky-200">
                  Click to Explore 360° Virtual Tour
                </span>
                <span className="text-[11px] text-slate-400">
                  Interactive panoramic view of Barangay Binongkalan coastline
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
