'use client';

import React, { useState, useEffect } from 'react';
import {
  Waves,
  Wind,
  Droplets,
  Sun,
  SunMedium,
  CloudRain,
  CloudSun,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Moon,
  ChevronDown,
  Activity,
  Cloud,
} from 'lucide-react';
import type { WeatherData } from '@/lib/services/weather';
import type { CurrentTideState, TideExtreme } from '@/lib/services/tide-interpolation';
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
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function generateReminders(weather: WeatherData | null, currentTide: CurrentTideState | null) {
  const reminders: { icon: React.ComponentType<{ className?: string }>; text: string; type: 'info' | 'warning' | 'alert' }[] = [];
  if (!weather) return reminders;

  if (weather.weatherCode >= 95) {
    reminders.push({
      icon: AlertTriangle,
      text: 'Thunderstorm conditions are reported. Avoid entering the water and seek proper shelter.',
      type: 'alert',
    });
  } else if ((weather.weatherCode >= 61 && weather.weatherCode <= 67) || (weather.weatherCode >= 80 && weather.weatherCode <= 82)) {
    reminders.push({
      icon: CloudRain,
      text: `Rain is reported (${weather.conditionLabel}). Recheck conditions before heading out on the water.`,
      type: 'warning',
    });
  }

  if (weather.uvIndex !== null && weather.uvIndex >= 6) {
    reminders.push({
      icon: Sun,
      text: `The current UV index is ${weather.uvIndex.toFixed(0)}. Seek shade and use sun protection outdoors.`,
      type: 'warning',
    });
  }

  if (weather.windSpeed >= 30) {
    reminders.push({
      icon: Waves,
      text: `Wind is ${weather.windSpeed.toFixed(0)} km/h. Take care around exposed shorelines and small boats.`,
      type: 'warning',
    });
  }

  if (weather.waveHeight !== null && weather.waveHeight >= 1.5) {
    reminders.push({
      icon: Waves,
      text: `Forecast wave height is ${weather.waveHeight.toFixed(1)} m. Check local sea conditions before swimming or boating.`,
      type: 'warning',
    });
  }

  if (currentTide && currentTide.currentHeight <= 0.3) {
    reminders.push({
      icon: Waves,
      text: `The tide is low at ${currentTide.currentHeight.toFixed(2)} m. Use care on exposed and slippery shoreline areas.`,
      type: 'info',
    });
  }

  const missingMarineReadings = [
    weather.waveHeight === null ? 'wave' : null,
    weather.swellHeight === null ? 'swell' : null,
    currentTide === null ? 'tide' : null,
  ].filter(Boolean);
  if (missingMarineReadings.length > 0) {
    reminders.push({
      icon: AlertTriangle,
      text: `${missingMarineReadings.join(', ')} readings are unavailable. Confirm sea conditions with local staff.`,
      type: 'warning',
    });
  }

  if (reminders.length === 0) {
    reminders.push({
      icon: Activity,
      text: 'No weather alerts were triggered by the readings that are currently available.',
      type: 'info',
    });
  }
  return reminders;
}

function getForecastIcon(weatherCode: number) {
  if (weatherCode >= 95 || (weatherCode >= 61 && weatherCode <= 82)) return CloudRain;
  if (weatherCode >= 45 && weatherCode <= 48 || weatherCode === 3) return Cloud;
  if (weatherCode === 1 || weatherCode === 2) return CloudSun;
  return Sun;
}

function getActivityAssessments(weather: WeatherData | null, tide: CurrentTideState | null) {
  if (!weather) return [];

  const storm = weather.weatherCode >= 95;
  const rain = (weather.weatherCode >= 61 && weather.weatherCode <= 82);
  const roughWaves = weather.waveHeight !== null && weather.waveHeight >= 1.5;
  const strongWind = weather.windSpeed >= 30;
  const lowTide = tide !== null && tide.currentHeight <= 0.3;
  const highTide = tide !== null && tide.currentHeight >= 1.8;
  const reasons = {
    storm: storm ? 'thunderstorm' : null,
    rain: rain ? 'rain' : null,
    waves: roughWaves ? `waves ${weather.waveHeight?.toFixed(1)} m` : null,
    swell: weather.swellHeight !== null && weather.swellHeight >= 1.2
      ? `swell ${weather.swellHeight.toFixed(1)} m`
      : null,
    wind: strongWind ? `wind ${weather.windSpeed.toFixed(0)} km/h` : null,
    tide: lowTide ? 'very low tide' : highTide ? 'high tide' : null,
  };
  const makeAssessment = (activity: string, signals: (string | null)[]) => {
    const activeSignals = signals.filter((signal): signal is string => Boolean(signal));
    const caution = activeSignals.length > 0;
    const limitedData = weather.waveHeight === null || weather.swellHeight === null || tide === null;
    return {
      activity,
      status: caution ? 'Check locally' : limitedData ? 'Limited data' : 'No alert reported',
      statusStyle: caution
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        : limitedData
          ? 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
          : 'bg-blue-100 text-[#1F3F74] dark:bg-blue-950/60 dark:text-blue-300',
      note: caution
        ? `Current readings: ${activeSignals.join(', ')}. Confirm conditions with local staff.`
        : limitedData
          ? 'Some wave or tide readings are unavailable. Confirm conditions locally.'
          : 'No related weather alert in the current feed; conditions can still change.',
    };
  };

  return [
    makeAssessment('Swimming', [reasons.storm, reasons.rain, reasons.waves, strongWind ? reasons.wind : null, lowTide ? reasons.tide : null]),
    makeAssessment('Snorkeling', [reasons.storm, reasons.rain, reasons.waves, reasons.swell]),
    makeAssessment('Shoreline walking', [reasons.storm, reasons.wind, reasons.tide]),
    makeAssessment('Kayaking & boating', [reasons.storm, reasons.wind, reasons.waves, reasons.swell]),
  ];
}

