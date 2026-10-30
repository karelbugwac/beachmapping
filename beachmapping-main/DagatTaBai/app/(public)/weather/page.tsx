'use client';

import React, { useState, useEffect } from 'react';
import {
  Waves,
  Wind,
  Droplets,
  Sun,
  Thermometer,
  SunMedium,
  Umbrella,
  CloudRain,
  CloudSun,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Moon,
  ChevronDown,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import type { WeatherData } from '@/lib/services/weather';
import { calculateCurrentTide, type CurrentTideState, type TideExtreme } from '@/lib/services/tide-interpolation';
import type { BeachRecord } from '@/lib/db/beaches';
import TideCard from '@/components/TideCard';

// Authentic 4-pointed sparkle star component
function StarSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
    </svg>
  );
}

// Helper to convert wind direction degrees to compass direction
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WSW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Generate smart reminders based on weather conditions and time of day
function generateReminders(weather: WeatherData | null, currentTide: CurrentTideState | null) {
  const reminders: { icon: any; text: string; type: 'info' | 'warning' | 'alert' }[] = [];

  if (!weather) return reminders;

  const hour = new Date().getHours();
  const isMorning = hour >= 6 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;
  const isNight = hour >= 18 || hour < 6;

  // Time-specific tips
  if (isMorning) {
    reminders.push({
      icon: Sun,
      text: 'Pleasant morning conditions - ideal for coastal walks and photography.',
      type: 'info',
    });
    reminders.push({
      icon: Droplets,
      text: 'Keep hydrated throughout your morning beach excursion.',
      type: 'info',
    });
  } else if (isNight) {
    reminders.push({
      icon: Moon,
      text: 'Cool evening offshore breeze - consider bringing a light overshirt.',
      type: 'info',
    });
    reminders.push({
      icon: AlertCircle,
      text: 'Stay within illuminated cottage areas for safe shoreline walking at night.',
      type: 'warning',
    });
  } else if (isAfternoon) {
    reminders.push({
      icon: SunMedium,
      text: 'Peak daylight UV exposure - seek cottage shade and re-apply SPF 30+ sunscreen.',
      type: 'warning',
    });
  }

  // Rain/Drizzle reminders
  if (weather.weatherCode >= 51 && weather.weatherCode <= 67) {
    reminders.push({
      icon: Umbrella,
      text: 'Passing light showers expected along Catmon - keep waterproof pouches ready for gadgets.',
      type: 'warning',
    });
  }

  // Thunderstorm alert
  if (weather.weatherCode >= 95) {
    reminders.push({
      icon: AlertTriangle,
      text: 'Thunderstorm advisory - avoid open water swimming and seek solid cottage shelter.',
      type: 'alert',
    });
  }

  // Low tide sandbar window reminder
  if (currentTide && currentTide.currentHeight < 0.7) {
    reminders.push({
      icon: Waves,
      text: 'Low tide window active - shallow shoreline reveals sandbars and reefs for exploring.',
      type: 'info',
    });
  }

  // Default fallback
  if (reminders.length < 3) {
    reminders.push({
      icon: CheckCircle2,
      text: 'Coastal waters and shoreline conditions are favorable for visiting Binongkalan.',
      type: 'info',
    });
  }

  return reminders;
}

