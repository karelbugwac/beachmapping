const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type SuspensionEndDateResult =
  | { ok: true; value: string | null }
  | { ok: false; value: null };

export function validateSuspensionEndDate(value: unknown, now = Date.now()): SuspensionEndDateResult {
  if (value === undefined || value === null || value === '') return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false, value: null };

  const match = ISO_DATE.exec(value);
  if (!match) return { ok: false, value: null };
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const selectedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    selectedDate.getUTCFullYear() !== year ||
    selectedDate.getUTCMonth() !== month - 1 ||
    selectedDate.getUTCDate() !== day
  ) {
    return { ok: false, value: null };
  }

  const today = new Date(now);
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const oneYearAhead = new Date(todayUtc);
  oneYearAhead.setUTCFullYear(oneYearAhead.getUTCFullYear() + 1);
  if (selectedDate.getTime() <= todayUtc || selectedDate.getTime() > oneYearAhead.getTime()) {
    return { ok: false, value: null };
  }
  return { ok: true, value: `${value}T23:59:59.999Z` };
}
