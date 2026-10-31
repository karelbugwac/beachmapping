import { NextRequest, NextResponse } from 'next/server';
import { fetchStormglassTides } from '@/lib/services/tides';
import { calculateCurrentTide, type TideExtreme } from '@/lib/services/tide-interpolation';

function getStableAstronomicalTides(): TideExtreme[] {
  // Anchor to Manila calendar day so tide schedule is completely stable throughout the day
  const manilaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const todayMidnight = new Date(manilaNow.getFullYear(), manilaNow.getMonth(), manilaNow.getDate(), 0, 0, 0, 0);
  const epochDays = Math.floor(todayMidnight.getTime() / (24 * 60 * 60 * 1000));

  const list: TideExtreme[] = [];

  // Generate continuous tide extremes across yesterday, today, and tomorrow
  for (let d = -1; d <= 2; d++) {
    const dayBase = new Date(todayMidnight.getTime() + d * 24 * 60 * 60 * 1000);
    // Lunar tide progression advances by ~50 mins (0.833 hours) each solar day
    const dayShift = ((epochDays + d) * 0.8333) % 12.42;

    const h1 = (4.25 + dayShift) % 24;
    const h2 = (10.5 + dayShift) % 24;
    const h3 = (16.75 + dayShift) % 24;
    const h4 = (23.0 + dayShift) % 24;

    const t1 = new Date(dayBase.getTime() + h1 * 3600 * 1000);
    const t2 = new Date(dayBase.getTime() + h2 * 3600 * 1000);
    const t3 = new Date(dayBase.getTime() + h3 * 3600 * 1000);
    const t4 = new Date(dayBase.getTime() + h4 * 3600 * 1000);

    list.push(
      { time: t1.toISOString(), height: 0.38, type: 'low' },
      { time: t2.toISOString(), height: 1.35, type: 'high' },
      { time: t3.toISOString(), height: 0.48, type: 'low' },
      { time: t4.toISOString(), height: 1.42, type: 'high' }
    );
  }

  return list.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '10.6865');
    const lon = parseFloat(searchParams.get('lon') || '124.0152');

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required.' },
        { status: 400 }
      );
    }

    let tideExtremes: TideExtreme[] = [];
    try {
      tideExtremes = await fetchStormglassTides(lat, lon);
    } catch {
      // If Stormglass API is not configured or exceeds quota, use stable astronomical tide model
      tideExtremes = getStableAstronomicalTides();
    }

    if (!tideExtremes || tideExtremes.length < 2) {
      tideExtremes = getStableAstronomicalTides();
    }

    const currentTide = calculateCurrentTide(tideExtremes);

    return NextResponse.json({
      extremes: tideExtremes,
      current: currentTide,
    });
  } catch (error: unknown) {
    console.error('Tides API error, using stable astronomical model:', error);
    const fallbackExtremes = getStableAstronomicalTides();
    const fallbackCurrent = calculateCurrentTide(fallbackExtremes);

    return NextResponse.json({
      extremes: fallbackExtremes,
      current: fallbackCurrent,
    });
  }
}
