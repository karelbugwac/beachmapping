import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWeather } from '@/lib/services/weather';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '10.6865');
    const lon = parseFloat(searchParams.get('lon') || '124.0152');

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required.' },
        { status: 400 }
      );
    }

    const weather = await fetchLiveWeather(lat, lon);
    return NextResponse.json(weather);
  } catch (error: unknown) {
    console.error('Weather API error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch weather';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
