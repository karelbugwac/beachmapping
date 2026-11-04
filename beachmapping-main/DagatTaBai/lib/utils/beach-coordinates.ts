export function getValidBeachCoordinates(
  latitude: unknown,
  longitude: unknown
): { latitude: number; longitude: number } | null {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const hasLatitude = typeof latitude === 'number' || (typeof latitude === 'string' && latitude.trim() !== '');
  const hasLongitude = typeof longitude === 'number' || (typeof longitude === 'string' && longitude.trim() !== '');

  if (
    !hasLatitude ||
    !hasLongitude ||
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}
