'use client';

import React, { useState } from 'react';
import { Calendar, BarChart3 } from 'lucide-react';

export interface AnalyticsPoint {
  date: string;
  visitors: number;
}

export function AnalyticsBarChart({
  title,
  points,
}: {
  title: string;
  points: AnalyticsPoint[];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const peak = Math.max(1, ...points.map((point) => point.visitors));
  const total = points.reduce((sum, point) => sum + point.visitors, 0);
  const avg = Math.round(total / Math.max(1, points.length));

  // Find peak day
  const peakPoint = points.reduce(
    (max, p) => (p.visitors > max.visitors ? p : max),
    points[0] || { date: '', visitors: 0 }
  );

  const peakDayName = peakPoint?.date
    ? new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${peakPoint.date}T12:00:00`))
    : 'N/A';

  return (
    <section aria-label={title} className="space-y-6">
      {/* Chart Header with Metrics Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-white font-sans">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Daily verified tourist visits and discovery traffic to your resort listing.
          </p>
        </div>

        {/* Legend-style Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1F3F74] dark:bg-[#38BDF8]" />
            <span className="text-slate-600 dark:text-neutral-400">Peak Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-neutral-600" />
            <span className="text-slate-600 dark:text-neutral-400">Regular Day</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas with Enhanced Grid Lines */}
      <div className="relative pt-8 pb-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-neutral-900/30 rounded-2xl">
        {/* Enhanced Horizontal Grid Lines */}
        <div className="absolute inset-0 top-8 bottom-12 flex flex-col justify-between pointer-events-none">
          <div className="border-b border-slate-200 dark:border-neutral-800 w-full" />
          <div className="border-b border-slate-200 dark:border-neutral-800 w-full" />
          <div className="border-b border-slate-300 dark:border-neutral-700 w-full" />
        </div>

        <ol
          className="relative grid h-56 grid-cols-7 items-end gap-2 sm:gap-3 px-4"
          aria-label="Daily visitor counts"
        >
          {points.map((point, index) => {
            const day = new Date(`${point.date}T12:00:00`);
            const label = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day);
            const formattedDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(day);
            const height = point.visitors === 0 ? 4 : Math.max(12, (point.visitors / peak) * 100);
            const isHovered = hoveredIndex === index;
            const isPeak = point.visitors === peak;

            return (
              <li
                key={point.date}
                className="relative flex h-full min-w-0 flex-col items-center justify-end gap-2 group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1F3F74] to-[#4987BA] text-white text-[11px] font-bold shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {point.visitors} visit{point.visitors !== 1 ? 's' : ''} &bull; {formattedDate}
                  </div>
                )}

                {/* Number above bar */}
                <span className={`text-[11px] tabular-nums font-bold transition-all duration-200 ${
                  isHovered || isPeak
                    ? 'text-[#1F3F74] dark:text-[#4987BA] scale-110'
                    : 'text-slate-500 dark:text-neutral-400'
                }`}>
                  {point.visitors}
                </span>

                {/* Enhanced Bar with Gradient and Glow */}
                <div
                  className={`w-full max-w-14 rounded-t-2xl transition-all duration-300 ease-out ${
                    isHovered
                      ? 'bg-gradient-to-t from-[#1F3F74] via-[#2a5a9a] to-sky-400 shadow-lg shadow-[#1F3F74]/20 scale-y-105'
                      : isPeak
                      ? 'bg-gradient-to-t from-[#1F3F74] via-[#2a5a9a] to-[#4987BA] shadow-md shadow-[#1F3F74]/15'
                      : 'bg-gradient-to-t from-slate-400 via-slate-300 to-slate-200 dark:from-neutral-600 dark:via-neutral-500 dark:to-neutral-400 opacity-70 group-hover:opacity-90'
                  }`}
                  style={{ height: `${height}%` }}
                  role="img"
                  aria-label={`${label}: ${point.visitors} visitors`}
                />

                {/* Day Label */}
                <div className="text-center pt-1.5">
                  <span className={`text-xs font-bold block transition-colors ${
                    isHovered || isPeak
                      ? 'text-[#1F3F74] dark:text-[#4987BA]'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}>
                    {label}
                  </span>
                  <span className="text-[9.5px] text-slate-400 dark:text-neutral-500 block">
                    {formattedDate.split(' ')[1]}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
