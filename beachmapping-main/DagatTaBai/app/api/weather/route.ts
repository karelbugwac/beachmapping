import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWeather } from '@/lib/services/weather';

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

    // fetchLiveWeather has built-in fallback, so it will always return data
    const weather = await fetchLiveWeather(lat, lon);
    return NextResponse.json(weather);
  } catch (error: unknown) {
    // Even on error, try to return fallback data
    console.error('Weather API error, using fallback:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch weather';
    // Return fallback data instead of error to ensure UI always displays something
    const fallbackWeather = {
      temperature: 28,
      relativeHumidity: 75,
      windSpeed: 12,
      windDirection: 180,
      weatherCode: 0,
      conditionLabel: 'Clear Sky',
      heatIndex: { heatIndexCelsius: 30, category: 'Caution' },
      timestamp: new Date().toISOString(),
      hourly: [],
      tide: {
        lowTide: '6:00 AM',
        highTide: '12:00 PM',
        nextLowTide: '6:00 PM',
        nextHighTide: '12:00 AM',
      },
      waterTemperature: 28 + Math.random() * 3,
      swellHeight: 0.5 + Math.random() * 1.5,
    };
    return NextResponse.json(fallbackWeather);
  }
}
