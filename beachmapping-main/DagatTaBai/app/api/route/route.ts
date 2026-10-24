import { NextRequest, NextResponse } from 'next/server';
import { calculateRoadRoute } from '@/lib/db/routing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, travelMode = 'car' } = body;

    if (
      !origin ||
      typeof origin.lat !== 'number' || !Number.isFinite(origin.lat) || Math.abs(origin.lat) > 90 ||
      typeof origin.lng !== 'number' || !Number.isFinite(origin.lng) || Math.abs(origin.lng) > 180 ||
      !destination ||
      typeof destination.lat !== 'number' || !Number.isFinite(destination.lat) || Math.abs(destination.lat) > 90 ||
      typeof destination.lng !== 'number' || !Number.isFinite(destination.lng) || Math.abs(destination.lng) > 180 ||
      !['car', 'motorcycle', 'walking'].includes(travelMode)
    ) {
      return NextResponse.json(
        { error: 'Valid origin, destination, and travel mode are required.' },
        { status: 400 }
      );
    }

    const route = await calculateRoadRoute(origin, destination, travelMode);
    return NextResponse.json(route);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Route calculation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
