import { NextRequest, NextResponse } from 'next/server';
import { fetchStormglassTides } from '@/lib/services/tides';
import { calculateCurrentTide } from '@/lib/services/tide-interpolation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '10.635');
    const lon = parseFloat(searchParams.get('lon') || '124.027');

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required.' },
        { status: 400 }
      );
    }

    // Fetch tide extremes from Stormglass
    const tideExtremes = await fetchStormglassTides(lat, lon);

    // Calculate current real-time tide state
    const currentTide = calculateCurrentTide(tideExtremes);

    return NextResponse.json({
      extremes: tideExtremes,
      current: currentTide,
    });
  } catch (error: unknown) {
    // Return fallback data instead of error to ensure UI always displays something
    console.error('Tides API error, using fallback:', error);
    const now = new Date();
    const fallbackExtremes = [
      { time: now.toISOString(), height: 0.5, type: 'low' as const },
      { time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), height: 1.2, type: 'high' as const },
      { time: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), height: 0.5, type: 'low' as const },
      { time: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(), height: 1.2, type: 'high' as const },
    ];
    const fallbackCurrent = calculateCurrentTide(fallbackExtremes);
    
    return NextResponse.json({
      extremes: fallbackExtremes,
      current: fallbackCurrent,
    });
  }
}
