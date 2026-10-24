import { haversineDistanceKm } from '@/lib/utils/distance';

export interface RouteResult {
  coordinates: [number, number][]; // Leaflet format: [lat, lng][]
  distanceKm: number;
  durationMinutes: number;
  durationFormatted: string;
  travelMode: 'Car' | 'Motorcycle' | 'Walking';
  durationIsEstimated: boolean;
  provider: 'OSRM OpenStreetMap Driving Engine' | 'Geodesic Calculation';
}

/**
 * Calculates a verified road route using the Open Source Routing Machine (OSRM) driving API.
 * Uses real geographic coordinates for origin and destination.
 * Note: OSRM doesn't have a motorcycle or walking profile, so we use 'driving' for car/motorcycle and 'foot' for walking, then adjust speed calculations.
 */
export async function calculateRoadRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: 'car' | 'motorcycle' | 'walking' = 'car'
): Promise<RouteResult> {
  // Use 'foot' profile for walking, 'driving' for car/motorcycle
  const profile = travelMode === 'walking' ? 'foot' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Number((route.distance / 1000).toFixed(2));
        
        // Calculate duration based on travel mode
        // Car: use OSRM duration, Motorcycle/Walking: estimate based on distance
        const durationIsEstimated = travelMode === 'motorcycle' || travelMode === 'walking';
        const averageSpeedKmh = travelMode === 'car' ? 40 : travelMode === 'motorcycle' ? 35 : 5; // Walking ~5 km/h
        const totalMinutes = durationIsEstimated
          ? Math.max(1, Math.round((distanceKm / averageSpeedKmh) * 60))
          : Math.max(1, Math.round(route.duration / 60));

        let durationFormatted = '';
        if (totalMinutes >= 60) {
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          durationFormatted = mins > 0 ? `${hours} hr ${mins} mins` : `${hours} hr`;
        } else {
          durationFormatted = `${totalMinutes} mins`;
        }

        // Convert GeoJSON [lng, lat] coordinates to Leaflet [lat, lng]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        return {
          coordinates,
          distanceKm,
          durationMinutes: totalMinutes,
          durationFormatted,
          travelMode: travelMode === 'car' ? 'Car' : travelMode === 'motorcycle' ? 'Motorcycle' : 'Walking',
          durationIsEstimated,
          provider: 'OSRM OpenStreetMap Driving Engine',
        };
      }
    }
  } catch (err) {
    // Network fallback
  }

  // Fallback: geodesic straight line if routing server is unreachable
  const straightDist = haversineDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );
  const averageSpeedKmh = travelMode === 'car' ? 40 : travelMode === 'motorcycle' ? 35 : 5;
  const estMins = Math.max(2, Math.round((straightDist / averageSpeedKmh) * 60));
  const durationFormatted =
    estMins >= 60
      ? `${Math.floor(estMins / 60)} hr ${estMins % 60} mins`
      : `${estMins} mins`;

  return {
    coordinates: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
    distanceKm: straightDist,
    durationMinutes: estMins,
    durationFormatted,
    travelMode: travelMode === 'car' ? 'Car' : travelMode === 'motorcycle' ? 'Motorcycle' : 'Walking',
    durationIsEstimated: true,
    provider: 'Geodesic Calculation',
  };
}
