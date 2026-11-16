import type { TideExtreme } from './tide-interpolation';

interface OpenWatersExtreme {
  time?: unknown;
  level?: unknown;
  high?: unknown;
  low?: unknown;
  label?: unknown;
}

interface OpenWatersStation {
  name?: unknown;
  source?: { name?: unknown };
  attribution?: unknown;
}

interface OpenWatersResponse {
  extremes?: unknown;
  station?: OpenWatersStation;
  message?: unknown;
}

export interface OpenWatersTidesResult {
  extremes: TideExtreme[];
  copyright: string;
}

const TIDES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const globalForTides = globalThis as unknown as {
  __dagatTidesCache?: Map<string, { data: OpenWatersTidesResult; expiresAt: number }>;
  __dagatTidesInFlight?: Map<string, Promise<OpenWatersTidesResult>>;
};
const tidesCache =
  globalForTides.__dagatTidesCache ??
  (globalForTides.__dagatTidesCache = new Map());
const tidesInFlight =
  globalForTides.__dagatTidesInFlight ??
  (globalForTides.__dagatTidesInFlight = new Map());

export async function fetchOpenWatersTides(
  latitude: number,
  longitude: number
): Promise<OpenWatersTidesResult> {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const now = Date.now();
  const cached = tidesCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const existingInFlight = tidesInFlight.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const requestPromise = (async (): Promise<OpenWatersTidesResult> => {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 2);

      const url = new URL('https://api.openwaters.io/tides/extremes');
      url.searchParams.set('latitude', String(latitude));
      url.searchParams.set('longitude', String(longitude));
      url.searchParams.set('start', start.toISOString());
      url.searchParams.set('end', end.toISOString());
      url.searchParams.set('units', 'meters');

      const response = await fetch(url, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10000),
      });
  const data = (await response.json().catch(() => null)) as OpenWatersResponse | null;

  if (!response.ok) {
    const reason = typeof data?.message === 'string'
      ? data.message
      : `OpenWaters tides request failed (HTTP ${response.status}).`;
    throw new Error(reason);
  }

  if (!Array.isArray(data?.extremes)) {
    throw new Error('OpenWaters did not return tide extremes for this location.');
  }

  const extremes = data.extremes.flatMap((value): TideExtreme[] => {
    if (typeof value !== 'object' || value === null) return [];
    const item = value as OpenWatersExtreme;
    const time = typeof item.time === 'string' ? item.time : '';
    const label = typeof item.label === 'string' ? item.label.toLowerCase() : '';
    const type = item.high === true || label === 'high'
      ? 'high'
      : item.low === true || label === 'low'
        ? 'low'
        : null;

    if (
      !time ||
      !Number.isFinite(new Date(time).getTime()) ||
      typeof item.level !== 'number' ||
      !Number.isFinite(item.level) ||
      !type
    ) {
      return [];
    }

    return [{ time, height: item.level, type }];
  });

  if (extremes.length < 2) {
    throw new Error('OpenWaters returned insufficient tide data for this location.');
  }

  const sourceName = typeof data.station?.source?.name === 'string'
    ? data.station.source.name
    : '';
  const stationName = typeof data.station?.name === 'string' ? ` for ${data.station.name}` : '';

  const result: OpenWatersTidesResult = {
    extremes,
    copyright: `Tides: OpenWaters${stationName}${sourceName ? ` · ${sourceName}` : ''} (Hart-Davis et al., 2025) · CC BY 4.0`,
  };

      tidesCache.set(cacheKey, { data: result, expiresAt: Date.now() + TIDES_CACHE_TTL_MS });
      return result;
    } finally {
      tidesInFlight.delete(cacheKey);
    }
  })();

  tidesInFlight.set(cacheKey, requestPromise);
  return requestPromise;
}
