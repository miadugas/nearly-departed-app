// Distance between two points on the globe, for proximity checks that must be
// measured from the *device* rather than from whatever place was searched.

/**
 * How close you have to be for a visit to count. Wikidata gives one coordinate
 * per burial place, so a large cemetery collapses to a single pin — the radius
 * has to cover the grounds, not the grave. ~0.5 mi.
 */
export const VISIT_RADIUS_KM = 0.8;

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres between two `[lat, lon]` pairs. */
export function haversineKm(
  a: [number, number],
  b: [number, number],
): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon;

  // asin form (rather than atan2) is stable enough here and cheaper; clamp
  // guards float drift pushing h just past 1 for antipodal points.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, h)));
}
