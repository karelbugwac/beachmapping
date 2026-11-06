import type { TideExtreme } from './tide-interpolation';

interface WorldTidesExtreme {
  dt?: unknown;
  date?: unknown;
  height?: unknown;
  type?: unknown;
}

interface WorldTidesResponse {
  status: number;
  error?: string;
  copyright?: string;
  extremes?: unknown[];
}

export interface WorldTidesResult {
  extremes: TideExtreme[];
  copyright: string;
}

export async function fetchWorldTides(
  latitude: number,
  longitude: number
): Promise<WorldTidesResult> {
  const apiKey = process.env.WORLDTIDES_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Tide data is not configured. Add WORLDTIDES_API_KEY to .env.local and restart the app.');
  }

  const url = new URL('https://www.worldtides.info/api/v3');
  url.searchParams.set('extremes', '');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('days', '2');
  url.searchParams.set('localtime', '');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(10000),
  });
  const data = (await response.json().catch(() => null)) as WorldTidesResponse | null;

  if (!response.ok || !data || data.status !== 200) {
    const reason = data?.error || `WorldTides request failed (HTTP ${response.status}).`;
    throw new Error(reason);
  }

  if (!Array.isArray(data.extremes)) {
    throw new Error('WorldTides did not return tide extremes for this location.');
  }

  const extremes = data.extremes.flatMap((value): TideExtreme[] => {
    if (typeof value !== 'object' || value === null) return [];
    const item = value as WorldTidesExtreme;
    const time =
      typeof item.date === 'string'
        ? item.date
        : typeof item.dt === 'number' && Number.isFinite(item.dt)
          ? new Date(item.dt * 1000).toISOString()
          : '';
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
    throw new Error('WorldTides returned insufficient tide data for this location.');
  }

  return {
    extremes,
    copyright: data.copyright || 'Tide predictions provided by WorldTides.info',
  };
}
