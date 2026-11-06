'use client';

import { useState, useEffect } from 'react';
import {
  Wind,
  Droplets,
  Thermometer,
  Sun,
  Sunrise,
  Sunset,
  AlertTriangle,
} from 'lucide-react';
import type { WeatherData } from '@/lib/services/weather';
import type { CurrentTideState, TideExtreme } from '@/lib/services/tide-interpolation';
import { calculateCurrentTide } from '@/lib/services/tide-interpolation';
import TideCard from '@/components/TideCard';

const BINONGKALAN_LATITUDE = 10.6865;
const BINONGKALAN_LONGITUDE = 124.0152;
const LUNAR_CYCLE_DAYS = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

// Authentic 4-pointed sparkle star component
function StarSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
    </svg>
  );
}

function WeatherIcon({ code, className, isNight = false }: { code: number; className?: string; isNight?: boolean }) {
  const isStorm = code >= 95;
  const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
  const isRain = (code >= 61 && code <= 67) || (code >= 80 && code <= 82);
  const isDrizzle = code >= 51 && code <= 57;
  const isFog = code >= 45 && code <= 48;
  const isCloudy = code === 3 || isFog;
  const isPartlyCloudy = code === 1 || code === 2;
  const showSun = !isNight && (code === 0 || isPartlyCloudy);
  const showMoon = isNight && (code === 0 || isPartlyCloudy);
  const showCloud = isPartlyCloudy || isCloudy || isRain || isDrizzle || isSnow || isStorm;

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {showSun && (
        <g fill="#fbbf24" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
          <path d="M22 5v5M22 34v5M5 22h5M34 22h5M10 10l4 4M30 30l4 4M10 34l4-4M30 14l4-4" />
          <circle cx="22" cy="22" r="9" stroke="none" />
        </g>
      )}
      {showMoon && (
        <path d="M34 8a15 15 0 1 0 18 20A17 17 0 0 1 34 8Z" fill="#fef3c7" stroke="#fcd34d" strokeWidth="2" />
      )}
      {showCloud && (
        <path
          d={isStorm
            ? 'M15 43h34a10 10 0 0 0-2-20 15 15 0 0 0-28-3 12 12 0 0 0-4 23Z'
            : 'M13 43h37a10 10 0 0 0-2-20 15 15 0 0 0-28-3 12 12 0 0 0-7 23Z'}
          fill={isNight || isPartlyCloudy ? '#f8fafc' : '#e0f2fe'}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {isRain && (
        <g stroke="#38bdf8" strokeWidth="3" strokeLinecap="round">
          <path d="m22 49-3 6M34 49l-3 6M46 49l-3 6" />
        </g>
      )}
      {isDrizzle && (
        <g fill="#38bdf8">
          <circle cx="23" cy="52" r="2.5" />
          <circle cx="34" cy="55" r="2.5" />
          <circle cx="45" cy="52" r="2.5" />
        </g>
      )}
      {isStorm && (
        <path d="m35 42-9 13h8l-3 9 13-16h-9l4-6Z" fill="#facc15" stroke="#eab308" strokeWidth="1.5" strokeLinejoin="round" />
      )}
      {isSnow && (
        <g stroke="#e0f2fe" strokeWidth="2.2" strokeLinecap="round">
          <path d="M20 49v10m-4-8 8 6m0-6-8 6M34 49v10m-4-8 8 6m0-6-8 6M48 49v10m-4-8 8 6m0-6-8 6" />
        </g>
      )}
      {isFog && (
        <g stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round">
          <path d="M18 50h32M14 56h27" />
        </g>
      )}
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
  const reminders: { text: string; type: 'info' | 'warning' | 'alert' }[] = [];
  if (!weather) return reminders;

  if (weather.weatherCode >= 95) {
    reminders.push({
      text: 'A thunderstorm is nearby. Stay out of the water and move indoors until it passes.',
      type: 'alert',
    });
  } else if ((weather.weatherCode >= 51 && weather.weatherCode <= 67) || (weather.weatherCode >= 80 && weather.weatherCode <= 82)) {
    reminders.push({
      text: `${weather.conditionLabel} is expected. Wet paths and rocks can be slippery; wait for heavy rain to ease before swimming.`,
      type: 'warning',
    });
  }

  if (weather.uvIndex !== null && weather.uvIndex >= 6) {
    reminders.push({
      text: `The UV index is ${weather.uvIndex.toFixed(0)}. Use sunscreen, wear a hat, and take breaks in the shade.`,
      type: 'warning',
    });
  }

  if (weather.windSpeed >= 30) {
    reminders.push({
      text: `Wind is ${weather.windSpeed.toFixed(0)} km/h. Avoid small boats and exposed parts of the shore while winds are strong.`,
      type: 'warning',
    });
  }

  if (weather.waveHeight !== null && weather.waveHeight >= 1.5) {
    reminders.push({
      text: `Waves may reach ${weather.waveHeight.toFixed(1)} m. Check with resort staff before swimming or taking a small boat out.`,
      type: 'warning',
    });
  }

  const nearLowTide = currentTide !== null && (
    (currentTide.previousExtreme.type === 'low' && currentTide.percentageBetween < 50)
    || (currentTide.nextExtreme.type === 'low' && currentTide.percentageBetween >= 50)
  );
  if (currentTide && nearLowTide) {
    const tideDirection = currentTide.status === 'Rising'
      ? 'rising from low tide'
      : currentTide.status === 'Falling'
        ? 'falling toward low tide'
        : 'near low tide';
    reminders.push({
      text: `The tide is ${tideDirection} (estimated height ${currentTide.currentHeight.toFixed(1)} m). This does not show the actual depth at the resort; stay inside marked areas and ask staff before boating.`,
      type: 'warning',
    });
  }

  const missingMarineReadings = [
    weather.waveHeight === null ? 'wave' : null,
    weather.swellHeight === null ? 'swell' : null,
    currentTide === null ? 'tide' : null,
  ].filter(Boolean);
  if (missingMarineReadings.length > 0) {
    reminders.push({
      text: `Some ${missingMarineReadings.join(', ')} readings are unavailable. Ask resort staff about local conditions before entering the water.`,
      type: 'warning',
    });
  }

  if (reminders.length === 0) {
    reminders.push({
      text: 'No weather warnings are showing right now. Conditions can change, so follow resort signs and staff instructions.',
      type: 'info',
    });
  }
  return reminders;
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

function getMoonPhase(date: Date) {
  const cyclePosition = ((date.getTime() - KNOWN_NEW_MOON) / 86_400_000 % LUNAR_CYCLE_DAYS + LUNAR_CYCLE_DAYS)
    % LUNAR_CYCLE_DAYS / LUNAR_CYCLE_DAYS;
  const phaseNames = [
    'New moon',
    'Waxing crescent',
    'First quarter',
    'Waxing gibbous',
    'Full moon',
    'Waning gibbous',
    'Last quarter',
    'Waning crescent',
  ];
  const phaseIndex = Math.floor((cyclePosition + 1 / 16) * 8) % 8;

  return {
    name: phaseNames[phaseIndex],
    illumination: Math.round((1 - Math.cos(cyclePosition * Math.PI * 2)) * 50),
    shadowOffset: cyclePosition <= 0.5
      ? -80 * cyclePosition
      : 80 * (1 - cyclePosition),
  };
}

function MoonPhaseIcon({ phase }: { phase: ReturnType<typeof getMoonPhase> }) {
  const clipId = 'moon-phase-icon-clip';

  return (
    <svg viewBox="0 0 48 48" className="h-16 w-16 shrink-0 drop-shadow-md" role="img" aria-label={`${phase.name}, ${phase.illumination}% illuminated`}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="24" cy="24" r="20" />
        </clipPath>
      </defs>
      <circle cx="24" cy="24" r="20" fill="#172b4d" />
      <circle
        cx={24 + phase.shadowOffset}
        cy="24"
        r="20"
        fill="#f3f6ff"
        clipPath={`url(#${clipId})`}
      />
      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  );
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
  const nearLowTide = tide !== null && (
    (tide.previousExtreme.type === 'low' && tide.percentageBetween < 50)
    || (tide.nextExtreme.type === 'low' && tide.percentageBetween >= 50)
  );
  const highTide = tide !== null && tide.currentHeight >= 1.8;
  const reasons = {
    storm: storm ? 'thunderstorm' : null,
    rain: rain ? 'rain' : null,
    waves: roughWaves ? `waves ${weather.waveHeight?.toFixed(1)} m` : null,
    swell: weather.swellHeight !== null && weather.swellHeight >= 1.2
      ? `swell ${weather.swellHeight.toFixed(1)} m`
      : null,
    wind: strongWind ? `wind ${weather.windSpeed.toFixed(0)} km/h` : null,
    tide: nearLowTide
      ? `tide ${tide?.status.toLowerCase()} (${tide?.currentHeight.toFixed(1)} m estimate)`
      : highTide ? 'high tide' : null,
  };
  const makeAssessment = (activity: string, signals: (string | null)[]) => {
    const activeSignals = signals.filter((signal): signal is string => Boolean(signal));
    const caution = activeSignals.length > 0;
    const limitedData = weather.waveHeight === null || weather.swellHeight === null || tide === null;
    return {
      activity,
      status: caution ? 'Use caution' : limitedData ? 'Limited data' : 'No warning detected',
      statusStyle: caution
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        : limitedData
          ? 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
          : 'bg-blue-100 text-[#1F3F74] dark:bg-blue-950/60 dark:text-blue-300',
      note: caution
        ? `Current readings: ${activeSignals.join(', ')}. Follow resort boundaries and ask staff before entering the water.`
        : limitedData
          ? 'Some readings are unavailable, so this guidance may be incomplete. Follow resort signs and ask staff.'
          : 'No warning was detected in the available readings. This is not a safety guarantee; follow resort signs and staff.',
    };
  };

  return [
    makeAssessment('Swimming', [reasons.storm, reasons.rain, reasons.waves, strongWind ? reasons.wind : null]),
    makeAssessment('Snorkeling', [reasons.storm, reasons.rain, reasons.waves, reasons.swell]),
    makeAssessment('Shoreline walking', [reasons.storm, reasons.wind, reasons.tide]),
    makeAssessment('Kayaking & boating', [reasons.storm, reasons.wind, reasons.waves, reasons.swell, nearLowTide ? reasons.tide : null]),
  ];
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tideExtremes, setTideExtremes] = useState<TideExtreme[]>([]);
  const [tideAttribution, setTideAttribution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [liveNow, setLiveNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateClock = () => setLiveNow(new Date());
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    const loadConditions = async () => {
      const [weatherResult, tideResult] = await Promise.allSettled([
        fetch(`/api/weather?lat=${BINONGKALAN_LATITUDE}&lon=${BINONGKALAN_LONGITUDE}`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) {
              const result = await response.json().catch(() => null);
              throw new Error(result?.error || 'Weather data is unavailable.');
            }
            return response.json() as Promise<WeatherData>;
          }),
        fetch(`/api/tides?lat=${BINONGKALAN_LATITUDE}&lon=${BINONGKALAN_LONGITUDE}`, { cache: 'no-store' })
          .then(async (response) => {
            const result = await response.json().catch(() => null);
            if (!response.ok) throw new Error(result?.error || 'Tide data is unavailable.');
            return result;
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
        setTideAttribution(
          typeof tideResult.value.copyright === 'string' ? tideResult.value.copyright : null
        );
      } else {
        setTideExtremes([]);
        setTideAttribution(null);
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
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const now = liveNow ?? new Date();
  const manilaTimeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const currentHour = Number(manilaTimeParts.find((part) => part.type === 'hour')?.value);
  const currentMinutes = currentHour * 60 + Number(manilaTimeParts.find((part) => part.type === 'minute')?.value);
  const currentTide = calculateCurrentTide(tideExtremes, now);
  const timeOfDay = currentHour >= 4 && currentHour < 6
    ? 'dawn'
    : currentHour >= 6 && currentHour < 12
      ? 'morning'
      : currentHour >= 12 && currentHour < 17
        ? 'afternoon'
        : currentHour >= 17 && currentHour < 20
          ? 'evening'
          : 'midnight';
  const sunriseMinutes = weather?.sunrise ? Number(weather.sunrise.slice(11, 13)) * 60 + Number(weather.sunrise.slice(14, 16)) : null;
  const sunsetMinutes = weather?.sunset ? Number(weather.sunset.slice(11, 13)) * 60 + Number(weather.sunset.slice(14, 16)) : null;
  const daylightProgress = sunriseMinutes !== null && sunsetMinutes !== null && sunsetMinutes > sunriseMinutes
    ? Math.max(0, Math.min(1, (currentMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes)))
    : null;
  const moonPhase = getMoonPhase(now);
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
  const pageBackgrounds = {
    dawn: [
      'radial-gradient(ellipse at 82% 18%, rgba(255, 191, 128, 0.75), transparent 28%)',
      'linear-gradient(180deg, #716b9c 0%, #d295a0 38%, #f5c59b 70%, #b8dce2 100%)',
    ],
    morning: [
      'radial-gradient(circle at 84% 12%, rgba(255, 226, 145, 0.8), transparent 21%)',
      'linear-gradient(180deg, #82c9eb 0%, #b8e3f2 42%, #e8f4ef 76%, #a7d6df 100%)',
    ],
    afternoon: [
      'radial-gradient(circle at 78% 8%, rgba(255, 235, 160, 0.85), transparent 20%)',
      'linear-gradient(180deg, #55b4df 0%, #9cdaea 42%, #e0f3ed 77%, #93cad9 100%)',
    ],
    evening: [
      'radial-gradient(ellipse at 82% 18%, rgba(255, 174, 112, 0.7), transparent 27%)',
      'linear-gradient(180deg, #465b86 0%, #a66f86 42%, #edaa8a 72%, #789bad 100%)',
    ],
    midnight: nightSkyBackground,
  } satisfies Record<string, string[]>;
  const pageBackgroundStyle = { backgroundImage: pageBackgrounds[timeOfDay].join(', ') };
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
  const activityAssessments = getActivityAssessments(weather, currentTide);

  if (loading) {
    return (
      <div className={`relative isolate min-h-[calc(100vh-4rem)] bg-cover bg-center bg-scroll px-4 py-8 text-slate-900 dark:text-zinc-100 sm:bg-fixed sm:px-6 lg:px-8 ${timeOfDay === 'midnight' ? 'bg-[length:100%_100%]' : ''}`} style={pageBackgroundStyle} aria-busy="true" aria-label="Loading coastal conditions">
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
    <div className={`relative isolate min-h-screen bg-cover bg-center bg-scroll text-slate-900 transition-colors duration-200 dark:text-zinc-100 sm:bg-fixed ${timeOfDay === 'midnight' ? 'bg-[length:100%_100%]' : ''}`} style={pageBackgroundStyle}>
      {timeOfDay === 'midnight' && (
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
        
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-full min-w-0 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.75)]">
              Barangay Binongkalan
            </h1>
            <p className="mt-1 flex flex-col items-center justify-center gap-0.5 text-sm font-medium leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.75)] sm:flex-row sm:gap-1.5">
              <span>Catmon, Cebu</span>
              <span className="hidden text-white/80 sm:inline">•</span>
              <span className="font-mono text-xs text-white/90">
                {BINONGKALAN_LATITUDE.toFixed(4)}° N, {BINONGKALAN_LONGITUDE.toFixed(4)}° E
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center text-sm font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]">
            <span className="text-center">
              {formatDate(now)} · <time dateTime={now.toISOString()}>{formatTime(now)}</time>
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
            
            <div className="flex items-center justify-center gap-0 sm:gap-1 lg:justify-start">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24">
                <div className="absolute inset-2 rounded-full bg-white/10 blur-xl" />
                <WeatherIcon
                  code={weather?.weatherCode ?? 2}
                  isNight={isNight}
                  className="relative z-10 h-16 w-16 drop-shadow-[0_8px_18px_rgba(15,35,60,0.28)] sm:h-20 sm:w-20"
                />
                {isNight && (
                  <>
                    <StarSparkle className="absolute right-2 top-1 h-3 w-3 text-blue-100 animate-pulse" />
                    <StarSparkle className="absolute bottom-3 left-2 h-2.5 w-2.5 text-amber-100 animate-pulse delay-700" />
                    <StarSparkle className="absolute left-5 top-4 h-2 w-2 text-white/80 animate-pulse" />
                  </>
                )}
              </div>

              <div className="-ml-4 space-y-0.5 sm:-ml-5">
                <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {weather ? `${weather.temperature.toFixed(1)}°C` : '--'}
                </div>
                <div className="text-sm sm:text-base text-white/90 font-medium">
                  {weather?.conditionLabel || 'Current conditions unavailable'}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5 lg:w-auto lg:gap-3">
              
              {/* Feels like */}
              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Feels like</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather ? `${(weather.heatIndex?.heatIndexCelsius ?? weather.temperature).toFixed(1)}°C` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/65">Heat index</div>
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

              {/* Humidity */}
              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="flex items-center gap-1.5 text-white/75 text-xs">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Humidity</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather ? `${weather.relativeHumidity}%` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/65">Relative humidity</div>
              </div>

              {/* UV Index */}
              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="text-xs text-white/75">UV Index</div>
                <div className="text-base sm:text-lg font-bold text-white mt-1">
                  {weather?.uvIndex != null ? weather.uvIndex.toFixed(1) : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/65">
                  {weather?.uvIndex == null ? 'Current UV unavailable' : weather.uvIndex >= 6 ? 'High exposure' : 'Current UV'}
                </div>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur-xl transition-colors hover:bg-white/20">
                <div className="text-xs text-blue-100">Air quality estimate</div>
                <div className={`mt-1 text-base font-bold sm:text-lg ${weather?.airQuality ? getAirQualityColor(weather.airQuality.usAqi) : 'text-white'}`}>
                  {weather?.airQuality ? `AQI ${weather.airQuality.usAqi}` : 'Unavailable'}
                </div>
                <div className="text-[10px] text-white/75">
                  {weather?.airQuality
                    ? `${getAirQualityLabel(weather.airQuality.usAqi)} · Catmon model`
                    : 'Model data unavailable'}
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

        <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-2">
          <section className="glass-card space-y-3 rounded-3xl p-4 shadow-lg shadow-slate-200/40 dark:shadow-black/10 sm:p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F3F74] dark:text-white">4-day forecast</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily conditions for Barangay Binongkalan</p>
            </div>

            <div className="mt-3 space-y-2.5">
              {weather?.dailyForecast.length ? weather.dailyForecast.map((day) => {
                const date = new Date(`${day.date}T12:00:00+08:00`);
                return (
                  <div key={day.date} className="grid grid-cols-[3rem_2.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/20 bg-gradient-to-r from-[#2f80bd]/90 to-[#55a9db]/85 px-2 py-3 text-white shadow-sm backdrop-blur-md sm:grid-cols-[4rem_3rem_minmax(0,1fr)_auto] sm:gap-3 sm:px-3">
                    <div className="shrink-0 text-center">
                      <div className="text-xs font-bold uppercase text-white">
                        {date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short' }).toUpperCase()}
                      </div>
                      <div className="mt-0.5 text-[10px] text-white/75">
                        {date.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <WeatherIcon code={day.weatherCode} className="h-8 w-8 justify-self-center drop-shadow-sm sm:h-9 sm:w-9" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-white">{day.conditionLabel}</div>
                      <div className="mt-1 flex flex-wrap gap-x-2.5 text-[10px] text-white/80">
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-sky-100" />
                          {day.precipitationProbability == null ? 'Rain —' : `Rain ${day.precipitationProbability}%`}
                        </span>
                        <span>UV {day.uvIndexMax == null ? '—' : day.uvIndexMax.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-lg font-bold text-white">{day.high.toFixed(0)}°</span>
                      <span className="ml-1.5 text-xs text-white/75">{day.low.toFixed(0)}°</span>
                    </div>
                  </div>
                );
              }) : (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-neutral-900/60 dark:text-slate-400">
                  The four-day forecast is unavailable from the weather service right now.
                </p>
              )}
            </div>
          </section>

          <TideCard extremes={tideExtremes} attribution={tideAttribution} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <section className="glass-card rounded-3xl p-4 shadow-sm backdrop-blur-xl sm:p-5" aria-label="Sunrise and sunset">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1F3F74] dark:text-white">
              <Sun className="h-4 w-4 text-amber-500" />
              <h2>Sunrise &amp; sunset</h2>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <Sunrise className="mb-1 h-5 w-5 text-amber-500" />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sunrise</div>
                <div className="text-base font-bold text-slate-800 dark:text-white">{formatWeatherTime(weather?.sunrise ?? null)}</div>
              </div>
              <div className="text-right">
                <Sunset className="mb-1 ml-auto h-5 w-5 text-orange-500" />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sunset</div>
                <div className="text-base font-bold text-slate-800 dark:text-white">{formatWeatherTime(weather?.sunset ?? null)}</div>
              </div>
            </div>
            <div className="relative mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-700" aria-label={daylightProgress === null ? 'Daylight progress unavailable' : `${Math.round(daylightProgress * 100)} percent through daylight`}>
              {daylightProgress !== null && (
                <>
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400" style={{ width: `${daylightProgress * 100}%` }} />
                  <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400 shadow dark:border-slate-900" style={{ left: `${daylightProgress * 100}%` }} />
                </>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500 dark:text-slate-400">
              {daylightProgress === null ? 'Daylight progress unavailable' : isNight ? 'Nighttime in Binongkalan' : 'Today’s daylight'}
            </p>
          </section>

          <section className="glass-card flex items-center gap-4 rounded-3xl p-4 shadow-sm backdrop-blur-xl sm:p-5" aria-label="Moon phase and moonrise and moonset">
            <MoonPhaseIcon phase={moonPhase} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[#1F3F74] dark:text-white">{moonPhase.name}</div>
              <div className="mb-3 text-[10px] text-slate-500 dark:text-slate-400">{moonPhase.illumination}% illuminated</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Moonrise</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{formatWeatherTime(weather?.moonrise ?? null)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Moonset</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{formatWeatherTime(weather?.moonset ?? null)}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-2">
          <section className="glass-card min-w-0 space-y-3 rounded-3xl p-4 sm:p-5">
            <div>
              <div className="mb-1 flex items-start gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1F3F74] dark:text-white">Beach Activity Feasibility</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These are just safety announcements, kindly ask resort staff for the latest information.
              </p>
            </div>

            <div className="space-y-2">
              {activityAssessments.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:bg-neutral-900/60 dark:text-slate-400">
                  Activity guidance is unavailable until current weather data loads.
                </p>
              ) : activityAssessments.map((item) => (
                <div key={item.activity} className="flex flex-col gap-2 rounded-xl border border-white/50 bg-white/35 p-3 backdrop-blur-md dark:border-white/5 dark:bg-black/20 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3.5">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.activity}</div>
                    <div className="mt-0.5 break-words text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.note}</div>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.statusStyle}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card space-y-3 rounded-3xl p-4 shadow-lg shadow-slate-200/40 dark:shadow-black/10 sm:p-5">
            <div>
              <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-[#1F3F74] dark:text-white">Coastal Reminders</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Advisories are based on current weather and tidal readings.
              </p>
            </div>

            <div className="space-y-2">
              {(weather ? generateReminders(weather, currentTide) : []).map((reminder, index) => (
                <div
                  key={`${reminder.type}-${index}`}
                  className={`rounded-xl border-l-4 px-3 py-2.5 ${
                    reminder.type === 'alert'
                      ? 'border-red-500 bg-red-50/65 text-red-900 backdrop-blur-md dark:bg-red-950/35 dark:text-red-300'
                      : reminder.type === 'warning'
                        ? 'border-amber-400 bg-amber-50/65 text-amber-900 backdrop-blur-md dark:bg-amber-950/35 dark:text-amber-300'
                        : 'border-sky-500 bg-white/45 text-slate-700 backdrop-blur-md dark:bg-black/25 dark:text-neutral-300'
                  }`}
                >
                  <p className="text-xs font-medium leading-relaxed">{reminder.text}</p>
                </div>
              ))}
              {!weather && (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-neutral-900/60 dark:text-slate-400">
                  Coastal reminders are unavailable until live weather data loads.
                </p>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
