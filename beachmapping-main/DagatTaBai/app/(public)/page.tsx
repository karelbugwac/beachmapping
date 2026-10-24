'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Check,
  Eye,
  Building2,
  ArrowRight,
  TrafficCone,
  Wrench,
} from 'lucide-react';
import { BeachCard } from '@/components/beach-card';
import type { BeachRecord } from '@/lib/db/beaches';

interface SystemTestimonial {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const HeroMapSection = dynamic(
  () => import('@/components/hero-map-section').then((mod) => mod.HeroMapSection),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[500px] bg-gradient-to-b from-[#e8f4fc] via-[#f1f8fc] to-[#ffffff] dark:from-[#09090b] dark:to-[#09090b] animate-pulse" />
    ),
  }
);

export default function HomePage() {
  const [systemTestimonials, setSystemTestimonials] = useState<SystemTestimonial[]>([]);
  const [featuredBeaches, setFeaturedBeaches] = useState<BeachRecord[]>([]);
  const [beachesLoading, setBeachesLoading] = useState(true);
  const profileSectionRef = useRef<HTMLElement>(null);
  const panoramaSectionRef = useRef<HTMLElement>(null);
  const pulseSectionRef = useRef<HTMLElement>(null);
  const registrySectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch('/api/beaches', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load beach profiles.');
        const data = await response.json();
        setFeaturedBeaches(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch((error) => console.error('Failed to load featured beaches:', error))
      .finally(() => setBeachesLoading(false));
  }, []);

  useEffect(() => {
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

    fetchSystemTestimonials();
  }, []);

  useEffect(() => {
    const panoIframeName = 'tour-embeded';
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
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
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf8] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-200 selection:bg-sky-100 selection:text-sky-900 overflow-x-hidden">
      <HeroMapSection />

      <section
        ref={profileSectionRef}
        className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-20"
      >
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
            Beach Profiles
          </h2>
        </div>

        {featuredBeaches.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBeaches.map((beach) => <BeachCard key={beach.id} beach={beach} />)}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-600 dark:text-slate-300">
            {beachesLoading ? 'Loading verified beach listings…' : 'No active verified beach listings yet.'}
          </p>
        )}
      </section>

      <section
        ref={panoramaSectionRef}
        className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-[#f4f2ee] dark:bg-zinc-900 border-y border-slate-200/80 dark:border-zinc-800 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#0f172a] dark:text-white leading-tight">
                Step Onto the Shoreline in True 360° Panorama
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Explore our 360 virtual tours powered by Panoee to check actual facilities and know what to expect before visiting.
              </p>

              <div className="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span>Check beach facilities, cottages, and actual shoreline</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span>Updated every 6 months or as soon as beach owners contact us</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span>Interactive view with mobile gyroscope support</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 w-full">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-300/80 dark:border-neutral-800 bg-black w-full h-[320px] sm:h-[400px] lg:h-[440px]">
                <iframe
                  id="tour-embeded"
                  name="Raniola"
                  src="https://tour.panoee.net/iframe/69c122dd0b3ba72d3e32cbc1"
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
            </div>
          </div>
        </div>
      </section>

      <section
        ref={pulseSectionRef}
        className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative"
      >
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-[#0f172a] dark:text-white">
            Platform Testimonials
          </h2>
        </div>

        {systemTestimonials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemTestimonials.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.user_name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      {item.rating}.0 ★
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 sm:py-16 text-center max-w-xl mx-auto space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <TrafficCone className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 dark:text-amber-400 stroke-[1.8]" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white dark:bg-[#121215] border border-amber-300 dark:border-amber-600 flex items-center justify-center text-amber-500 shadow-xs">
                <Wrench className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.2]" />
              </div>
            </div>

            <div className="text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm tracking-wide uppercase">
              Under Maintenance
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
              Platform testimonials from Dagat Ta Bai users will appear here once our system feedback verification is activated. We only publish authentic user experiences regarding platform usability and features.
            </p>
          </div>
        )}
      </section>

      <section
        ref={registrySectionRef}
        className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#f4f2ee] dark:bg-zinc-900 border-y border-slate-200/80 dark:border-zinc-800 relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
              Beach Owners
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed">
              Register your beach and get listed on Dagat Ta Bai.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm hover:shadow"
            >
              <Building2 className="w-4 h-4" />
              <span>Apply to list your beach</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/owner-requirements" className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-xs font-semibold text-slate-800 hover:bg-white dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900">
              Requirements
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-slate-950 dark:text-white">
            Share Your Platform Experience
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Help us improve Dagat Ta Bai. We value your feedback on website usability, navigation, and suggestions to enhance the beach discovery experience in Catmon.
          </p>

          <div className="pt-6 sm:pt-8 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">Submit a rating and comments about using the platform. Sign in is required; the administrator can review published feedback.</p>
            <Link href="/feedback" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              Review Dagat Ta Bai <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
