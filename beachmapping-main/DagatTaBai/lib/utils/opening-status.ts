export type OpeningHours = string | Record<string, string> | null | undefined;

export type OpeningStatusState = 'open' | 'closing_soon' | 'closed' | 'unknown';

export interface OpeningStatus {
  state: OpeningStatusState;
  label: string;
  detail: string;
}

interface ClockTime {
  minutes: number;
  display: string;
}

interface OpeningRange {
  opens: number;
  closes: number;
}

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_PATTERN = /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/gi;

function formatClockTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function parseClockTimes(value: string): ClockTime[] {
  const times: ClockTime[] = [];
  for (const match of value.matchAll(TIME_PATTERN)) {
    const parsedHour = Number(match[1] || match[4]);
    const minute = Number(match[2] || match[5] || 0);
    const period = match[3]?.toUpperCase();
    let hour = parsedHour;
    if (period) {
      if (hour < 1 || hour > 12 || minute > 59) continue;
      hour = (hour % 12) + (period === 'PM' ? 12 : 0);
    } else if (hour > 23 || minute > 59) {
      continue;
    }
    times.push({ minutes: hour * 60 + minute, display: formatClockTime(hour, minute) });
  }
  return times;
}

function parseHoursMap(hours: OpeningHours): Record<string, string> | null {
  if (typeof hours === 'string') {
    const trimmed = hours.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return Object.fromEntries(
            Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
          );
        }
      } catch {
        return { Daily: trimmed };
      }
    }
    return { Daily: trimmed };
  }
  if (typeof hours === 'object' && hours !== null) {
    return Object.fromEntries(
      Object.entries(hours).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    );
  }
  return null;
}

function hoursForDay(hours: Record<string, string>, dayKey: string): string {
  if (hours.Daily?.trim()) return hours.Daily.trim();
  const entry = Object.entries(hours).find(([day]) => day.toLowerCase().slice(0, 3) === dayKey.toLowerCase());
  return entry?.[1]?.trim() || '';
}

function isClosed(value: string): boolean {
  return /^(closed|close)$/i.test(value.trim());
}

function parseRanges(value: string): OpeningRange[] {
  const times = parseClockTimes(value);
  const ranges: OpeningRange[] = [];
  for (let index = 0; index + 1 < times.length; index += 2) {
    ranges.push({ opens: times[index].minutes, closes: times[index + 1].minutes });
  }
  return ranges;
}

function formatSavedHours(value: string): string {
  if (!value.trim()) return '';
  if (isClosed(value)) return 'Closed';
  const times = parseClockTimes(value);
  if (!times.length) return value.trim();

  const ranges: string[] = [];
  for (let index = 0; index + 1 < times.length; index += 2) {
    ranges.push(`${times[index].display} - ${times[index + 1].display}`);
  }
  if (times.length % 2) {
    ranges.push(times[times.length - 1].display);
  }
  return ranges.join(', ');
}

export function formatOpeningHoursGroups(hours: OpeningHours): Array<{ days: string; hours: string }> {
  const schedule = parseHoursMap(hours);
  if (!schedule) return [{ days: 'Daily', hours: 'Hours not provided' }];
  if (schedule.Daily) {
    const formatted = formatSavedHours(schedule.Daily);
    return formatted ? [{ days: 'Daily', hours: formatted }] : [{ days: 'Daily', hours: 'Hours not provided' }];
  }

  const dailyValues = DAY_KEYS.map((day) => formatSavedHours(hoursForDay(schedule, day)));
  if (!dailyValues.some(Boolean)) return [{ days: 'Daily', hours: 'Hours not provided' }];
  if (dailyValues.every((value) => value && value === dailyValues[0])) {
    return [{ days: 'Daily', hours: dailyValues[0] }];
  }

  const groups: Array<{ days: string; hours: string }> = [];
  let startIndex = 0;
  while (startIndex < dailyValues.length) {
    const value = dailyValues[startIndex];
    if (!value) {
      startIndex += 1;
      continue;
    }
    let endIndex = startIndex;
    while (endIndex + 1 < dailyValues.length && dailyValues[endIndex + 1] === value) endIndex += 1;
    const dayLabel = startIndex === endIndex
      ? DAY_KEYS[startIndex]
      : `${DAY_KEYS[startIndex]}-${DAY_KEYS[endIndex]}`;
    groups.push({ days: dayLabel, hours: value });
    startIndex = endIndex + 1;
  }
  return groups.length ? groups : [{ days: 'Daily', hours: 'Hours not provided' }];
}

function getManilaTime(now: Date): { weekday: string; minutes: number } | null {
  if (!Number.isFinite(now.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const weekday = part('weekday');
  const hour = Number(part('hour'));
  const minute = Number(part('minute'));
  return weekday && Number.isFinite(hour) && Number.isFinite(minute)
    ? { weekday, minutes: hour * 60 + minute }
    : null;
}

function status(state: OpeningStatusState, label: string, detail = ''): OpeningStatus {
  return { state, label, detail };
}

export function getOpeningStatus(hours: OpeningHours, now: Date): OpeningStatus {
  const schedule = parseHoursMap(hours);
  if (!schedule || !Object.values(schedule).some((value) => value.trim())) {
    return status('unknown', '', '');
  }
  const localTime = getManilaTime(now);
  if (!localTime) return status('unknown', '', '');

  const todayIndex = DAY_KEYS.indexOf(localTime.weekday);
  if (todayIndex < 0) return status('unknown', '', '');
  const todayHours = hoursForDay(schedule, DAY_KEYS[todayIndex]);
  const todayRanges = parseRanges(todayHours);

  for (const range of todayRanges) {
    const fullDay = range.opens === 0 && range.closes >= 23 * 60 + 59;
    const overnight = range.closes <= range.opens && !fullDay;
    const isOpen = fullDay
      || (overnight
        ? localTime.minutes >= range.opens || localTime.minutes < range.closes
        : localTime.minutes >= range.opens && localTime.minutes < range.closes);
    if (!isOpen) continue;

    const remainingMinutes = overnight && localTime.minutes >= range.opens
      ? 24 * 60 - localTime.minutes + range.closes
      : range.closes - localTime.minutes;
    const closingTime = formatClockTime(Math.floor(range.closes / 60) % 24, range.closes % 60);
    return remainingMinutes <= 60
      ? status('closing_soon', 'Closing soon', `Closes at ${closingTime}`)
      : status('open', 'Open now', `Closes at ${closingTime}`);
  }

  const upcoming = todayRanges
    .filter((range) => range.opens > localTime.minutes)
    .sort((left, right) => left.opens - right.opens)[0];
  if (upcoming) {
    return status('closed', 'Closed', `Opens today at ${formatClockTime(Math.floor(upcoming.opens / 60), upcoming.opens % 60)}`);
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const dayIndex = (todayIndex + offset) % DAY_KEYS.length;
    const nextRanges = parseRanges(hoursForDay(schedule, DAY_KEYS[dayIndex]))
      .sort((left, right) => left.opens - right.opens);
    if (!nextRanges.length) continue;
    const dayLabel = offset === 1 ? 'tomorrow' : DAY_NAMES[dayIndex];
    return status('closed', 'Closed', `Opens ${dayLabel} at ${formatClockTime(Math.floor(nextRanges[0].opens / 60), nextRanges[0].opens % 60)}`);
  }

  return status('closed', 'Closed', '');
}
