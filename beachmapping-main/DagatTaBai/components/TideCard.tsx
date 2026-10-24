'use client';

import React, { useState, useEffect, useId } from 'react';
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
    // Render empty card of similar height to avoid hydration mismatch
    return (
      <div className="rounded-[14px] border border-slate-200 bg-white p-[18px] shadow-sm dark:border-gray-800 dark:bg-black h-[400px]" />
    );
  }

  if (extremes.length < 2) {
    return (
      <div className="rounded-[14px] border border-slate-200 bg-white p-[18px] shadow-sm dark:border-gray-800 dark:bg-black">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">TIDES</h2>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Tide data is unavailable right now.</p>
      </div>
    );
  }

  // Sort extremes by time
  const sorted = [...extremes].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Get today's extremes in Manila timezone
  const manilaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const manilaToday = new Date(manilaNow.getFullYear(), manilaNow.getMonth(), manilaNow.getDate());
  const todayExtremes = sorted.filter(extreme => {
    const extremeDate = new Date(new Date(extreme.time).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const extremeDay = new Date(extremeDate.getFullYear(), extremeDate.getMonth(), extremeDate.getDate());
    return extremeDay.getTime() === manilaToday.getTime();
  });

  // Find next tide (can be tomorrow)
  const nextTide = sorted.find(extreme => new Date(extreme.time).getTime() > now.getTime());

  // Calculate current tide state
  const currentTide = calculateCurrentTide(sorted, now);

  // Format time in Manila timezone (12-hour with AM/PM, no leading zero)
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const manilaDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const hours = manilaDate.getHours();
    const minutes = manilaDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Calculate countdown
  const getCountdown = (isoString: string) => {
    const diff = new Date(isoString).getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `in ${hours} h ${minutes} min`;
  };

  // Sample tide every 10 minutes from 00:00 to 24:00 Manila time
  const samples: { time: Date; height: number }[] = [];
  for (let i = 0; i <= 1440; i += 10) {
    const sampleTime = new Date(manilaToday);
    sampleTime.setHours(0, i, 0, 0);
    const sampleHeight = calculateCurrentTide(sorted, sampleTime)?.currentHeight ?? 0;
    samples.push({ time: sampleTime, height: sampleHeight });
  }

  // Calculate min/max for scaling
  const allHeights = [...samples.map(s => s.height), ...todayExtremes.map(e => e.height)];
  const lo = Math.min(...allHeights);
  const hi = Math.max(...allHeights);

  // SVG constants
  const W = 720;
  const H = 180;
  const TOP = 28;
  const BOT = 14;

  // Coordinate functions
  const x = (minutes: number) => (minutes / 1440) * W;
  const y = (height: number) => TOP + (H - TOP - BOT) * (1 - (height - lo) / (hi - lo || 1));

  // Build line path
  const linePoints = samples.map((s, i) => {
    const minutes = s.time.getHours() * 60 + s.time.getMinutes();
    return `${x(minutes).toFixed(1)},${y(s.height).toFixed(1)}`;
  });
  const linePath = `M${linePoints.join(' L')}`;
  const areaPath = `${linePath} L${W} ${H} L 0 ${H} Z`;

  // Now position in minutes from midnight Manila time
  const nowMinutes = manilaNow.getHours() * 60 + manilaNow.getMinutes();
  const nowX = x(nowMinutes);
  const nowY = y(currentTide?.currentHeight ?? 0);

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-[18px] shadow-sm dark:border-gray-800 dark:bg-black">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        {/* Left block */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">TIDES</h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {/* Next tide time */}
            {nextTide ? (
              <span className="text-4xl font-bold leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
                {formatTime(nextTide.time)}
              </span>
            ) : (
              <span className="text-4xl font-bold leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
                --
              </span>
            )}
            
            {/* Badge */}
            {nextTide && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                nextTide.type === 'high' 
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' 
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
              }`}>
                Next: {nextTide.type === 'high' ? 'High tide' : 'Low tide'}
              </span>
            )}
            
            {/* Countdown */}
            {nextTide && (
              <span className="text-sm text-slate-500">
                {getCountdown(nextTide.time)}
              </span>
            )}
          </div>
        </div>

        {/* Right block */}
        <div className="text-right sm:text-left">
          <span className="text-xs text-slate-500">Right now</span>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {currentTide?.status} · {currentTide?.currentHeight.toFixed(1)} m
          </div>
        </div>
      </div>

      {/* Wave chart */}
      <div className="mt-4 relative h-[180px]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <clipPath id={`clip-past-${clipId}`}>
              <rect x="0" y="0" width={nowX} height={H} />
            </clipPath>
            <clipPath id={`clip-future-${clipId}`}>
              <rect x={nowX} y="0" width={W - nowX} height={H} />
            </clipPath>
          </defs>

          {/* Back wave */}
          <path
            d={areaPath}
            transform="translate(14 10)"
            fill="currentColor"
            className="text-teal-600/10"
          />

          {/* Past area */}
          <path
            d={areaPath}
            fill="currentColor"
            className="text-teal-600/15"
            clipPath={`url(#clip-past-${clipId})`}
          />

          {/* Future area */}
          <path
            d={areaPath}
            fill="currentColor"
            className="text-teal-600/35"
            clipPath={`url(#clip-future-${clipId})`}
          />

          {/* Stroke */}
          <path
            d={linePath}
            fill="none"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            className="stroke-teal-600"
          />
        </svg>

        {/* High/Low dots */}
        {todayExtremes.map((extreme, i) => {
          const extremeDate = new Date(new Date(extreme.time).toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          const minutes = extremeDate.getHours() * 60 + extremeDate.getMinutes();
          const dotX = (minutes / 1440) * 100;
          const dotY = (y(extreme.height) / H) * 100;
          
          return (
            <div
              key={i}
              className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-black"
              style={{
                left: `${dotX}%`,
                top: `${dotY}%`,
                backgroundColor: extreme.type === 'high' ? '#0d9488' : '#f97316',
              }}
            />
          );
        })}

        {/* Now line */}
        <div
          className="absolute inset-y-0 flex -translate-x-1/2 flex-col items-center pointer-events-none"
          style={{ left: `${(nowMinutes / 1440) * 100}%` }}
        >
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
            Now
          </div>
          <div className="w-px flex-1 border-l border-dashed border-slate-500" />
        </div>

        {/* Current-level dot */}
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-slate-900 ring-2 ring-white dark:bg-white dark:ring-black"
          style={{
            left: `${(nowMinutes / 1440) * 100}%`,
            top: `${(nowY / H) * 100}%`,
          }}
        />
      </div>

      {/* Hour labels */}
      <div className="mt-2 flex justify-between text-[11px] text-slate-500">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>12 AM</span>
      </div>

      {/* Tiles */}
      <ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {todayExtremes.map((extreme, i) => {
          const isPassed = new Date(extreme.time).getTime() < now.getTime();
          const isNext = nextTide?.time === extreme.time;
          const time = formatTime(extreme.time);
          const height = extreme.height.toFixed(1);

          return (
            <li
              key={i}
              className={`rounded-lg border p-3 ${
                isPassed
                  ? 'opacity-60 bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-800'
                  : isNext
                  ? 'border-teal-600 ring-1 ring-teal-600 bg-white dark:bg-gray-900'
                  : 'border-slate-200 bg-slate-50 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <div className="text-xs font-bold">
                {extreme.type === 'high' ? (
                  <span className="text-teal-700 dark:text-teal-400">▲ High</span>
                ) : (
                  <span className="text-orange-700 dark:text-orange-400">▼ Low</span>
                )}
                {isPassed && <span className="text-slate-500"> · Passed</span>}
                {isNext && <span className="text-teal-700 dark:text-teal-400"> · Next</span>}
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Fraunces, serif' }}>
                {time}
              </div>
              <div className="text-xs text-slate-500">
                {extreme.height < 0 ? `−${Math.abs(extreme.height).toFixed(1)} m` : `${height} m`}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
