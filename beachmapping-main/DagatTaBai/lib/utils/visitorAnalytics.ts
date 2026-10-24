export interface VisitorEventDate {
  visit_date: string;
}

export function buildVisitorSeries(days = 7) {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - index - 1)));
    return date.toISOString().slice(0, 10);
  });

  return {
    startDate: dates[0],
    points: dates.map((date) => ({ date, visitors: 0 })),
  };
}

export function countVisitorsByDate(
  dates: { date: string; visitors: number }[],
  events: VisitorEventDate[] | null
) {
  const totals = new Map(dates.map((point) => [point.date, 0]));
  for (const event of events || []) {
    const date = event.visit_date.slice(0, 10);
    if (totals.has(date)) totals.set(date, (totals.get(date) || 0) + 1);
  }
  return dates.map((point) => ({ ...point, visitors: totals.get(point.date) || 0 }));
}