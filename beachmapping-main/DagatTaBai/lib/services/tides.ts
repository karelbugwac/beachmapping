import type { TideExtreme } from './tide-interpolation';

/**
 * Fetches 24-48 hour tide extremes from Stormglass.io API for scheduled caching.
 * Stormglass rate limit: 10 calls/day on free tier.
 */
export async function fetchStormglassTides(
  latitude: number,
  longitude: number
): Promise<TideExtreme[]> {
  const apiKey = process.env.STORMGLASS_API_KEY;

  if (!apiKey || apiKey === 'your-stormglass-api-key-here') {
    throw new Error('Stormglass tide data is not configured.');
  }

  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 2);

    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${latitude}&lng=${longitude}&start=${start.toISOString()}&end=${end.toISOString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Stormglass HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Stormglass returned no tide extremes.');
    }

    return data.data.map((item: { time: string; height: number; type: 'high' | 'low' }) => ({
      time: item.time,
      height: item.height,
      type: item.type,
    }));
  } catch (error) {
    console.error('Failed to fetch Stormglass tides:', error);
    throw error;
  }
}
