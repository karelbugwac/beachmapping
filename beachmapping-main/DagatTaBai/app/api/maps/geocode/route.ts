import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const VERIFIED_AREA_CENTERS = {
  binongkalan: {
    latitude: 10.6341356,
    longitude: 124.0278661,
    label: 'Binongkalan, Catmon, Cebu, Philippines',
  },
  catmon: {
    latitude: 10.723822,
    longitude: 124.0137974,
    label: 'Catmon, Cebu, Philippines',
  },
} as const;

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
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

  const isBinongkalanSearch = /\bbinongkalan\b/i.test(rawQuery);
  const isCatmonSearch =
    /\bcatmon\b/i.test(rawQuery) &&
    (/\b(cebu|philippines|binongkalan|municipality|town|barangay)\b/i.test(rawQuery) ||
      /^catmon$/i.test(rawQuery));
  const query = /philippines/i.test(rawQuery)
    ? rawQuery
    : `${rawQuery}, Catmon, Cebu, Philippines`;
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
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
      return areaFallback(isBinongkalanSearch, isCatmonSearch);
    }

    const results = (await response.json()) as NominatimResult[];
    const areaName = isBinongkalanSearch ? 'binongkalan' : 'catmon';
    const exactArea = (isBinongkalanSearch || isCatmonSearch)
      ? results.find((result) => result.name?.trim().toLowerCase() === areaName)
      : undefined;
    if ((isBinongkalanSearch || isCatmonSearch) && !exactArea) {
      return areaFallback(isBinongkalanSearch, isCatmonSearch);
    }
    if (results.length === 0) {
      return areaFallback(isBinongkalanSearch, isCatmonSearch);
    }

    const orderedResults = exactArea
      ? [exactArea, ...results.filter((result) => result.place_id !== exactArea.place_id)]
      : results;
    return NextResponse.json(
      {
        results: orderedResults.map((result) => ({
          id: result.place_id,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
          label: result.display_name,
          type: result.type,
          precision: result.type === 'village' || result.type === 'town' ? 'area' : 'place',
          source: 'OpenStreetMap',
        })),
        attribution: '© OpenStreetMap contributors',
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Nominatim error.';
    console.error('Catmon OpenStreetMap geocoding failed:', message);
    if (isBinongkalanSearch || isCatmonSearch) {
      return areaFallback(isBinongkalanSearch, isCatmonSearch);
    }
    return NextResponse.json(
      { error: 'Could not search OpenStreetMap right now. You can still place the pin directly on the map.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

function areaFallback(isBinongkalanSearch: boolean, isCatmonSearch: boolean) {
  const area = isBinongkalanSearch
    ? VERIFIED_AREA_CENTERS.binongkalan
    : isCatmonSearch
      ? VERIFIED_AREA_CENTERS.catmon
      : null;

  if (!area) {
    return NextResponse.json(
      { results: [], attribution: '© OpenStreetMap contributors' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    {
      results: [{
        id: `verified-area-${isBinongkalanSearch ? 'binongkalan' : 'catmon'}`,
        latitude: area.latitude,
        longitude: area.longitude,
        label: area.label,
        type: isBinongkalanSearch ? 'village' : 'town',
        precision: 'area',
        source: 'OpenStreetMap verified area center fallback',
      }],
      attribution: '© OpenStreetMap contributors',
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
  );
}
