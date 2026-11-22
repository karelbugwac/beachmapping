'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  CloudSun,
  Sun,
  Cloud,
  CloudRain,
  Droplets,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useRealtimeSync } from '@/lib/realtime-sync';
import type { BeachRecord } from '@/lib/db/beaches';

interface WeatherData {
  temperature: number;
  conditionLabel: string;
  weatherCode: number;
  relativeHumidity: number;
  windSpeed: number;
  dailyForecast: Array<{
    date: string;
    weatherCode: number;
    conditionLabel: string;
    high: number;
    low: number;
    precipitationProbability: number | null;
  }>;
}

interface ApplicationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'none';
  submittedAt?: string;
  applicationId?: string;
}

function getBisayaGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Maayong buntag, ${name}!`;
  if (hour >= 12 && hour < 13) return `Maayong udto, ${name}!`;
  if (hour >= 13 && hour < 18) return `Maayong hapon, ${name}!`;
  return `Maayong gabii, ${name}!`;
}

function getWeatherIcon(code: number): React.ReactNode {
  // Open-Meteo weather codes
  if (code === 0) return <Sun className="w-8 h-8" />; // Clear sky
  if (code >= 1 && code <= 3) return <CloudSun className="w-8 h-8" />; // Mainly clear, partly cloudy, overcast
  if (code >= 45 && code <= 48) return <Cloud className="w-8 h-8" />; // Fog
  if (code >= 51 && code <= 67) return <CloudRain className="w-8 h-8" />; // Drizzle and rain
  if (code >= 71 && code <= 77) return <CloudRain className="w-8 h-8" />; // Snow
  if (code >= 80 && code <= 82) return <CloudRain className="w-8 h-8" />; // Rain showers
  if (code >= 85 && code <= 86) return <CloudRain className="w-8 h-8" />; // Snow showers
  if (code >= 95) return <CloudRain className="w-8 h-8" />; // Thunderstorm
  return <CloudSun className="w-8 h-8" />;
}

export default function AuthenticatedHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; fullname?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({ status: 'none' });

  // Check auth session
  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        console.log('Auth session response:', { status: res.status, ok: res.ok, data });
        if (!active) return;
        if (data?.user) {
          setUser(data.user);
        } else {
          console.log('No user in session, redirecting to login');
          router.replace('/login?redirect=/home');
        }
        setAuthChecked(true);
      })
      .catch((err) => {
        console.error('Auth session fetch error:', err);
        if (!active) return;
        router.replace('/login?redirect=/home');
      });

    return () => {
      active = false;
    };
  }, [router]);

  // Load beaches, weather, and application status
  const loadContent = async () => {
    try {
      const [bRes, wRes, aRes] = await Promise.all([
        fetch('/api/beaches', { cache: 'no-store' }),
        fetch('/api/weather', { cache: 'no-store' }),
        fetch('/api/applications/status', { cache: 'no-store' }),
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData)) setBeaches(bData);
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

  const displayName = user?.fullname?.split(' ')[0] || user?.email?.split('@')[0] || 'Bai';
  const greeting = getBisayaGreeting(displayName);
  const heroImage = beaches[0]?.cover_image || beaches[0]?.images?.[0]?.photo_url || '/ranola.jpg';
  
  // Sort beaches by rating (highest first) and get top-rated ones
  const topRatedBeaches = [...beaches]
    .sort((a, b) => b.averagerating - a.averagerating)
    .filter(b => b.averagerating >= 4.5)
    .slice(0, 3);

  console.log('Home page state:', { user, beachesCount: beaches.length, topRatedBeachesCount: topRatedBeaches.length, heroImage });

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-[#1F3F74] dark:text-[#4987BA]">
        <div className="animate-spin rounded-full h-9 w-9 border-3 border-[#1F3F74] dark:border-[#4987BA] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-display pb-24">
      
      {/* ── 1. HERO HEADER CARD ── */}
      <div className="relative w-full h-[400px] sm:h-[450px] bg-gradient-to-br from-[#1F3F74] to-[#16305a] overflow-hidden shadow-lg">
        {/* Background Image */}
        {heroImage && (
          <Image
            src={heroImage}
            alt="Beach background"
            fill
            className="object-cover opacity-40"
            priority
            loading="eager"
            onError={() => console.log('Hero image failed to load:', heroImage)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F3F74]/90 via-[#1F3F74]/50 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8">
          {/* Location Tag */}
          <div className="inline-flex items-center gap-2 w-fit bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Catmon, Cebu</span>
          </div>
          
          {/* Greeting */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
            {greeting}
          </h1>
          
          {/* Subtext */}
          <p className="text-sm sm:text-base text-white/90 mb-6 max-w-md">
            Ready to discover the best beaches in Binongkalan, Catmon, Cebu?
          </p>
          
          {/* Explore Button */}
          <Link
            href="/beaches"
            className="inline-flex items-center justify-center gap-2 w-fit px-6 py-3 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-semibold text-sm shadow-md transition-all"
          >
            <span>Explore Beaches</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── 2. TOP-RATED BEACHES ── */}
      {topRatedBeaches.length > 0 && (
        <div className="px-4 sm:px-6 mt-8">
          <h2 className="text-lg font-semibold text-[#1F3F74] dark:text-white mb-4">
            Top-Rated Beaches
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {topRatedBeaches.map((beach) => (
              <Link
                key={beach.id}
                href={`/beaches/${beach.slug}`}
                className="flex-shrink-0 w-64 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow"
              >
                <div className="relative h-32">
                  {beach.cover_image || beach.images?.[0]?.photo_url ? (
                    <Image
                      src={beach.cover_image || beach.images[0].photo_url}
                      alt={beach.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1F3F74] to-[#16305a]" />
                  )}
                  <div className="absolute top-2 right-2 bg-[#F4BF3E] text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <span>★</span>
                    <span>{beach.averagerating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-display text-sm font-semibold text-[#1F3F74] dark:text-white mb-1 truncate">
                    {beach.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {beach.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. CURRENT WEATHER ── */}
      <div className="px-4 sm:px-6 mt-8">
        {weather && (
          <div className="bg-gradient-to-br from-[#1F3F74] to-[#16305a] rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80 mb-1">Today - Catmon, Cebu</p>
                <p className="text-lg font-semibold mb-2">
                  {weather.conditionLabel} - Calm Seas
                </p>
                <p className="text-4xl font-bold">{weather.temperature}°C</p>
              </div>
              <div className="text-5xl">
                {getWeatherIcon(weather.weatherCode)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. COASTAL REMINDERS ── */}
      <div className="px-4 sm:px-6 mt-8">
        <h2 className="text-lg font-semibold text-[#1F3F74] dark:text-white mb-4">
          Coastal Reminders
        </h2>
        
        <div className="space-y-3">
          {/* Reminder 1 */}
          <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CloudSun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Check weather & tide updates before swimming.
            </p>
          </div>
          
          {/* Reminder 2 */}
          <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Bring drinking water & reef-safe sunscreen.
            </p>
          </div>
          
          {/* Reminder 3 */}
          <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Follow local beach safety guidelines.
            </p>
          </div>
          
          {/* Reminder 4 */}
          <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Keep the Catmon coastline clean.
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. CALL TO ACTION - APPLY NOW ── */}
      <div className="px-4 sm:px-6 mt-8 mb-6">
        <div className="bg-gradient-to-br from-[#1F3F74] via-[#16305a] to-[#0c1a30] rounded-2xl p-6 text-white shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F4BF3E]/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#F4BF3E]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Own a Beach or Resort?
              </h3>
              <p className="text-sm text-white/90 mb-4">
                Showcase your destination and let more travelers discover it.
              </p>
              {applicationStatus.status === 'none' ? (
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F4BF3E] hover:bg-[#e2af35] text-black font-semibold text-sm shadow-md transition-all"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  {applicationStatus.status === 'pending' && <Clock className="w-4 h-4 text-amber-400" />}
                  {applicationStatus.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {applicationStatus.status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                  <span className="text-sm font-semibold capitalize">
                    {applicationStatus.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
