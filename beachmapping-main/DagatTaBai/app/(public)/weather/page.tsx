'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Waves,
  Wind,
  Droplets,
  Sun,
  Compass,
  ArrowRight,
  ShieldCheck,
  Eye,
  Umbrella,
  Sun as SunIcon,
  FlaskConical,
  Cloud,
  CloudRain,
  CloudSun,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Home,
  Camera,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Search,
  Bell,
  ChevronDown,
  Moon,
  ArrowUpRight,
  ArrowRight as ArrowRightIcon,
} from 'lucide-react';
import type { WeatherData } from '@/lib/services/weather';
import { calculateCurrentTide, type CurrentTideState, type TideExtreme } from '@/lib/services/tide-interpolation';
import type { BeachRecord } from '@/lib/db/beaches';
import TideCard from '@/components/TideCard';

// Helper to convert wind direction degrees to compass direction
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Helper to get weather icon based on weather code
function getWeatherIcon(weatherCode: number) {
  if (weatherCode >= 51 && weatherCode <= 67) return Droplets; // Rain/Drizzle
  if (weatherCode >= 95) return Droplets; // Thunderstorm
  if (weatherCode >= 45 && weatherCode <= 48) return Sun; // Fog
  return Sun; // Clear/Cloudy
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
      text: 'Perfect time for sunrise photography and beach walks',
      type: 'info',
    });
    reminders.push({
      icon: FlaskConical,
      text: 'Start your day hydrated - bring water for morning activities',
      type: 'info',
    });
  } else if (isNight) {
    reminders.push({
      icon: Moon,
      text: 'Great time for evening stargazing and bonfire activities',
      type: 'info',
    });
    reminders.push({
      icon: ShieldCheck,
      text: 'Bring a light jacket - evening breeze can be cool',
      type: 'info',
    });
    reminders.push({
      icon: AlertCircle,
      text: 'Stay near well-lit areas for safety',
      type: 'warning',
    });
  } else if (isAfternoon) {
    reminders.push({
      icon: SunIcon,
      text: 'Peak sun hours - seek shade and stay hydrated',
      type: 'warning',
    });
  }

  // Rain/Drizzle reminders
  if (weather.weatherCode >= 51 && weather.weatherCode <= 67) {
    reminders.push({
      icon: Umbrella,
      text: 'Bring umbrella or rain gear',
      type: 'warning',
    });
  }

  // Thunderstorm alert
  if (weather.weatherCode >= 95) {
    reminders.push({
      icon: AlertTriangle,
      text: 'Seek shelter - thunderstorm conditions',
      type: 'alert',
    });
  }

  // Hot weather sunscreen reminder (lowered to 25°C) - only for morning/afternoon
  if (!isNight && weather.temperature >= 25) {
    reminders.push({
      icon: SunIcon,
      text: 'Apply sunblock/sunscreen regularly',
      type: 'warning',
    });
  }

  // UV protection reminder for clear/partly cloudy (lowered threshold to 20°C) - only for morning/afternoon
  if (!isNight && weather.weatherCode <= 2 && weather.temperature >= 20) {
    reminders.push({
      icon: Sun,
      text: 'Wear sunglasses and hat for UV protection',
      type: 'info',
    });
  }

  // Hydration reminder for hot weather (lowered threshold to 25°C) - only for morning/afternoon
  if (!isNight && (weather.temperature >= 25 || (weather.heatIndex && weather.heatIndex.heatIndexCelsius >= 28))) {
    reminders.push({
      icon: FlaskConical,
      text: 'Stay hydrated - bring plenty of water',
      type: 'warning',
    });
  }

  // Fog/low visibility reminder
  if (weather.weatherCode >= 45 && weather.weatherCode <= 48) {
    reminders.push({
      icon: Cloud,
      text: 'Low visibility - use caution near water',
      type: 'warning',
    });
  }

  // Low tide sandbar window reminder
  if (currentTide && currentTide.currentHeight < 0.8) {
    reminders.push({
      icon: Waves,
      text: 'Low tide - great time for sandbar activities',
      type: 'info',
    });
  }

  // Swimming safety based on tide
  if (currentTide && currentTide.currentHeight > 1.5) {
    reminders.push({
      icon: ShieldCheck,
      text: 'High tide - swim with caution near shore',
      type: 'warning',
    });
  }

  // General beach safety reminder (always show if no other alerts)
  if (reminders.length === 0) {
    reminders.push({
      icon: ShieldCheck,
      text: 'Conditions are favorable - enjoy your beach visit safely',
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
          setDataError('No active beach locations are available yet.');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load beaches for weather:', err);
        setDataError('Could not load beach locations.');
        setLoading(false);
      });
  }, []);

  const selectedBeach = beaches.find((b) => b.id === selectedBeachId) || beaches[0] || null;

  useEffect(() => {
    if (!selectedBeach) return;
    setLoading(true);

    setDataError(null);
    const loadConditions = async () => {
      const [weatherResult, tideResult] = await Promise.allSettled([
        fetch(`/api/weather?lat=${selectedBeach.latitude}&lon=${selectedBeach.longitude}`, { cache: 'no-store' })
          .then(async (response) => {
            if (!response.ok) throw new Error('Weather data is unavailable.');
            return response.json() as Promise<WeatherData>;
          }),
        fetch(`/api/tides?lat=${selectedBeach.latitude}&lon=${selectedBeach.longitude}`, { cache: 'no-store' })
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

      const errors = [weatherResult, tideResult]
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason instanceof Error ? result.reason.message : 'Some marine readings are unavailable.');
      setDataError(errors.length ? errors.join(' ') : null);
      setLoading(false);
    };

    void loadConditions();
  }, [selectedBeach]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setNow(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Barangay Binongkalan</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Camotes Sea, Cebu</p>
            </div>
          </div>

          {/* Right side - Last updated */}
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>Last updated, {formatDate(now)} · {formatTime(now)}</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {dataError && (
            <p role="status" className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {dataError}
            </p>
          )}

          {/* Current Conditions Banner */}
          <div className="bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-slate-900/30 rounded-2xl p-6 relative overflow-hidden border border-sky-200 dark:border-sky-800">
            {/* Wave pattern at bottom */}
            <div className="absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none">
              <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-20">
                <path d="M0,50 Q300,20 600,50 T1200,50 V100 H0 Z" fill="#0ea5e9" />
              </svg>
            </div>

            <div className="relative">
              {/* Main reading */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour >= 18 || hour < 6) return <Moon className="w-8 h-8 text-white" />;
                    return <Sun className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour >= 6 && hour < 12) return 'Morning Weather';
                      if (hour >= 12 && hour < 18) return 'Afternoon Weather';
                      return 'Evening Weather';
                    })()}
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {weather ? `${weather.temperature.toFixed(1)}°C` : '--'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {weather?.conditionLabel || 'Mostly Clear'}
                  </div>
                </div>
              </div>

              {/* Six stat columns with Good Conditions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4 mb-6">
                {[
                  { label: 'Air Temp', value: weather ? `${weather.temperature.toFixed(1)}°C` : '--', icon: Sun },
                  { label: 'Water Temp', value: weather?.waterTemperature ? `${weather.waterTemperature.toFixed(1)}°C` : '--', icon: Droplets },
                  { label: 'Wind', value: weather ? `${weather.windSpeed} km/h` : '--', detail: 'Light breeze', icon: Wind },
                  { label: 'Wave Height', value: weather?.swellHeight ? `${weather.swellHeight.toFixed(1)} m` : '--', detail: 'Calm', icon: Waves },
                  { label: 'Humidity', value: weather ? `${weather.relativeHumidity}%` : '--', icon: Droplets },
                  { label: 'UV Index', value: 'Moderate', detail: 'UV 5', icon: Sun },
                  { isGoodConditions: true },
                ].map((stat, i) => (
                  stat.isGoodConditions ? (
                    <div key={i} className="bg-emerald-500 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <CheckCircle2 className="w-5 h-5 text-white mb-1" />
                      <div className="font-bold text-white text-xs">Good Conditions</div>
                    </div>
                  ) : (
                    <div key={i} className={`flex items-center gap-2 ${i < 5 ? 'border-r border-slate-300 dark:border-slate-700 pr-4' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {stat.icon && <stat.icon className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{stat.label}</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{stat.value}</div>
                        {stat.detail && <div className="text-[10px] text-slate-500">{stat.detail}</div>}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Middle Row - 3 Cards (Tide + Today's Forecast + 4-Day Forecast) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tide Card */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="w-6 h-6 text-sky-600" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Tide</h2>
                  <p className="text-xs text-slate-500">Current water level and next tide</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Low Tide, {currentTide?.currentHeight.toFixed(1)} m (falling)
                    </span>
                  </div>
                </div>

                {currentTide?.nextExtreme && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        Next High Tide
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(currentTide.nextExtreme.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} · {currentTide.nextExtreme.height.toFixed(1)} m
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart */}
                <div className="h-40 relative">
                  <svg viewBox="0 0 300 160" className="w-full h-full">
                    {/* Grid lines */}
                    {[0, 0.5, 1.0, 1.5, 2.0].map((y, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={140 - (y / 2) * 120}
                        x2="300"
                        y2={140 - (y / 2) * 120}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Y-axis labels */}
                    {[0, 0.5, 1.0, 1.5, 2.0].map((y, i) => (
                      <text
                        key={i}
                        x="5"
                        y={140 - (y / 2) * 120 - 3}
                        className="text-[9px] fill-slate-400"
                      >
                        {y}m
                      </text>
                    ))}

                    {/* X-axis labels */}
                    {['12 PM', '6 PM', '12 AM', '6 AM', '12 PM'].map((label, i) => (
                      <text
                        key={i}
                        x={i * 75}
                        y="155"
                        className="text-[9px] fill-slate-400 text-center"
                        textAnchor="middle"
                      >
                        {label}
                      </text>
                    ))}

                    {/* Tide curve */}
                    <path
                      d="M0,80 Q75,120 150,80 T300,40"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2"
                    />
                    
                    {/* Area fill */}
                    <path
                      d="M0,80 Q75,120 150,80 T300,40 V160 H0 Z"
                      fill="#0ea5e9"
                      fillOpacity="0.1"
                    />

                    {/* Now marker */}
                    <g>
                      <circle cx="75" cy="120" r="3" fill="#22c55e" />
                      <line x1="75" y1="120" x2="75" y2="140" stroke="#22c55e" strokeWidth="1" strokeDasharray="3" />
                      <rect x="45" y="100" width="60" height="18" rx="3" fill="#22c55e" fillOpacity="0.9" />
                      <text x="75" y="112" className="text-[8px] fill-white text-center" textAnchor="middle" fontWeight="bold">Now {currentTide?.currentHeight.toFixed(1)} m</text>
                    </g>

                    {/* High tide marker */}
                    <g>
                      <circle cx="225" cy="40" r="3" fill="#0ea5e9" />
                      <line x1="225" y1="40" x2="225" y2="140" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3" />
                      <rect x="195" y="20" width="60" height="18" rx="3" fill="#0ea5e9" fillOpacity="0.9" />
                      <text x="225" y="32" className="text-[8px] fill-white text-center" textAnchor="middle" fontWeight="bold">High Tide 1.8 m</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Today's Forecast */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CloudSun className="w-6 h-6 text-sky-600" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Today's Forecast</h2>
                  <p className="text-xs text-slate-500">Partly cloudy skies with warm temperatures</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Max Temperature', value: weather ? `${(weather.temperature + 2).toFixed(0)}°C` : '--', icon: Sun },
                  { label: 'Min Temperature', value: weather ? `${(weather.temperature - 2).toFixed(0)}°C` : '--', icon: Sun },
                  { label: 'Chance of Rain', value: '10%', icon: Droplets },
                  { label: 'UV Index', value: 'Moderate (5)', icon: Sun },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-Day Forecast */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 text-sky-600" />
                <h2 className="font-bold text-slate-900 dark:text-white">4-Day Forecast</h2>
              </div>

              <div className="space-y-3">
                {[
                  { day: 'Thu, Apr 24', high: 29, low: 26, rain: 20, icon: CloudSun },
                  { day: 'Fri, Apr 25', high: 28, low: 25, rain: 40, icon: Cloud },
                  { day: 'Sat, Apr 26', high: 30, low: 26, rain: 10, icon: Sun },
                  { day: 'Sun, Apr 27', high: 31, low: 27, rain: 10, icon: Sun },
                ].map((day, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <day.icon className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{day.day}</div>
                      <div className="text-xs text-slate-500">{day.low}° / {day.high}°</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Droplets className="w-3 h-3" />
                      {day.rain}%
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row - 2 Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Conditions (wide) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="w-6 h-6 text-sky-600" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Activity Conditions</h2>
                  <p className="text-xs text-slate-500">Based on current weather and tide conditions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { activity: 'Swimming', status: 'Good', color: 'emerald', note: 'Calm waters, safe for swimming.', icon: ShieldCheck },
                  { activity: 'Snorkeling', status: 'Good', color: 'emerald', note: 'Good visibility, calm seas.', icon: ShieldCheck },
                  { activity: 'Diving', status: 'Caution', color: 'amber', note: 'May have stronger currents later today.', icon: AlertCircle },
                  { activity: 'Fishing', status: 'Good', color: 'emerald', note: 'Best in the morning or evening.', icon: ShieldCheck },
                  { activity: 'Sandbar', status: 'Good', color: 'emerald', note: 'Visible at low tide. Check tide schedule.', icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <item.icon size={14} />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.activity}</span>
                    </div>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${item.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips (narrower) */}
            <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Tips</h2>
                  <p className="text-xs text-slate-500">Simple reminders for a safer and better trip</p>
                </div>
              </div>

              <div className="space-y-3">
                {generateReminders(weather, currentTide).map((reminder, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                    reminder.type === 'alert' 
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                      : reminder.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      reminder.type === 'alert'
                        ? 'bg-red-100 text-red-600'
                        : reminder.type === 'warning'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-sky-100 text-sky-600'
                    }`}>
                      <reminder.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        reminder.type === 'alert'
                          ? 'text-red-900 dark:text-red-300'
                          : reminder.type === 'warning'
                          ? 'text-amber-900 dark:text-amber-300'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {reminder.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
