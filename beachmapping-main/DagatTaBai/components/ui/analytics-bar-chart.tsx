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

  return (
    <section aria-label={title} className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xs text-slate-600"><strong>{total}</strong> unique visits · 7 days</span>
      </div>
      <ol className="grid h-44 grid-cols-7 items-end gap-2 border-b border-l border-slate-200 px-2 pb-0" aria-label="Daily visitor counts">
        {points.map((point) => {
          const day = new Date(`${point.date}T12:00:00`);
          const label = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day);
          const height = point.visitors === 0 ? 3 : Math.max(8, (point.visitors / peak) * 100);

          return (
            <li key={point.date} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
              <span className="text-[11px] tabular-nums text-slate-600">{point.visitors}</span>
              <div
                className="w-full max-w-10 rounded-t-sm bg-sky-700 transition-[height] duration-300"
                style={{ height: `${height}%` }}
                title={`${label}: ${point.visitors} visitors`}
                role="img"
                aria-label={`${label}: ${point.visitors} visitors`}
              />
              <span className="text-[10px] text-slate-500">{label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}