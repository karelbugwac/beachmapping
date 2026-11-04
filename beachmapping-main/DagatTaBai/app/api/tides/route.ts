import { NextRequest, NextResponse } from 'next/server';
import { fetchStormglassTides } from '@/lib/services/tides';
import { calculateCurrentTide, type TideExtreme } from '@/lib/services/tide-interpolation';

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

    const tideExtremes: TideExtreme[] = await fetchStormglassTides(lat, lon);
    if (tideExtremes.length < 2) throw new Error('Tide provider returned insufficient data.');

    const currentTide = calculateCurrentTide(tideExtremes);

    return NextResponse.json({
      extremes: tideExtremes,
      current: currentTide,
    });
  } catch (error: unknown) {
    console.error('Tides API error:', error);
    const message = error instanceof Error ? error.message : 'Tide data is unavailable.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
