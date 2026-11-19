import { NextRequest, NextResponse } from 'next/server';
import { fetchOpenWatersTides } from '@/lib/services/tides';
import { calculateCurrentTide, type TideExtreme } from '@/lib/services/tide-interpolation';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/utils/rate-limit';

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    keyPrefix: 'api-tides',
    maxRequests: 15,
    windowMs: 5 * 60 * 1000, // 5 minutes
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(
      rateLimit,
      'Tides API rate limit reached. Tide data updates every 5 minutes.'
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

    const tideResult = await fetchOpenWatersTides(lat, lon);
    const tideExtremes: TideExtreme[] = tideResult.extremes;
    if (tideExtremes.length < 2) throw new Error('Tide provider returned insufficient data.');

    const currentTide = calculateCurrentTide(tideExtremes);

    return NextResponse.json(
      {
        extremes: tideExtremes,
        current: currentTide,
        copyright: tideResult.copyright,
      },
      {
        headers: {
          ...rateLimit.headers,
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Tides API error:', error);
    const message = error instanceof Error ? error.message : 'Tide data is unavailable.';
    return NextResponse.json({ error: message }, { status: 502, headers: rateLimit.headers });
  }
}
