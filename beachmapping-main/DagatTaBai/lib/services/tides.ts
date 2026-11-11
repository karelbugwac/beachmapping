import type { TideExtreme } from './tide-interpolation';

interface StormglassExtreme {
  time?: unknown;
  height?: unknown;
  type?: unknown;
}

interface StormglassResponse {
  data?: unknown;
  errors?: unknown;
}

export interface StormglassTidesResult {
  extremes: TideExtreme[];
  copyright: string;
}

export async function fetchStormglassTides(
  latitude: number,
  longitude: number
): Promise<StormglassTidesResult> {
  const apiKey = process.env.STORMGLASS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Tide data is not configured. Add STORMGLASS_API_KEY to .env.local and restart the app.');
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const url = new URL('https://api.stormglass.io/v2/tide/extremes/point');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lng', String(longitude));
  url.searchParams.set('start', start.toISOString());
  url.searchParams.set('end', end.toISOString());

  const response = await fetch(url, {
    headers: { Authorization: apiKey },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(10000),
  });
  const data = (await response.json().catch(() => null)) as StormglassResponse | null;

  if (!response.ok) {
    const reason = Array.isArray(data?.errors) && typeof data.errors[0] === 'string'
      ? data.errors[0]
      : `Stormglass request failed (HTTP ${response.status}).`;
    throw new Error(reason);
  }

  if (!Array.isArray(data?.data)) {
    throw new Error('Stormglass did not return tide extremes for this location.');
  }

  const extremes = data.data.flatMap((value): TideExtreme[] => {
    if (typeof value !== 'object' || value === null) return [];
    const item = value as StormglassExtreme;
    const time = typeof item.time === 'string' ? item.time : '';
    const type = typeof item.type === 'string' ? item.type.toLowerCase() : '';
    if (
      !time ||
      !Number.isFinite(new Date(time).getTime()) ||
      typeof item.height !== 'number' ||
      !Number.isFinite(item.height) ||
      (type !== 'high' && type !== 'low')
    ) {
      return [];
    }

    return [{ time, height: item.height, type }];
  });

  if (extremes.length < 2) {
    throw new Error('Stormglass returned insufficient tide data for this location.');
  }

  return {
    extremes,
    copyright: 'Tide predictions provided by Stormglass',
  };
}
