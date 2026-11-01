'use client';

import React, { useState } from 'react';
import { TrendingUp, Calendar, Eye } from 'lucide-react';

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
          <h2 className="text-base sm:text-lg font-bold text-[#1F3F74] dark:text-[#4987BA] font-sans flex items-center gap-2">
            <Eye className="w-4.5 h-4.5 text-[#1F3F74] dark:text-[#4987BA]" />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Daily verified tourist visits and discovery traffic to your resort listing.
          </p>
        </div>

        {/* 3 Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[#1F3F74] dark:text-[#4987BA] font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{total} Total Visits</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold flex items-center gap-1.5">
            <span>~{avg}/day</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>Peak: {peakDayName} ({peakPoint.visitors})</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas with Subtle Grid Lines */}
      <div className="relative pt-6 pb-2">
        {/* Subtle Horizontal Grid Lines */}
        <div className="absolute inset-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40 dark:opacity-20">
          <div className="border-b border-dashed border-slate-300 dark:border-neutral-700 w-full" />
          <div className="border-b border-dashed border-slate-300 dark:border-neutral-700 w-full" />
          <div className="border-b border-slate-200 dark:border-neutral-800 w-full" />
        </div>

        <ol
          className="relative grid h-48 grid-cols-7 items-end gap-3 sm:gap-4 px-2"
          aria-label="Daily visitor counts"
        >
          {points.map((point, index) => {
            const day = new Date(`${point.date}T12:00:00`);
            const label = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day);
            const formattedDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(day);
            const height = point.visitors === 0 ? 4 : Math.max(10, (point.visitors / peak) * 100);
            const isHovered = hoveredIndex === index;

            return (
              <li
                key={point.date}
                className="relative flex h-full min-w-0 flex-col items-center justify-end gap-1.5 group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 z-20 px-2.5 py-1 rounded-lg bg-[#1F3F74] text-white text-[10.5px] font-bold shadow-lg whitespace-nowrap animate-in fade-in duration-150">
                    {point.visitors} visit{point.visitors !== 1 ? 's' : ''} &bull; {formattedDate}
                  </div>
                )}

                {/* Number above bar */}
                <span className={`text-[11px] tabular-nums font-bold transition-colors ${
                  isHovered
                    ? 'text-[#1F3F74] dark:text-[#4987BA]'
                    : 'text-slate-500 dark:text-neutral-400'
                }`}>
                  {point.visitors}
                </span>

                {/* Modern Bar */}
                <div
                  className={`w-full max-w-12 rounded-t-xl transition-all duration-300 ${
                    isHovered
                      ? 'bg-gradient-to-t from-[#1F3F74] to-sky-500 shadow-md scale-x-105'
                      : 'bg-gradient-to-t from-[#1F3F74] to-[#4987BA] opacity-90 group-hover:opacity-100'
                  }`}
                  style={{ height: `${height}%` }}
                  role="img"
                  aria-label={`${label}: ${point.visitors} visitors`}
                />

                {/* Day Label */}
                <div className="text-center pt-1">
                  <span className={`text-xs font-bold block transition-colors ${
                    isHovered
                      ? 'text-[#1F3F74] dark:text-[#4987BA]'
                      : 'text-slate-700 dark:text-neutral-300'
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
