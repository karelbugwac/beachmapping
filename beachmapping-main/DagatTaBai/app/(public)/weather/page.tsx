'use client';

import { useState, useEffect } from 'react';
import {
  Waves,
  Wind,
  Droplets,
  Sun,
  SunMedium,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  CloudMoon,
  CloudSun,
  Snowflake,
  AlertTriangle,
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

function WeatherIcon({ code, className, isNight = false }: { code: number; className?: string; isNight?: boolean }) {
  if (isNight && code === 0) return <Moon className={className} />;
  if (isNight && (code === 1 || code === 2)) return <CloudMoon className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <Snowflake className={className} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className={className} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={className} />;
  if (code >= 45 && code <= 48) return <CloudFog className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code === 1 || code === 2) return <CloudSun className={className} />;
  return <Sun className={className} />;
}

// Helper to convert wind direction degrees to compass direction
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function generateReminders(weather: WeatherData | null, currentTide: CurrentTideState | null) {
  const reminders: { text: string; type: 'info' | 'warning' | 'alert' }[] = [];
  if (!weather) return reminders;

  if (weather.weatherCode >= 95) {
    reminders.push({
      text: 'Thunderstorm conditions are reported. Avoid entering the water and seek proper shelter.',
      type: 'alert',
    });
  } else if ((weather.weatherCode >= 51 && weather.weatherCode <= 67) || (weather.weatherCode >= 80 && weather.weatherCode <= 82)) {
    reminders.push({
      text: `${weather.conditionLabel} is reported. Use care near the shoreline and on the water.`,
      type: 'warning',
    });
  }

  if (weather.uvIndex !== null && weather.uvIndex >= 6) {
    reminders.push({
      text: `The current UV index is ${weather.uvIndex.toFixed(0)}. Seek shade and use sun protection outdoors.`,
      type: 'warning',
    });
  }

  if (weather.windSpeed >= 30) {
    reminders.push({
      text: `Wind is ${weather.windSpeed.toFixed(0)} km/h. Take care around exposed shorelines and small boats.`,
      type: 'warning',
    });
  }

  if (weather.waveHeight !== null && weather.waveHeight >= 1.5) {
    reminders.push({
      text: `Forecast wave height is ${weather.waveHeight.toFixed(1)} m. Use caution before swimming or boating.`,
      type: 'warning',
    });
  }

  if (currentTide && currentTide.currentHeight <= 0.3) {
    reminders.push({
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
      text: `${missingMarineReadings.join(', ')} readings are unavailable, so some coastal guidance is limited.`,
      type: 'warning',
    });
  }

  if (reminders.length === 0) {
    reminders.push({
      text: 'No weather alerts were triggered by the readings that are currently available.',
      type: 'info',
    });
  }
  return reminders;
}

function getForecastIconColor(weatherCode: number) {
  if (weatherCode >= 95) return 'text-violet-500';
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) return 'text-sky-400';
  if ((weatherCode >= 51 && weatherCode <= 82)) return 'text-sky-500';
  if ((weatherCode >= 45 && weatherCode <= 48) || weatherCode === 3) return 'text-slate-400';
  return 'text-amber-500';
}

