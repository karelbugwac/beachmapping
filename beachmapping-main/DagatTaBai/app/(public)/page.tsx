'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Star,
  Map,
  CloudSun,
  Bot,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useRealtimeSync } from '@/lib/realtime-sync';

interface SystemTestimonial {
  id: string;
  user_name: string;
  profile_image_url?: string | null;
  user_role?: string;
  rating: number;
  comment: string;
  created_at: string;
}

const HeroMapSection = dynamic(
  () => import('@/components/hero-map-section').then((mod) => mod.HeroMapSection),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[500px] bg-slate-100 dark:bg-neutral-950 animate-pulse" />
    ),
  }
);

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
  const [systemTestimonials, setSystemTestimonials] = useState<SystemTestimonial[]>([]);

  const fetchSystemTestimonials = async () => {
    try {
      const res = await fetch('/api/platform-feedback', { cache: 'no-store' });
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

  useRealtimeSync(() => {
    void fetchSystemTestimonials();
  });

  useEffect(() => {
    const panoIframeName = 'tour-embeded';
    let rafId: number | null = null;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
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
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Hero Section */}
      <HeroMapSection />

      {/* Section 1: See Beyond the Pictures (DARK DIVE BLUE Background #1F3F74 - Harmonious Balanced Spacing) */}
      <section className="w-full bg-[#1F3F74] dark:bg-[#14284b] text-white transition-colors duration-200 relative z-20">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up" duration={650} className="space-y-5 sm:space-y-6 flex flex-col items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
                See Beyond the Pictures
              </h2>
            </div>

            {/* Description: Centered container yet justified text with centered last line */}
            <div
              className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-3xl mx-auto"
              style={{ textAlign: 'justify', textAlignLast: 'center' }}
            >
              <p>
                Planning a beach trip should be exciting, not confusing. Our goal is to give visitors a better understanding of the coastal destinations in Barangay Binongkalan, Catmon, Cebu, so they can make informed decisions before visiting. From the actual beach surroundings to available facilities and other important details, we want people to know what to expect beyond what they see on social media. Because every beach visit deserves a little less uncertainty and a lot more confidence.
              </p>
            </div>

            <div className="pt-5 sm:pt-6">
              {/* White button on blue background */}
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-[#1F3F74] font-bold text-xs sm:text-sm shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Learn More
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 2: Your Beach Guide (WHITE Background - Harmonious Spacing, Dive Header) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 relative">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight">
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
                <Map className="w-9 h-9 text-[#1F3F74] dark:text-[#4987BA] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                Interactive Map
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Explore verified beach resorts, inspect cottage amenities, check terrain conditions, and view authentic coastal routes across Binongkalan.
              </p>
            </ScrollReveal>

            {/* Column 2: Live Weather & Tides (CloudSun Icon - Sun & Clouds) */}
            <ScrollReveal direction="up" delay={200} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <CloudSun className="w-9 h-9 text-[#1F3F74] dark:text-[#4987BA] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-white font-heading">
                Live Weather &amp; Tides
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Stay updated with real-time wave telemetry, tide levels, wind advisories, and marine weather forecasts for safe and well-planned beach trips.
              </p>
            </ScrollReveal>

            {/* Column 3: Bai Coastal Chatbot (Bot Icon) */}
            <ScrollReveal direction="up" delay={300} duration={600} className="px-6 sm:px-8 py-5 md:py-2 flex flex-col items-center space-y-3 group">
              <div className="h-10 flex items-center justify-center">
                <Bot className="w-9 h-9 text-[#1F3F74] dark:text-[#4987BA] stroke-[1.8] transition-transform duration-300 group-hover:scale-110" />
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

      {/* Section 3: Take a 360° Look Around (DARK DIVE BLUE Background #1F3F74 - Harmonious Spacing, Centered Header & Tour) */}
      <section className="w-full bg-[#1F3F74] dark:bg-[#14284b] text-white border-b border-white/10 transition-colors duration-200 relative overflow-hidden">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Centered Header & Subheader */}
          <ScrollReveal direction="up" duration={650}>
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
                Take a 360° Look Around
              </h2>

              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl mx-auto">
                Explore the beach from different angles and see what each destination has to offer. Take a closer look at the surroundings, discover available facilities, and get a better feel for the place through an immersive 360° virtual experience powered by Panoee.
              </p>
            </div>
          </ScrollReveal>

          {/* Virtual Tour Container: Centered Below, 90-degree straight corners */}
          <ScrollReveal direction="up" delay={150} duration={650} className="w-full max-w-5xl mx-auto">
            <div className="relative overflow-hidden shadow-2xl border border-white/20 bg-black w-full h-[360px] sm:h-[460px] lg:h-[520px]">
              <iframe
                id="tour-embeded"
                name="Raniola"
                src="https://tour.panoee.net/6ac4b494035368b0747a8077"
                frameBorder="0"
                width="100%"
                height="100%"
                scrolling="no"
                allow="vr; xr; accelerometer; gyroscope; autoplay;"
                allowFullScreen={false}
                loading="lazy"
                className="w-full h-full border-0 block"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 4: What People Are Saying (WHITE Background - Harmonious Spacing, Dive Header) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 relative">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={600}>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight">
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
                    <div className="h-full min-h-[220px] min-w-0 p-6 sm:p-7 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between gap-5 hover:border-[#1F3F74]/30 hover:shadow-md transition-all duration-200">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#edf3fa] text-sm font-bold text-[#1F3F74] dark:bg-blue-950/60 dark:text-[#9fc8ee]">
                              <span>{item.user_name?.trim().charAt(0).toUpperCase() || 'U'}</span>
                              {item.profile_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.profile_image_url}
                                  alt={`${maskUserName(item.user_name)} profile`}
                                  className="absolute inset-0 h-full w-full object-cover"
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
                          <div className="flex items-center gap-0.5 text-amber-400 flex-shrink-0" title={`${item.rating}.0 out of 5 stars`}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < Math.round(item.rating)
                                    ? 'fill-amber-400 text-amber-400'
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
                <Link href="/feedback" className="mt-4 inline-flex text-sm font-semibold text-[#1F3F74] hover:underline dark:text-sky-300">
                  Leave feedback
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Section 5: Be Part of Dagat Ta Bai (DARK DIVE BLUE Background #1F3F74 - Harmonious Spacing, Single Clean Button) */}
      <section className="w-full bg-[#1F3F74] dark:bg-[#14284b] text-white border-b border-white/10 transition-colors duration-200 relative overflow-hidden">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10 text-center space-y-5">
          <ScrollReveal direction="up" duration={650}>
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-white leading-tight">
                Be Part of Dagat Ta Bai
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-lg mx-auto leading-relaxed">
                Are you a beach or resort owner? Join our platform and let more people discover your place
              </p>
            </div>

            <div className="flex justify-center pt-6 sm:pt-7">
              {/* Single White button with no icon */}
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-[#1F3F74] text-xs sm:text-sm font-bold transition-all duration-200 shadow-lg shadow-black/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Apply as a beach owner
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 6: Help Make Dagat Ta Bai Better (WHITE Background - Harmonious Spacing, Dive Header) */}
      <section className="w-full bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-900 transition-colors duration-200 relative">
        <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <ScrollReveal direction="up" duration={650}>
            <div className="max-w-2xl mx-auto text-center space-y-5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#1F3F74] dark:text-[#4987BA] leading-tight">
                Help Make Dagat Ta Bai Better
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
                Your feedback helps us create a more reliable experience for everyone.
              </p>

              <div className="pt-5 sm:pt-6">
                {/* Blue button on white background */}
                <Link
                  href="/feedback"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] text-white text-xs sm:text-sm font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Review Dagat Ta Bai</span>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
