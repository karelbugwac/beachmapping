import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWeather } from '@/lib/services/weather';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/utils/rate-limit';

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    keyPrefix: 'api-weather',
    maxRequests: 15,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(
      rateLimit,
      'Weather API rate limit reached. Weather updates every 5 minutes.'
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '10.6865');
    const lon = parseFloat(searchParams.get('lon') || '124.0152');

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required.' },
        { status: 400, headers: rateLimit.headers }
      );
    }

    const weather = await fetchLiveWeather(lat, lon);
    return NextResponse.json(weather, {
      headers: {
        ...rateLimit.headers,
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error: unknown) {
    console.error('Weather API error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch weather';
    return NextResponse.json({ error: msg }, { status: 502, headers: rateLimit.headers });
  }
}