export default function WeatherPage() {
  const [beaches, setBeaches] = useState<BeachRecord[]>([]);
  const [beachesLoaded, setBeachesLoaded] = useState(false);
  const [selectedBeachId, setSelectedBeachId] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tideExtremes, setTideExtremes] = useState<TideExtreme[]>([]);
  const [currentTide, setCurrentTide] = useState<CurrentTideState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

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
        }
      })
      .catch((err) => {
        console.error('Failed to load beaches for weather:', err);
        setDataError(err instanceof Error ? err.message : 'Could not load beach locations.');
      })
      .finally(() => {
        setBeachesLoaded(true);
      });
  }, []);

  const selectedBeach = beaches.find((b) => b.id === selectedBeachId) || beaches[0] || null;

  useEffect(() => {
    if (!beachesLoaded) return;

    const lat = selectedBeach?.latitude ?? 10.6865;
    const lon = selectedBeach?.longitude ?? 124.0152;
    let active = true;

    const loadConditions = async () => {
      const [weatherResult, tideResult] = await Promise.allSettled([
        fetch(`/api/weather?lat=${lat}&lon=${lon}`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) {
              const result = await response.json().catch(() => null);
              throw new Error(result?.error || 'Weather data is unavailable.');
            }
            return response.json() as Promise<WeatherData>;
          }),
        fetch(`/api/tides?lat=${lat}&lon=${lon}`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) throw new Error('Tide data is unavailable.');
            return response.json();
          }),
      ]);

      if (!active) return;

      if (weatherResult.status === 'fulfilled') setWeather(weatherResult.value);
      else {
        setWeather(null);
        setDataError(weatherResult.reason instanceof Error ? weatherResult.reason.message : 'Weather data is unavailable.');
      }

      if (tideResult.status === 'fulfilled') {
        setTideExtremes(Array.isArray(tideResult.value.extremes) ? tideResult.value.extremes : []);
        setCurrentTide(tideResult.value.current || null);
      } else {
        setTideExtremes([]);
        setCurrentTide(null);
        if (weatherResult.status === 'fulfilled') {
          setDataError(tideResult.reason instanceof Error ? tideResult.reason.message : 'Tide data is unavailable.');
        }
      }

      setLoading(false);
    };

    void loadConditions();
    return () => {
      active = false;
    };
  }, [beachesLoaded, selectedBeach]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const currentHour = new Date().getHours();
  const now = new Date();
  const timeOfDayLabel = !weather
    ? 'Current Coastal Weather'
    : currentHour >= 6 && currentHour < 12
      ? 'Morning Coastal Weather'
      : currentHour >= 12 && currentHour < 18
      ? 'Afternoon Coastal Weather'
      : 'Evening Coastal Weather';

  const activityAssessments = getActivityAssessments(weather, currentTide);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 dark:bg-black sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading coastal conditions">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-14 w-72 animate-pulse rounded-xl bg-slate-200 dark:bg-neutral-800" />
          <div className="h-56 animate-pulse rounded-2xl bg-[#1f3f74]/15 dark:bg-[#1f3f74]/30" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-neutral-800" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-neutral-800" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-neutral-800" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* ── Main Dashboard Body ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 space-y-6 sm:space-y-7">
        
        {/* Freestanding Header: Location Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3F74] dark:text-white tracking-tight leading-tight">
              {selectedBeach?.name || 'Barangay Binongkalan'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{selectedBeach?.location || 'Catmon, Cebu'}</span>
              <span className="text-slate-300 dark:text-neutral-700">•</span>
              <span className="text-slate-400 dark:text-neutral-500 font-mono text-xs">
                {(selectedBeach?.latitude ?? 10.6865).toFixed(4)}° N, {(selectedBeach?.longitude ?? 124.0152).toFixed(4)}° E
              </span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3 sm:justify-end">
            {beaches.length > 0 && (
              <div className="relative">
                <select
                  value={selectedBeachId}
                  onChange={(e) => {
                    setLoading(true);
                    setDataError(null);
                    setSelectedBeachId(e.target.value);
                  }}
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

            {/* Frameless Updated timestamp without container or green dot */}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Updated {formatDate(now)} · {formatTime(now)}
            </span>
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
                  {weather?.conditionLabel || 'Current conditions unavailable'} · RealFeel {weather?.heatIndex ? `${weather.heatIndex.heatIndexCelsius.toFixed(1)}°C` : weather ? `${weather.temperature.toFixed(1)}°C` : '--'}
                </div>
              </div>
            </div>

            {/* Right: 4 Key Coastal Telemetry Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:gap-3 w-full lg:w-auto">
              
              {/* Sea Temperature */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Sea Temp</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.waterTemperature != null ? `${weather.waterTemperature.toFixed(1)}°C` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-blue-200/70">Marine forecast</div>
              </div>

              {/* Wind Speed & Direction */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Wind</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather ? `${weather.windSpeed.toFixed(0)} km/h ${getWindDirection(weather.windDirection)}` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-blue-200/70">Current conditions</div>
              </div>

              {/* Wave Swell */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Swell</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.swellHeight != null ? `${weather.swellHeight.toFixed(1)} m` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-blue-200/70">Forecast swell height</div>
              </div>

              {/* UV Index */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-colors">
                <div className="flex items-center gap-1.5 text-blue-200 text-xs">
                  <SunMedium className="w-3.5 h-3.5" />
                  <span>UV Index</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.uvIndex != null ? weather.uvIndex.toFixed(1) : 'Unavailable'}
                </div>
                <div className="text-[10px] text-blue-200/70">
                  {weather?.uvIndex == null ? 'Current UV unavailable' : weather.uvIndex >= 6 ? 'High exposure' : 'Current UV'}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ── ZONE 2: CORE DECISION HUB (Tide Status + Activities) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Left Column (60% / col-span-7): Tide Status Card */}
          <div className="lg:col-span-7">
            <TideCard extremes={tideExtremes} />
          </div>

          {/* Right Column (40% / col-span-5): Beach Activity Feasibility (Sandbar removed) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
                  Beach Activity Feasibility
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Advisory signals are calculated from the latest weather, wave, and tide readings.
              </p>
            </div>

            <div className="space-y-2">
              {activityAssessments.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:bg-neutral-900/60 dark:text-slate-400">
                  Activity guidance is unavailable until current weather data loads.
                </p>
              ) : activityAssessments.map((item) => (
                <div key={item.activity} className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800/80">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.activity}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.note}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.statusStyle}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── ZONE 3: PLANNING AHEAD (Dynamic 4-Day Forecast + Coastal Tips) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
          
          {/* Left Column (50%): Dynamic 4-Day Coastal Forecast */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-[#1F3F74] dark:text-[#4987BA]" />
                <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
                  4-Day Coastal Forecast
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Forecast values from Open-Meteo for this beach location.
              </p>
            </div>

            <div className="space-y-2.5">
              {weather?.dailyForecast.length ? weather.dailyForecast.map((day) => {
                const ForecastIcon = getForecastIcon(day.weatherCode);
                const date = new Date(`${day.date}T12:00:00`);
                return (
                  <div key={day.date} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                    <div className="w-20 shrink-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {date.toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <ForecastIcon className="h-7 w-7 shrink-0 text-[#1F3F74] dark:text-[#8db8e4]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{day.conditionLabel}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-sky-600" />
                          {day.precipitationProbability == null ? 'Rain —' : `${day.precipitationProbability}%`}
                        </span>
                        <span>UV {day.uvIndexMax == null ? '—' : day.uvIndexMax.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{day.high.toFixed(0)}°</span>
                      <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">{day.low.toFixed(0)}°</span>
                    </div>
                  </div>
                );
              }) : (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-neutral-900/60 dark:text-slate-400">
                  The four-day forecast is unavailable from the weather service right now.
                </p>
              )}
            </div>
          </div>

          {/* Right Column (50%): Coastal Reminders & Travel Tips with Lotion & Waves Icons */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
                  Coastal Reminders
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Advisories are based on current weather and coastal readings.
              </p>
            </div>

            <div className="space-y-2">
              {(weather ? generateReminders(weather, currentTide) : []).map((reminder, i) => (
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
              {!weather && (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-neutral-900/60 dark:text-slate-400">
                  Coastal reminders are unavailable until live weather data loads.
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
