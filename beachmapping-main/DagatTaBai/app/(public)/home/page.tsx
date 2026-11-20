'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Map,
  MapPin,
  CloudSun,
  ExternalLink,
  Route,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Clock,
  Sparkles,
} from 'lucide-react';
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

  if (!authChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-black text-[#1F3F74] dark:text-[#4987BA]">
        <div className="animate-spin rounded-full h-9 w-9 border-3 border-[#1F3F74] dark:border-[#4987BA] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200">
      
      {/* ── 1. WELCOME HERO WITH BISAYA GREETING ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30] text-white pt-24 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 space-y-6">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-white text-[#1F3F74] text-xs font-display uppercase tracking-[0.12em] font-medium shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Map className="w-4 h-4 text-[#1F3F74]" />
              <span>Explore Live Map</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
