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
  Star,
  Waves,
  Sun,
  Cloud,
  CloudRain,
  Droplets,
  Wind,
  ChevronLeft,
  ChevronRight,
  Heart,
  Search,
  History,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useRealtimeSync } from '@/lib/realtime-sync';
import type { BeachRecord } from '@/lib/db/beaches';

interface SystemTestimonial {
  id: string;
  user_name: string;
  profileimageurl?: string | null;
  user_role?: string;
  rating: number;
  comment: string;
  createdat: string;
}

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    icon: string;
    condition: string;
  }>;
}

interface RecentActivity {
  id: string;
  type: 'beach_view' | 'favorite' | 'search' | 'review';
  title: string;
  timestamp: string;
  beachName?: string;
}

interface ApplicationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'none';
  submittedAt?: string;
  applicationId?: string;
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

function getWeatherIcon(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('sun') || c.includes('clear')) return '☀️';
  if (c.includes('cloud')) return '☁️';
  if (c.includes('rain') || c.includes('shower')) return '🌧️';
  if (c.includes('storm') || c.includes('thunder')) return '⛈️';
  if (c.includes('fog') || c.includes('mist')) return '🌫️';
  return '🌤️';
}

export default function AuthenticatedHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; fullname?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [testimonials, setTestimonials] = useState<SystemTestimonial[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentBeachIndex, setCurrentBeachIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({ status: 'none' });
  const [searchQuery, setSearchQuery] = useState('');

  // Check auth session
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

  // Load beaches, testimonials, weather, and user-specific data
  const loadContent = async () => {
    try {
      const [bRes, tRes, wRes, aRes] = await Promise.all([
        fetch('/api/beaches', { cache: 'no-store' }),
        fetch('/api/platform-feedback', { cache: 'no-store' }),
        fetch('/api/weather', { cache: 'no-store' }),
        fetch('/api/applications/status', { cache: 'no-store' }),
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
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData) setWeather(wData);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData?.application) {
          setApplicationStatus({
            status: aData.application.status || 'none',
            submittedAt: aData.application.createdat,
            applicationId: aData.application.id,
          });
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

  // Auto-rotate beach carousel
  useEffect(() => {
    if (beaches.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBeachIndex((prev) => (prev + 1) % beaches.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [beaches.length]);

  const displayName = user?.fullname?.split(' ')[0] || user?.email?.split('@')[0] || 'Bai';
  const greetingData = getBisayaGreeting(displayName);
  const featuredBeaches = beaches.slice(0, 6);
  const currentBeach = featuredBeaches[currentBeachIndex];

  const toggleFavorite = (beachId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(beachId)) {
        next.delete(beachId);
      } else {
        next.add(beachId);
      }
      return next;
    });
  };

  if (!authChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-black text-[#1F3F74] dark:text-[#4987BA]">
        <div className="animate-spin rounded-full h-9 w-9 border-3 border-[#1F3F74] dark:border-[#4987BA] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-display transition-colors duration-200 pb-20">
      
      {/* ── 1. HERO HEADER WITH BEACH BACKGROUND ── */}
      <section className="relative h-[60vh] sm:h-[70vh] min-h-[400px]">
        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30]">
          {beaches[0]?.cover_image || beaches[0]?.images?.[0]?.photo_url ? (
            <Image
              src={beaches[0]?.cover_image || beaches[0]?.images?.[0]?.photo_url || ''}
              alt="Beach background"
              fill
              className="object-cover opacity-40"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1F3F74] to-[#16305a]" />
          )}
        </div>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">
              {greetingData.greeting}
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-xl w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search beaches, locations, or activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white/90 backdrop-blur-sm border border-white/30 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F4BF3E] transition-all"
              />
            </div>
            
            {/* Explore Button - Landing Page Style */}
            <Link
              href="/beaches"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-display uppercase tracking-[0.12em] font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-amber-300/50"
            >
              <span>Explore Beaches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. 4-DAY COASTAL FORECAST ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-[#1F3F74] dark:text-white mb-6">
          4-Day Coastal Forecast
        </h2>
        
        {weather && weather.forecast ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {weather.forecast.slice(0, 4).map((day, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                <p className="font-display text-sm font-bold text-slate-900 dark:text-white mb-2">{day.day}</p>
                <p className="text-3xl mb-2">{getWeatherIcon(day.condition)}</p>
                <p className="font-display text-lg font-bold text-[#1F3F74] dark:text-[#4987BA]">{day.high}°</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{day.low}°</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{day.condition}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 text-center">
            <CloudSun className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading forecast...</p>
          </div>
        )}
      </section>

      {/* ── 3. COASTAL REMINDER ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="font-display text-lg font-bold text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Coastal Reminder
          </h3>
          <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Reef-safe sunscreen (SPF 30+)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Stay hydrated - bring water</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Check tide schedules before swimming</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>Respect marine life - no touching coral</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 4. WHAT'S IN CATMON ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display text-lg sm:text-xl font-semibold text-[#1F3F74] dark:text-white mb-8">
          What's in Catmon
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30] rounded-2xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow">
            <div className="relative h-48">
              {beaches[0]?.cover_image || beaches[0]?.images?.[0]?.photo_url ? (
                <Image
                  src={beaches[0]?.cover_image || beaches[0]?.images?.[0]?.photo_url || ''}
                  alt="White Sand"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1F3F74] to-[#16305a]" />
              )}
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-white mb-2">White Sand & Calm Coves</h3>
              <p className="text-sm text-blue-100/90 mb-4">
                Experience pristine white sand beaches with gentle, protected coves perfect for swimming and relaxation.
              </p>
              <Link
                href="/beaches"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#F4BF3E] hover:underline"
              >
                Explore <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30] rounded-2xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow">
            <div className="relative h-48">
              {beaches[1]?.cover_image || beaches[1]?.images?.[0]?.photo_url ? (
                <Image
                  src={beaches[1]?.cover_image || beaches[1]?.images?.[0]?.photo_url || ''}
                  alt="Reef Waters"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1F3F74] to-[#16305a]" />
              )}
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-white mb-2">Reef & Dive Waters</h3>
              <p className="text-sm text-blue-100/90 mb-4">
                Discover vibrant coral reefs and crystal-clear waters ideal for snorkeling and diving adventures.
              </p>
              <Link
                href="/beaches"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#F4BF3E] hover:underline"
              >
                Explore <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30] rounded-2xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow">
            <div className="relative h-48">
              {beaches[2]?.cover_image || beaches[2]?.images?.[0]?.photo_url ? (
                <Image
                  src={beaches[2]?.cover_image || beaches[2]?.images?.[0]?.photo_url || ''}
                  alt="Sunset Shorelines"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1F3F74] to-[#16305a]" />
              )}
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-white mb-2">Sunset Shorelines</h3>
              <p className="text-sm text-blue-100/90 mb-4">
                Enjoy breathtaking sunset views along the picturesque coastlines of Catmon, Cebu.
              </p>
              <Link
                href="/beaches"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#F4BF3E] hover:underline"
              >
                Explore <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. IMONG BEACH APPLICATION (YOUR BEACH APPLICATION) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30] rounded-2xl p-8 text-white text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-[#F4BF3E]" />
          <h2 className="font-display text-lg sm:text-xl font-semibold mb-3">
            Imong beach application
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 mb-6 max-w-md mx-auto">
            Own a beach or resort in Binongkalan? Apply now to get featured on Dagat Ta Bai.
          </p>
          {applicationStatus.status === 'none' ? (
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-display uppercase tracking-[0.12em] font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-amber-300/50"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              {applicationStatus.status === 'pending' && <Clock className="w-5 h-5 text-amber-400" />}
              {applicationStatus.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-400" />}
              {applicationStatus.status === 'rejected' && <XCircle className="w-5 h-5 text-red-400" />}
              <span className="font-display text-sm font-semibold capitalize">
                {applicationStatus.status}
              </span>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
