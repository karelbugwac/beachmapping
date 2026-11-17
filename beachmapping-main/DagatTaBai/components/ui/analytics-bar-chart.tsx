'use client';

import { CoastalTides } from '@/components/ui/coastal-icons';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            <CoastalTides size={20} />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Daily visitor activity.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-neutral-300">
            {total.toLocaleString()} visits
          </span>
          <span className="text-slate-600 dark:text-neutral-400">Avg. {avg} / day</span>
          <span className="text-slate-600 dark:text-neutral-400">Peak: {peakDayName}</span>
        </div>
      </div>

      <div className="relative border-b border-slate-200 pb-2 pt-6 dark:border-neutral-800">
        <div className="absolute inset-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none">
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
            const isPeak = point.visitors === peak;

            return (
              <li
                key={point.date}
                className="relative flex h-full min-w-0 flex-col items-center justify-end gap-2"
              >
                <span className={`text-[11px] tabular-nums font-bold ${
                  isPeak
                    ? 'text-brand-700 dark:text-sky-300'
                    : 'text-slate-500 dark:text-neutral-400'
                }`}>
                  {point.visitors}
                </span>

                <div
                  className={`w-full max-w-14 ${
                    isPeak
                      ? 'bg-brand-700'
                      : 'bg-slate-400 dark:bg-neutral-600'
                  }`}
                  style={{ height: `${height}%` }}
                  role="img"
                  aria-label={`${label}: ${point.visitors} visitors`}
                />

                <div className="text-center pt-1.5">
                  <span className={`text-xs font-bold block ${
                    isPeak
                      ? 'text-brand-700 dark:text-sky-300'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}>
                    {label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">
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
