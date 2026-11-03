import { NextResponse } from 'next/server';

const BINONGKALAN = { latitude: 10.6341356, longitude: 124.0278661 };
const SEARCH_RADIUS_METERS = 8000;

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export const revalidate = 3600;

function unavailableResponse() {
  return NextResponse.json(
    { places: [], available: false, attribution: '© OpenStreetMap contributors' },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  );
}

export async function GET() {
  const { latitude, longitude } = BINONGKALAN;
  const query = `
    [out:json][timeout:20];
    (
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["name"]["natural"="beach"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["name"]["leisure"~"beach_resort|marina|water_park"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["name"]["tourism"~"resort|hotel|guest_house|attraction|viewpoint|camp_site|hostel"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["name"]["historic"~"monument|memorial|ruins"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["name"]["amenity"="place_of_worship"];
    );
    out center tags;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DagatTaBai/1.0 (OpenStreetMap nearby places)',
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(25000),
      next: { revalidate },
    });

    if (!response.ok) {
      console.warn(`Overpass API returned ${response.status} for Binongkalan POIs.`);
      return unavailableResponse();
    }

    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const places = (payload.elements || [])
      .flatMap((element) => {
        const name = element.tags?.name?.trim();
        const point = element.center || (
          element.lat !== undefined && element.lon !== undefined
            ? { lat: element.lat, lon: element.lon }
            : null
        );
        if (!name || !point || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) {
          return [];
        }

        const category =
          element.tags?.natural === 'beach' || element.tags?.leisure === 'beach_resort'
            ? 'Beach'
            : element.tags?.tourism === 'resort' || element.tags?.tourism === 'hotel' ||
                element.tags?.tourism === 'guest_house' || element.tags?.tourism === 'camp_site'
              ? 'Accommodation'
              : element.tags?.leisure === 'marina'
                ? 'Coastal place'
                : 'Landmark';

        return [{
          id: `${element.type}/${element.id}`,
          name,
          category,
          latitude: point.lat,
          longitude: point.lon,
          osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        }];
      })
      .slice(0, 200);

    return NextResponse.json(
      { places, available: true, attribution: '© OpenStreetMap contributors' },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Overpass API error.';
    console.warn('Nearby OpenStreetMap places are unavailable:', message);
    return unavailableResponse();
  }
}
