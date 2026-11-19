'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CloudSun,
  Sun,
  CloudRain,
  Cloud,
  Compass,
  AlertCircle,
  Thermometer,
  Umbrella,
  Wind,
  CheckCircle2,
} from 'lucide-react';
import type { DailyForecast, WeatherData } from '@/lib/services/weather';

interface BeachTripPlannerProps {
  beachName: string;
  latitude: number | null;
  longitude: number | null;
}

export function BeachTripPlanner({ beachName, latitude, longitude }: BeachTripPlannerProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const lat = latitude ?? 10.6865;
  const lon = longitude ?? 124.0152;

  useEffect(() => {
    let active = true;
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error('Forecast unavailable');
        const data = await res.json();
        if (active) {
          setWeatherData(data);
        }
      } catch {
        if (active) setWeatherData(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchForecast();
    return () => {
      active = false;
    };
  }, [lat, lon]);

  // Restrict to strict 4-day forecast max
  const fourDays: DailyForecast[] = weatherData?.dailyForecast ? weatherData.dailyForecast.slice(0, 4) : [];

  const formatDayName = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return `Day ${idx + 1}`;
    }
  };

  const getWeatherIcon = (code: number, rainProb: number | null) => {
    if ((rainProb && rainProb > 50) || (code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return <CloudRain className="w-5 h-5 text-sky-500" />;
    }
    if (code === 0 || code === 1) {
      return <Sun className="w-5 h-5 text-amber-500" />;
    }
    if (code === 2) {
      return <CloudSun className="w-5 h-5 text-amber-400" />;
    }
    return <Cloud className="w-5 h-5 text-slate-400" />;
  };

  const getBeachAdvice = (day: DailyForecast | undefined) => {
    if (!day) return 'Check local advisories before swimming.';
    const rain = day.precipitationProbability ?? 0;
    if (rain >= 60) {
      return 'Expect frequent coastal showers. Bring rain gear and verify cottage shelter before traveling.';
    }
    if (rain >= 30) {
      return 'Passing coastal clouds and isolated light showers. Still great for day trips, keep sunscreen and cover ready.';
    }
    if (day.high >= 33) {
      return 'High tropical sun. Perfect for swimming and snorkeling; stay hydrated and bring sun protection.';
    }
    return 'Clear skies and pleasant breeze. Prime conditions for beach walking, swimming, and seaside relaxing.';
  };

  const selectedDay = fourDays[selectedDayIndex];

  return (
    <section
      aria-label="Beach Day Planner"
      className="mt-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap pb-4 border-b border-slate-100 dark:border-neutral-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1F3F74]/10 dark:bg-sky-950/60 text-[#1F3F74] dark:text-sky-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Beach Day Planner &bull; {beachName}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-9">
            Pick a date to check forecasted temperature, rain risk, and swimming conditions.
          </p>
        </div>

        {/* 4-Day Notice Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>4-Day Forecast Window</span>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#1F3F74] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Checking marine and atmospheric forecast...</p>
        </div>
      ) : fourDays.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Forecast currently unavailable. Please check the general Weather page.
        </div>
      ) : (
        <div className="pt-4 space-y-4">
          
          {/* Day Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fourDays.map((day, idx) => {
              const isActive = selectedDayIndex === idx;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isActive
                      ? 'border-[#1F3F74] dark:border-[#4987BA] bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-[#1F3F74]/20'
                      : 'border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-bold ${isActive ? 'text-[#1F3F74] dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {formatDayName(day.date, idx)}
                    </span>
                    {getWeatherIcon(day.weatherCode, day.precipitationProbability)}
                  </div>
                  
                  <div className="flex items-baseline justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {Math.round(day.high)}°C
                    </span>
                    <span>{Math.round(day.low)}°C</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Detailed Breakdown */}
          {selectedDay && (
            <div className="rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center shadow-xs">
                    {getWeatherIcon(selectedDay.weatherCode, selectedDay.precipitationProbability)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {selectedDay.conditionLabel || 'Fair Tropical Conditions'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Forecast for {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>High: {Math.round(selectedDay.high)}°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Umbrella className="w-3.5 h-3.5 text-sky-500" />
                    <span>Rain: {selectedDay.precipitationProbability ?? 15}%</span>
                  </div>
                </div>
              </div>

              {/* Beach Condition Recommendation */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-neutral-700/60 flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>Trip Recommendation:</strong> {getBeachAdvice(selectedDay)}
                </p>
              </div>
            </div>
          )}

          {/* 4-Day Strict Boundary Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-900 dark:text-amber-200/90 flex items-start gap-2 leading-relaxed">
            <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Pahibalo sa Forecast Window:</strong> Ang weather forecast kutob lamang sa <strong>4 ka adlaw</strong> (4 days). Ang atmospheric ug marine wave models lapas sa upat ka adlaw dili pa 100% kasaligan alang sa coastal navigation ug paglangoy. Palihog balik susi 2–3 ka adlaw sa dili pa inyong biyahe.
            </span>
          </div>

        </div>
      )}
    </section>
  );
}
