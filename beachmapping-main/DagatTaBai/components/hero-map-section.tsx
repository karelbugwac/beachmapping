'use client';

import React from 'react';
import Link from 'next/link';
import {
  Map,
} from 'lucide-react';

export function HeroMapSection() {
  return (
    <section className="relative w-full h-[80vh] sm:h-[85vh] lg:h-[90vh] min-h-[500px] overflow-hidden text-slate-900 dark:text-white transition-colors duration-200">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          src="/beach1.mp4"
          preload="metadata"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center center' }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
          <h1 className="font-sans font-extrabold tracking-tight text-white leading-[1.2] text-2xl sm:text-3xl lg:text-4xl drop-shadow-lg">
            Discover the Coastal Paradise of Binongkalan
          </h1>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            There&apos;s more to every destination than meets the eye.
          </p>

          <div className="pt-6 sm:pt-8">
            <Link
              href="/map"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#1F3F74] hover:bg-[#285091] dark:bg-[#1F3F74] dark:hover:bg-[#285091] text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-xl shadow-blue-950/30 hover:shadow-blue-900/50 hover:-translate-y-0.5 active:translate-y-0 group border border-white/20 cursor-pointer"
            >
              <Map className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Explore Beaches</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