function formatWeatherTime(value: string | null) {
  if (!value) return 'Unavailable';
  const parsed = /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ? new Date(value)
    : new Date(`${value}:00+08:00`);
  if (!Number.isFinite(parsed.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function getAirQualityLabel(usAqi: number) {
  if (usAqi <= 50) return 'Good';
  if (usAqi <= 100) return 'Moderate';
  if (usAqi <= 150) return 'Unhealthy for sensitive groups';
  if (usAqi <= 200) return 'Unhealthy';
  if (usAqi <= 300) return 'Very unhealthy';
  return 'Hazardous';
}

function getAirQualityColor(usAqi: number) {
  if (usAqi <= 50) return 'text-emerald-200';
  if (usAqi <= 100) return 'text-amber-200';
  if (usAqi <= 150) return 'text-orange-200';
  return 'text-rose-200';
}

function getParticulateReadings(airQuality: NonNullable<WeatherData['airQuality']>) {
  const readings = [
    airQuality.pm25 == null ? null : `PM2.5 ${airQuality.pm25.toFixed(1)}`,
    airQuality.pm10 == null ? null : `PM10 ${airQuality.pm10.toFixed(1)}`,
  ].filter((reading): reading is string => reading !== null).join(' · ');
  return readings ? `${readings} μg/m³` : 'Particulate readings unavailable';
}

function getActivityAssessments(weather: WeatherData | null, tide: CurrentTideState | null) {
  if (!weather) return [];

  const storm = weather.weatherCode >= 95;
  const rain = (weather.weatherCode >= 51 && weather.weatherCode <= 67) || (weather.weatherCode >= 80 && weather.weatherCode <= 82);
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
      status: caution ? 'Use caution' : limitedData ? 'Limited data' : 'No alert reported',
      statusStyle: caution
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        : limitedData
          ? 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
          : 'bg-blue-100 text-[#1F3F74] dark:bg-blue-950/60 dark:text-blue-300',
      note: caution
        ? `Current readings include ${activeSignals.join(', ')}. Conditions can change.`
        : limitedData
          ? 'Some wave or tide readings are unavailable; guidance is limited.'
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
  const beachBackgroundCandidate = selectedBeach?.cover_image || selectedBeach?.images?.[0]?.photo_url;
  const beachBackgroundUrl = (() => {
    if (beachBackgroundCandidate) {
      try {
        const url = new URL(beachBackgroundCandidate);
        if (url.protocol === 'https:' && (url.hostname === 'images.unsplash.com' || url.hostname.endsWith('.supabase.co'))) {
          return url.toString();
        }
      } catch {
        console.warn('Ignoring an invalid beach cover image URL.');
      }
    }
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85';
  })();

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

  const currentHour = weather ? Number(weather.timestamp.slice(11, 13)) : new Date().getHours();
  const now = new Date();
  const currentMinutes = Number.isFinite(currentHour) ? currentHour * 60 : now.getHours() * 60 + now.getMinutes();
  const sunriseMinutes = weather?.sunrise ? Number(weather.sunrise.slice(11, 13)) * 60 + Number(weather.sunrise.slice(14, 16)) : null;
  const sunsetMinutes = weather?.sunset ? Number(weather.sunset.slice(11, 13)) * 60 + Number(weather.sunset.slice(14, 16)) : null;
  const isNight = sunriseMinutes !== null && sunsetMinutes !== null
    ? currentMinutes < sunriseMinutes || currentMinutes >= sunsetMinutes
    : currentHour >= 18 || currentHour < 6;
  const heroBackground = isNight
    ? 'from-[#101a3c]/45 via-[#243d72]/30 to-[#365b79]/20'
    : weather?.weatherCode && weather.weatherCode >= 95
        ? 'from-[#334155]/50 via-[#526579]/35 to-[#284461]/25'
      : weather?.weatherCode && weather.weatherCode >= 51 && weather.weatherCode <= 82
          ? 'from-[#24566d]/45 via-[#347e96]/30 to-[#5c9eac]/20'
        : weather?.weatherCode === 3 || (weather?.weatherCode !== undefined && weather.weatherCode >= 45 && weather.weatherCode <= 48)
            ? 'from-[#627c8d]/40 via-[#829baa]/25 to-[#a9c1c5]/15'
            : 'from-[#0789b5]/35 via-[#49b6cf]/20 to-[#8bd4d2]/10';
  const nightSkyBackground = weather?.weatherCode && weather.weatherCode >= 95
    ? [
        'radial-gradient(ellipse at 72% 54%, rgba(110, 142, 165, 0.32), transparent 50%)',
        'radial-gradient(ellipse at 18% 72%, rgba(75, 108, 139, 0.48), transparent 54%)',
        'linear-gradient(180deg, #08101f 0%, #111f35 42%, #213b53 76%, #182c3d 100%)',
      ]
    : weather?.weatherCode && weather.weatherCode >= 3
      ? [
          'radial-gradient(ellipse at 72% 58%, rgba(125, 151, 174, 0.38), transparent 52%)',
          'radial-gradient(ellipse at 18% 74%, rgba(83, 117, 150, 0.42), transparent 56%)',
          'linear-gradient(180deg, #080f20 0%, #17243b 46%, #29445d 100%)',
        ]
      : [
          'radial-gradient(1.5px 1.5px at 7% 14%, rgba(255,255,255,.9) 50%, transparent 100%)',
          'radial-gradient(1px 1px at 18% 32%, rgba(220,237,255,.85) 50%, transparent 100%)',
          'radial-gradient(1.5px 1.5px at 31% 11%, rgba(255,255,255,.8) 50%, transparent 100%)',
          'radial-gradient(1px 1px at 44% 26%, rgba(220,237,255,.85) 50%, transparent 100%)',
          'radial-gradient(1.5px 1.5px at 57% 9%, rgba(255,255,255,.9) 50%, transparent 100%)',
          'radial-gradient(1px 1px at 68% 30%, rgba(220,237,255,.8) 50%, transparent 100%)',
          'radial-gradient(1.5px 1.5px at 81% 16%, rgba(255,255,255,.9) 50%, transparent 100%)',
          'radial-gradient(1px 1px at 94% 35%, rgba(220,237,255,.8) 50%, transparent 100%)',
          'radial-gradient(1px 1px at 13% 51%, rgba(255,255,255,.75) 50%, transparent 100%)',
          'radial-gradient(1.5px 1.5px at 38% 44%, rgba(220,237,255,.8) 50%, transparent 100%)',
          'radial-gradient(1px 1px at 62% 52%, rgba(255,255,255,.8) 50%, transparent 100%)',
          'radial-gradient(1px 1px at 88% 48%, rgba(220,237,255,.75) 50%, transparent 100%)',
          'linear-gradient(180deg, #050b1b 0%, #101c38 48%, #192e4e 78%, #18344b 100%)',
        ];
  const pageBackgroundStyle = isNight
    ? { backgroundImage: nightSkyBackground.join(', ') }
    : {
        backgroundImage: `linear-gradient(rgba(15, 54, 76, 0.32), rgba(15, 54, 76, 0.32)), url(${JSON.stringify(beachBackgroundUrl)})`,
      };
  const nightStars = [
    { left: '4%', top: '5%', size: 'h-2 w-2' },
    { left: '11%', top: '17%', size: 'h-1.5 w-1.5' },
    { left: '19%', top: '8%', size: 'h-2.5 w-2.5' },
    { left: '27%', top: '24%', size: 'h-1.5 w-1.5' },
    { left: '34%', top: '12%', size: 'h-2 w-2' },
    { left: '42%', top: '6%', size: 'h-1.5 w-1.5' },
    { left: '49%', top: '20%', size: 'h-2.5 w-2.5' },
    { left: '57%', top: '9%', size: 'h-1.5 w-1.5' },
    { left: '64%', top: '26%', size: 'h-2 w-2' },
    { left: '72%', top: '7%', size: 'h-2.5 w-2.5' },
    { left: '79%', top: '18%', size: 'h-1.5 w-1.5' },
    { left: '87%', top: '10%', size: 'h-2 w-2' },
    { left: '95%', top: '23%', size: 'h-1.5 w-1.5' },
    { left: '7%', top: '34%', size: 'h-1.5 w-1.5' },
    { left: '23%', top: '39%', size: 'h-2 w-2' },
    { left: '39%', top: '33%', size: 'h-1.5 w-1.5' },
    { left: '55%', top: '41%', size: 'h-2 w-2' },
    { left: '75%', top: '36%', size: 'h-1.5 w-1.5' },
    { left: '92%', top: '43%', size: 'h-2 w-2' },
  ];
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
      <div className={`relative isolate min-h-[calc(100vh-4rem)] bg-cover bg-center bg-fixed px-4 py-8 text-slate-900 dark:text-zinc-100 sm:px-6 lg:px-8 ${isNight ? 'bg-[length:100%_100%]' : ''}`} style={pageBackgroundStyle} aria-busy="true" aria-label="Loading coastal conditions">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-black/10" />
        <div className="relative mx-auto max-w-7xl space-y-6">
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
    <div className={`relative isolate min-h-screen bg-cover bg-center bg-fixed text-slate-900 transition-colors duration-200 dark:text-zinc-100 ${isNight ? 'bg-[length:100%_100%]' : ''}`} style={pageBackgroundStyle}>
      {isNight && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          {nightStars.map((star, index) => (
            <span
              key={star.left + star.top}
              className={`absolute ${star.size} rounded-full bg-white shadow-[0_0_7px_2px_rgba(219,234,254,0.8)] animate-pulse`}
              style={{
                left: star.left,
                top: star.top,
                animationDelay: `${(index % 6) * 350}ms`,
                animationDuration: `${2.2 + (index % 4) * 0.45}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* ── Main Dashboard Body ───────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-6 sm:space-y-7 sm:px-6 sm:pt-8 lg:px-8">
        
        {/* Freestanding Header: Location Title & Controls */}
        <div className="glass-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="appearance-none rounded-full border border-white/60 bg-white/70 pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-xl focus:outline-none focus:ring-1 focus:ring-[#1F3F74] dark:border-white/10 dark:bg-black/40 dark:text-neutral-200"
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
          <div role="status" className="glass-card flex items-center gap-2 rounded-xl border-amber-300/70 bg-amber-50/75 px-4 py-3 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/55 dark:text-amber-300 sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        {/* ── ZONE 1: BALANCED HERO OVERVIEW (Dive Blue #1F3F74) ── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-slate-950/30 p-5 text-white shadow-2xl backdrop-blur-xl sm:p-7">
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${heroBackground}`} />
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/15 bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-36 left-1/4 h-64 w-64 rounded-full bg-cyan-100/10 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="flex items-center gap-5 sm:gap-7">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-36 sm:w-36">
                <div className="absolute inset-2 rounded-full bg-white/10 blur-xl" />
                <WeatherIcon
                  code={weather?.weatherCode ?? 2}
                  isNight={isNight}
                  className={`relative z-10 h-20 w-20 stroke-[1.35] drop-shadow-[0_8px_18px_rgba(15,35,60,0.28)] sm:h-28 sm:w-28 ${
                    isNight ? 'text-amber-200 fill-amber-100/15' : weather?.weatherCode === 0 ? 'text-amber-200' : 'text-white'
                  }`}
                />
                {isNight && (
                  <>
                    <StarSparkle className="absolute right-2 top-1 h-3 w-3 text-blue-100 animate-pulse" />
                    <StarSparkle className="absolute bottom-3 left-2 h-2.5 w-2.5 text-amber-100 animate-pulse delay-700" />
                    <StarSparkle className="absolute left-5 top-4 h-2 w-2 text-white/80 animate-pulse" />
                  </>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="text-xs uppercase tracking-[0.2em] text-white/75 font-semibold">
                  {timeOfDayLabel}
                </div>
                <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {weather ? `${weather.temperature.toFixed(1)}°C` : '--'}
                </div>
                <div className="text-sm sm:text-base text-white/90 font-medium">
                  {weather?.conditionLabel || 'Current conditions unavailable'} · RealFeel {weather?.heatIndex ? `${weather.heatIndex.heatIndexCelsius.toFixed(1)}°C` : weather ? `${weather.temperature.toFixed(1)}°C` : '--'}
                </div>
                <div className="pt-1 text-xs text-white/70">
                  {weather ? `Humidity ${weather.relativeHumidity}%` : 'Waiting for current readings'}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5 lg:w-auto lg:gap-3">
              
              {/* Sea Temperature */}
              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Sea Temp</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.waterTemperature != null ? `${weather.waterTemperature.toFixed(1)}°C` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/65">Marine forecast</div>
              </div>

              {/* Wind Speed & Direction */}
              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Wind</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather ? `${weather.windSpeed.toFixed(0)} km/h ${getWindDirection(weather.windDirection)}` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/65">Current conditions</div>
              </div>

              {/* Wave Swell */}
              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Swell</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.swellHeight != null ? `${weather.swellHeight.toFixed(1)} m` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/65">Forecast swell height</div>
              </div>

              {/* UV Index */}
              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <SunMedium className="w-3.5 h-3.5" />
                  <span>UV Index</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.uvIndex != null ? weather.uvIndex.toFixed(1) : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/65">
                  {weather?.uvIndex == null ? 'Current UV unavailable' : weather.uvIndex >= 6 ? 'High exposure' : 'Current UV'}
                </div>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="flex items-center gap-1.5 text-blue-100 text-xs">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Air quality</span>
                </div>
                <div className={`mt-1 text-base font-bold sm:text-lg ${weather?.airQuality ? getAirQualityColor(weather.airQuality.usAqi) : 'text-white'}`}>
                  {weather?.airQuality ? `AQI ${weather.airQuality.usAqi}` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/75">
                  {weather?.airQuality
                    ? `${getAirQualityLabel(weather.airQuality.usAqi)} · US AQI`
                    : 'Live reading unavailable'}
                </div>
                {weather?.airQuality && (
                  <div className="mt-1 text-[9px] text-white/65">
                    {getParticulateReadings(weather.airQuality)}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Sunrise', value: formatWeatherTime(weather?.sunrise ?? null), icon: Sun, tone: 'text-amber-500' },
            { label: 'Sunset', value: formatWeatherTime(weather?.sunset ?? null), icon: Sun, tone: 'text-orange-500' },
            { label: 'Moonrise · est.', value: formatWeatherTime(weather?.moonrise ?? null), icon: Moon, tone: 'text-indigo-500' },
            { label: 'Moonset · est.', value: formatWeatherTime(weather?.moonset ?? null), icon: Moon, tone: 'text-indigo-500' },
          ].map(({ label, value, icon: SkyIcon, tone }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/65 px-3.5 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
              <SkyIcon className={`h-5 w-5 shrink-0 ${tone}`} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
                <div className="truncate text-sm font-bold text-slate-800 dark:text-white">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ZONE 2: CORE DECISION HUB (Tide Status + Activities) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Left Column (60% / col-span-7): Tide Status Card */}
          <div className="lg:col-span-7">
            <TideCard extremes={tideExtremes} />
          </div>

          {/* Right Column (40% / col-span-5): Beach Activity Feasibility (Sandbar removed) */}
          <div className="glass-card space-y-3 rounded-3xl p-4 sm:p-5">
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
                <div key={item.activity} className="flex items-center justify-between rounded-xl border border-white/50 bg-white/35 p-2 backdrop-blur-md dark:border-white/5 dark:bg-black/20 sm:p-2.5">
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
          <div className="glass-card space-y-3 rounded-3xl p-4 shadow-lg shadow-slate-200/40 dark:shadow-black/10 sm:p-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-[#1F3F74] dark:text-sky-300" />
                <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
                  4-day forecast
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily conditions for {selectedBeach?.name || 'this location'}
              </p>
            </div>

            <div className="mt-3 space-y-2.5">
              {weather?.dailyForecast.length ? weather.dailyForecast.map((day) => {
                const date = new Date(`${day.date}T12:00:00`);
                return (
                  <div key={day.date} className="grid grid-cols-[3rem_2.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/60 bg-white/35 px-2 py-3 backdrop-blur-md dark:border-white/5 dark:bg-black/20 sm:grid-cols-[4rem_3rem_minmax(0,1fr)_auto] sm:gap-3 sm:px-3">
                    <div className="shrink-0 text-center">
                      <div className="text-xs font-bold uppercase text-slate-800 dark:text-white">
                        {date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <WeatherIcon code={day.weatherCode} className={`h-7 w-7 justify-self-center sm:h-8 sm:w-8 ${getForecastIconColor(day.weatherCode)}`} />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{day.conditionLabel}</div>
                      <div className="mt-1 flex flex-wrap gap-x-2.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                          {day.precipitationProbability == null ? 'Rain —' : `Rain ${day.precipitationProbability}%`}
                        </span>
                        <span>UV {day.uvIndexMax == null ? '—' : day.uvIndexMax.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{day.high.toFixed(0)}°</span>
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
          <div className="glass-card space-y-3 rounded-3xl p-4 shadow-lg shadow-slate-200/40 dark:shadow-black/10 sm:p-5">
            <div>
              <div className="mb-1">
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
                  className={`rounded-xl border-l-4 px-3 py-2.5 ${
                    reminder.type === 'alert'
                      ? 'border-red-500 bg-red-50/65 text-red-900 backdrop-blur-md dark:bg-red-950/35 dark:text-red-300'
                      : reminder.type === 'warning'
                      ? 'border-amber-400 bg-amber-50/65 text-amber-900 backdrop-blur-md dark:bg-amber-950/35 dark:text-amber-300'
                      : 'border-sky-500 bg-white/45 text-slate-700 backdrop-blur-md dark:bg-black/25 dark:text-neutral-300'
                  }`}
                >
                  <p className="text-xs font-medium leading-relaxed">
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
