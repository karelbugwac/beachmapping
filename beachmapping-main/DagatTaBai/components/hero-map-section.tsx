'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
} from 'lucide-react';

export function HeroMapSection() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [currentVideo, setCurrentVideo] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videos = ['/beach1.mp4', '/beach5.mp4'];

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  // Alternate between videos
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleVideoEnd = () => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    };

    videoElement.addEventListener('ended', handleVideoEnd);
    return () => {
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  }, []);

  return (
    <section className="relative w-full h-[80vh] sm:h-[85vh] lg:h-[90vh] min-h-[500px] overflow-hidden text-slate-900 dark:text-white transition-colors duration-200">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          key={currentVideo}
          src={videos[currentVideo]}
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
          <h1 className="font-sans font-bold tracking-tight text-white leading-[1.2] text-2xl sm:text-3xl lg:text-4xl drop-shadow-lg">
            Discover the{' '}
            <span className="whitespace-nowrap text-[#38bdf8]">Coastal Paradise</span>{' '}
            <span className="whitespace-nowrap">
              of{' '}
              <span className="text-[#38bdf8]">
                Binongkalan
              </span>
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            Plan your ultimate beach getaway with live wave updates, real-time weather analytics, and customized AI beach intelligence.
          </p>

          <div className="pt-2">
            <Link
              href={user ? '/map' : '/login?redirect=/map'}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  router.push('/login?redirect=/map');
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <MapPin className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Explore Beaches</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
