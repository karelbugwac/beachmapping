import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get('q')?.trim();
  if (!rawQuery) {
    return NextResponse.json({ error: 'Enter an address or place name to search.' }, { status: 400 });
  }
  if (rawQuery.length > 200) {
    return NextResponse.json({ error: 'Search text must be 200 characters or fewer.' }, { status: 400 });
  }

  const query = /catmon|cebu|philippines/i.test(rawQuery)
    ? rawQuery
    : `${rawQuery}, Catmon, Cebu, Philippines`;
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    viewbox: '123.95,10.70,124.10,10.58',
    bounded: '1',
    q: query,
  });

  try {
    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params}`, {
      headers: {
        'User-Agent': 'DagatTaBai/1.0 (OpenStreetMap location search)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`Nominatim returned ${response.status} for a Catmon map search.`);
      return NextResponse.json(
        { error: 'OpenStreetMap search is temporarily unavailable. You can still place the pin directly on the map.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const results = (await response.json()) as NominatimResult[];
    return NextResponse.json(
      {
        results: results.map((result) => ({
          id: result.place_id,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
          label: result.display_name,
          type: result.type,
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Nominatim error.';
    console.error('Catmon OpenStreetMap geocoding failed:', message);
    return NextResponse.json(
      { error: 'Could not search OpenStreetMap right now. You can still place the pin directly on the map.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