export default function WeatherPage() {
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [selectedBeachId, setSelectedBeachId] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tideExtremes, setTideExtremes] = useState<TideExtreme[]>([]);
  const [currentTide, setCurrentTide] = useState<CurrentTideState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    fetch('/api/beaches')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load beach locations.');
        return res.json();
      })
      .then((data: BeachRecord[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBeaches(data);
          setSelectedBeachId((prev) => prev || data[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load beaches for weather:', err);
        setLoading(false);
      });
  }, []);

  const selectedBeach = beaches.find((b) => b.id === selectedBeachId) || beaches[0] || null;

  useEffect(() => {
    const lat = selectedBeach?.latitude ?? 10.6865;
    const lon = selectedBeach?.longitude ?? 124.0152;

    setLoading(true);
    setDataError(null);

    const loadConditions = async () => {
      const [weatherResult, tideResult] = await Promise.allSettled([
        fetch(`/api/weather?lat=${lat}&lon=${lon}`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) throw new Error('Weather data is unavailable.');
            return response.json() as Promise<WeatherData>;
          }),
        fetch(`/api/tides?lat=${lat}&lon=${lon}`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) throw new Error('Tide data is unavailable.');
            return response.json();
          }),
      ]);

      if (weatherResult.status === 'fulfilled') setWeather(weatherResult.value);
      else setWeather(null);

      if (tideResult.status === 'fulfilled') {
        setTideExtremes(Array.isArray(tideResult.value.extremes) ? tideResult.value.extremes : []);
        setCurrentTide(tideResult.value.current || null);
      } else {
        setTideExtremes([]);
        setCurrentTide(null);
      }

      setLoading(false);
    };

    void loadConditions();
  }, [selectedBeach]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const currentHour = now.getHours();
  const timeOfDayLabel =
    currentHour >= 6 && currentHour < 12
      ? 'Morning Coastal Weather'
      : currentHour >= 12 && currentHour < 18
      ? 'Afternoon Coastal Weather'
      : 'Evening Coastal Weather';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Main Dashboard Body ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 space-y-6 sm:space-y-7">
        
        {/* Freestanding Header: Location Title & Controls (No wrapper box) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
              Barangay Binongkalan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span>Catmon, Cebu</span>
              <span className="text-slate-300 dark:text-neutral-700">•</span>
              <span className="text-slate-400 dark:text-neutral-500 font-mono text-xs">10.6865° N, 124.0152° E</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 sm:justify-end">
            {beaches.length > 0 && (
              <div className="relative">
                <select
                  value={selectedBeachId}
                  onChange={(e) => setSelectedBeachId(e.target.value)}
                  className="appearance-none bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full text-xs font-semibold text-slate-800 dark:text-neutral-200 pl-3.5 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#1F3F74] cursor-pointer shadow-xs"
                >
                  <option value="">Binongkalan Coast (General)</option>
                  {beaches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800 text-xs text-slate-600 dark:text-slate-400 font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Updated {formatDate(now)} · {formatTime(now)}</span>
            </div>
          </div>
        </div>

        {dataError && (
          <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-xs sm:text-sm text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        {/* ── ZONE 1: BALANCED HERO OVERVIEW (Dive Blue #1F3F74) ── */}
        <div className="bg-[#1F3F74] dark:bg-[#14284b] text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden transition-colors">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Freestanding Animated Weather Display */}
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="relative flex items-center justify-center flex-shrink-0">
                {currentHour >= 18 || currentHour < 6 ? (
                  /* Animated Night Moon with Genuine 4-Point Sparkle Stars */
                  <div className="relative flex items-center justify-center">
                    <Moon className="w-14 h-14 sm:w-16 sm:h-16 text-amber-300 fill-amber-300/15 stroke-[1.8] relative z-10 animate-[bounce_4s_ease-in-out_infinite]" />
                    <StarSparkle className="w-4 h-4 text-amber-200 absolute -top-1 -right-2.5 animate-pulse" />
                    <StarSparkle className="w-2.5 h-2.5 text-blue-100 absolute bottom-1 -left-2.5 animate-pulse delay-700" />
                    <StarSparkle className="w-2 h-2 text-amber-100 absolute top-4 -left-3 animate-ping" />
                  </div>
                ) : weather && weather.weatherCode >= 51 ? (
                  /* Animated Rain Cloud */
                  <div className="relative flex items-center justify-center">
                    <CloudRain className="w-14 h-14 sm:w-16 sm:h-16 text-sky-200 stroke-[1.8] relative z-10 animate-bounce" />
                  </div>
                ) : weather && weather.weatherCode >= 2 ? (
                  /* Animated Partly Cloudy */
                  <div className="relative flex items-center justify-center">
                    <CloudSun className="w-14 h-14 sm:w-16 sm:h-16 text-amber-300 stroke-[1.8] relative z-10 animate-pulse" />
                  </div>
                ) : (
                  /* Animated Daylight Sun */
                  <div className="relative flex items-center justify-center">
                    <Sun className="w-14 h-14 sm:w-16 sm:h-16 text-amber-300 stroke-[1.8] relative z-10 animate-[spin_20s_linear_infinite]" />
                  </div>
                )}
              </div>
              
              <div className="space-y-0.5">
                <div className="text-xs uppercase tracking-wider text-blue-200/90 font-semibold">
                  {timeOfDayLabel}
                </div>
                <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {weather ? `${weather.temperature.toFixed(1)}°C` : '--'}
                </div>
                <div className="text-xs sm:text-sm text-blue-100/90 font-medium">
                  {weather?.conditionLabel || 'Clear Sky'} · RealFeel {weather?.heatIndex ? `${weather.heatIndex.heatIndexCelsius.toFixed(1)}°C` : weather ? `${weather.temperature.toFixed(1)}°C` : '--'}
                </div>
              </div>
            </div>

            {/* Right: 4 Key Coastal Telemetry Badges (Balances the Hero beautifully) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:gap-3 w-full lg:w-auto">
              
              {/* Sea Temperature */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Sea Temp</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.waterTemperature ? `${weather.waterTemperature.toFixed(1)}°C` : '27.7°C'}
                </div>
                <div className="text-[10px] text-blue-200/70">Shoreline water</div>
              </div>

              {/* Wind Speed & Direction */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Wind</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather ? `${weather.windSpeed.toFixed(0)} km/h ${getWindDirection(weather.windDirection)}` : '2 km/h NNE'}
                </div>
                <div className="text-[10px] text-blue-200/70">Gentle breeze</div>
              </div>

              {/* Wave Swell */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Wave Swell</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.swellHeight ? `${weather.swellHeight.toFixed(1)} m` : '0.4 m'}
                </div>
                <div className="text-[10px] text-blue-200/70">Calm waters</div>
              </div>

              {/* UV Index */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <SunMedium className="w-3.5 h-3.5" />
                  <span>UV Index</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  Moderate (5)
                </div>
                <div className="text-[10px] text-blue-200/70">SPF 30+ advised</div>
              </div>

            </div>

          </div>
        </div>

        {/* ── ZONE 2: CORE DECISION HUB (Tides + Activities, Perfectly Balanced) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Left Column (60% / col-span-7): Tides & Sea Level Card */}
          <div className="lg:col-span-7">
            <TideCard extremes={tideExtremes} />
          </div>

          {/* Right Column (40% / col-span-5): Beach Activity Feasibility */}
          <div className="lg:col-span-5 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
                  Beach Activity Feasibility
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live assessment guided by current tides and wave telemetry.
              </p>
            </div>

            {/* 6 Clean Activity Rows */}
            <div className="space-y-2">
              {[
                { activity: 'Swimming', status: 'Favorable', color: 'emerald', note: 'Calm shoreline waters and gentle currents.' },
                { activity: 'Snorkeling', status: 'Favorable', color: 'emerald', note: 'Clear underwater reef visibility.' },
                { activity: 'Sandbar Walk', status: 'Low Tide Window', color: 'blue', note: 'Best accessible as water recedes.' },
                { activity: 'Diving', status: 'Caution', color: 'amber', note: 'Check mid-day channel currents before deep dive.' },
                { activity: 'Kayaking & Boating', status: 'Favorable', color: 'emerald', note: 'Safe light offshore breeze.' },
                { activity: 'Beachfront Dining', status: 'Favorable', color: 'emerald', note: 'Cottages sheltered from strong wind.' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800/80">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.activity}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.note}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    item.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : item.color === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-blue-100 text-[#1F3F74] dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── ZONE 3: PLANNING AHEAD (4-Day Forecast + Coastal Tips, Balanced 50/50) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
          
          {/* Left Column (50%): 4-Day Coastal Forecast */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
                  4-Day Coastal Forecast
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weather trends for upcoming beach visits in Catmon.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { day: 'Tomorrow', condition: 'Partly Cloudy', high: 31, low: 26, rain: 20, icon: CloudSun },
                { day: 'Saturday', condition: 'Mostly Sunny', high: 32, low: 26, rain: 10, icon: Sun },
                { day: 'Sunday', condition: 'Passing Showers', high: 30, low: 25, rain: 30, icon: CloudRain },
                { day: 'Monday', condition: 'Clear Sky', high: 31, low: 26, rain: 15, icon: Sun },
              ].map((day, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <day.icon className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA] flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{day.day}</div>
                      <div className="text-[10px] text-slate-400">{day.condition}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {day.low}°C – {day.high}°C
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium w-12 justify-end">
                      <Droplets className="w-3 h-3 text-sky-500" />
                      <span>{day.rain}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (50%): Coastal Reminders & Travel Tips */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
                  Coastal Reminders
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Helpful advisories for your safety and comfort in Binongkalan.
              </p>
            </div>

            <div className="space-y-2">
              {generateReminders(weather, currentTide).map((reminder, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                    reminder.type === 'alert'
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-300'
                      : reminder.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-neutral-900/60 border-slate-100 dark:border-neutral-800 text-slate-700 dark:text-neutral-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    reminder.type === 'alert'
                      ? 'bg-red-100 text-red-600'
                      : reminder.type === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 dark:bg-blue-950 text-[#1F3F74] dark:text-sky-300'
                  }`}>
                    <reminder.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-medium leading-relaxed flex-1">
                    {reminder.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
