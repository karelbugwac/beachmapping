import { NextRequest, NextResponse } from 'next/server';
import { getAllBeaches } from '@/lib/db/beaches';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/utils/rate-limit';

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    keyPrefix: 'api-weather-beaches',
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    const beaches = await getAllBeaches();
    const data = beaches.map(({ id, name, location, latitude, longitude }) => ({
      id,
      name,
      location,
      latitude,
      longitude,
    }));

    return NextResponse.json(data || [], {
      headers: {
        ...rateLimit.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load beach locations.';
    console.error('Weather beach locations error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: rateLimit.headers });
  }
}
