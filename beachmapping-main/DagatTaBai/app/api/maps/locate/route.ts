import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/utils/rate-limit';

// Fallback network geolocation when desktop browser GPS/Wi-Fi location is unavailable.
export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    keyPrefix: 'api-maps-locate',
    maxRequests: 20,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit);
  }
  try {
    const res = await fetch('https://ipwho.is/', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (
        data &&
        data.success !== false &&
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        Number.isFinite(data.latitude) &&
        Number.isFinite(data.longitude)
      ) {
        return NextResponse.json({
          lat: data.latitude,
          lng: data.longitude,
          source: 'network',
        });
      }
    }
  } catch {
    // Ignore and use Cebu/Catmon highway fallback below
  }

  // Default fallback along the North National Highway in Catmon, Cebu so routing always works offline/locally
  return NextResponse.json({
    lat: 10.6485,
    lng: 124.0228,
    source: 'fallback',
  });
}

