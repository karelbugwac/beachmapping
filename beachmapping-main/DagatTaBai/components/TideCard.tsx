'use client';

import React, { useState, useEffect, useId } from 'react';
import { Info } from 'lucide-react';
import { calculateCurrentTide, type TideExtreme } from '@/lib/services/tide-interpolation';

interface TideCardProps {
  extremes: TideExtreme[];
}

export default function TideCard({ extremes }: TideCardProps) {
  const [now, setNow] = useState<Date | null>(null);
  const clipId = useId().replace(/:/g, '');

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#121215] h-72 animate-pulse" />
    );
  }

  if (!extremes || extremes.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#121215]">
        <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
          Tide Status
        </h3>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading tide records for Catmon coast...</p>
      </div>
    );
  }

  // Sort extremes by time
  const sorted = [...extremes].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Get today's extremes in Manila timezone
  const manilaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const manilaToday = new Date(manilaNow.getFullYear(), manilaNow.getMonth(), manilaNow.getDate());
  const todayExtremes = sorted.filter((extreme) => {
    const extremeDate = new Date(new Date(extreme.time).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const extremeDay = new Date(extremeDate.getFullYear(), extremeDate.getMonth(), extremeDate.getDate());
    return extremeDay.getTime() === manilaToday.getTime();
  });

  // Find next tide (can be today or tomorrow)
  const nextTide = sorted.find((extreme) => new Date(extreme.time).getTime() > now.getTime());

  // Calculate current tide state
  const currentTide = calculateCurrentTide(sorted, now);

  // Format time in Manila timezone (12-hour with AM/PM)
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const manilaDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const hours = manilaDate.getHours();
    const minutes = manilaDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Calculate countdown to next tide
  const getCountdown = (isoString: string) => {
    const diff = new Date(isoString).getTime() - now.getTime();
    if (diff <= 0) return 'now';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `in ${minutes}m`;
    return `in ${hours}h ${minutes}m`;
  };

  const isRising = nextTide?.type === 'high';
  const tideLabel = isRising ? 'Rising Tide (Gataob)' : 'Receding Tide (Gahunas)';
  const tideAdvice = isRising
    ? 'Water is deepening towards high tide. Ideal for swimming.'
    : 'Water is shallowing towards low tide. Great for shoreline walking.';

  // Sample tide every 10 minutes from 00:00 to 24:00 Manila time
  const samples: { time: Date; height: number }[] = [];
  for (let i = 0; i <= 1440; i += 10) {
    const sampleTime = new Date(manilaToday);
    sampleTime.setHours(0, i, 0, 0);
    const sampleHeight = calculateCurrentTide(sorted, sampleTime)?.currentHeight ?? 0;
    samples.push({ time: sampleTime, height: sampleHeight });
  }

  // Calculate min/max for scaling
  const allHeights = [...samples.map((s) => s.height), ...todayExtremes.map((e) => e.height)];
  const lo = Math.min(...allHeights);
  const hi = Math.max(...allHeights);

  // SVG constants
  const W = 720;
  const H = 100;
  const TOP = 16;
  const BOT = 10;

  const x = (minutes: number) => (minutes / 1440) * W;
  const y = (height: number) => TOP + (H - TOP - BOT) * (1 - (height - lo) / (hi - lo || 1));

  const linePoints = samples.map((s) => {
    const minutes = s.time.getHours() * 60 + s.time.getMinutes();
    return `${x(minutes).toFixed(1)},${y(s.height).toFixed(1)}`;
  });
  const linePath = `M${linePoints.join(' L')}`;
  const areaPath = `${linePath} L${W} ${H} L 0 ${H} Z`;

  const nowMinutes = manilaNow.getHours() * 60 + manilaNow.getMinutes();
  const nowX = x(nowMinutes);
  const nowY = y(currentTide?.currentHeight ?? 0);

  return (
    <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs space-y-3">
      {/* Top Header: Waves icon removed, arrow removed from status pill */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-sm text-[#1F3F74] dark:text-white uppercase tracking-wider">
          Tide Status
        </h3>

        {/* Clean status pill without arrow */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            isRising
              ? 'bg-blue-100 text-[#1F3F74] dark:bg-blue-950/70 dark:text-sky-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
          }`}
        >
          {tideLabel}
        </span>
      </div>

      {/* Current Water Level & Next Tide */}
      <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-100 dark:border-neutral-800/80">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">Current Water Level</span>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currentTide ? `${currentTide.currentHeight.toFixed(1)} m` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">
            {currentTide && currentTide.currentHeight >= 0.9 ? 'Deep water (Taob)' : 'Shallow water (Hunas)'}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 font-medium">
            Next: {nextTide?.type === 'high' ? 'High Tide' : 'Low Tide'}
          </span>
          <div className="text-lg sm:text-xl font-extrabold text-[#1F3F74] dark:text-sky-300 tracking-tight">
            {nextTide ? formatTime(nextTide.time) : '--'}
          </div>
          <span className="text-[10px] text-slate-400">
            {nextTide ? `${getCountdown(nextTide.time)} · ${nextTide.height.toFixed(1)} m` : ''}
          </span>
        </div>
      </div>

      {/* Quick Beachgoer Tip */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 text-slate-600 dark:text-slate-300 text-[11px]">
        <Info className="w-3.5 h-3.5 text-[#1F3F74] dark:text-sky-400 flex-shrink-0" />
        <span>{tideAdvice}</span>
      </div>

      {/* 24-Hour Wave Cycle Curve (Compact height) */}
      <div className="relative h-[90px] pt-1">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id={`grad-dive-${clipId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1F3F74" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#1F3F74" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaPath} fill={`url(#grad-dive-${clipId})`} />

          {/* Stroke curve line */}
          <path
            d={linePath}
            fill="none"
            stroke="#1F3F74"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* High / Low Tide Marker Dots on Curve */}
        {todayExtremes.map((extreme, i) => {
          const extremeDate = new Date(new Date(extreme.time).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          const minutes = extremeDate.getHours() * 60 + extremeDate.getMinutes();
          const dotX = (minutes / 1440) * 100;
          const dotY = (y(extreme.height) / H) * 100;

          return (
            <div
              key={i}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-black shadow-xs cursor-help"
              style={{
                left: `${dotX}%`,
                top: `${dotY}%`,
                backgroundColor: extreme.type === 'high' ? '#1F3F74' : '#d97706',
              }}
              title={`${extreme.type === 'high' ? 'High Tide' : 'Low Tide'}: ${extreme.height.toFixed(1)}m at ${formatTime(extreme.time)}`}
            />
          );
        })}

        {/* Current Time ("Now") Marker */}
        <div
          className="absolute inset-y-0 flex -translate-x-1/2 flex-col items-center pointer-events-none"
          style={{ left: `${(nowMinutes / 1440) * 100}%` }}
        >
          <div className="rounded-full bg-[#1F3F74] px-1.5 py-0.2 text-[8px] font-bold text-white shadow-xs">
            Now
          </div>
          <div className="w-px flex-1 border-l border-dashed border-[#1F3F74]/60" />
        </div>

        {/* Current Level Dot on curve */}
        <div
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F3F74] ring-2 ring-white dark:ring-black shadow-xs pointer-events-none"
          style={{
            left: `${(nowMinutes / 1440) * 100}%`,
            top: `${(nowY / H) * 100}%`,
          }}
        />
      </div>

      {/* 24-Hour Timeline Labels */}
      <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>12 AM</span>
      </div>

      {/* Today's Schedule Row */}
      <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Today&apos;s Tide Schedule
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {todayExtremes.map((extreme, i) => {
            const isPassed = new Date(extreme.time).getTime() < now.getTime();
            const isNext = nextTide?.time === extreme.time;
            const time = formatTime(extreme.time);

            return (
              <div
                key={i}
                className={`rounded-lg border p-1.5 text-center transition-all ${
                  isPassed
                    ? 'opacity-40 bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
                    : isNext
                    ? 'border-[#1F3F74] ring-1 ring-[#1F3F74] bg-blue-50/50 dark:bg-[#1F3F74]/20'
                    : 'border-slate-200 bg-slate-50/60 dark:border-neutral-800 dark:bg-neutral-900'
                }`}
              >
                <div className="text-[9px] font-bold flex items-center justify-center gap-0.5">
                  {extreme.type === 'high' ? (
                    <span className="text-[#1F3F74] dark:text-sky-300">High</span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">Low</span>
                  )}
                  {isNext && <span className="text-[8px] bg-[#1F3F74] text-white px-1 rounded-xs">Next</span>}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{time}</div>
                <div className="text-[9px] text-slate-500">{extreme.height.toFixed(1)} m</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
