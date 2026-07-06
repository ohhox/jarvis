const EARTH_RADIUS_M = 6_371_000;

/**
 * ระยะทางระหว่างสองพิกัด (เมตร) ด้วยสูตร haversine
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export interface Circle {
  center_lat: number;
  center_lng: number;
  radius_m: number;
}

/** อยู่ในวงกลม (geofence) หรือไม่ + ระยะห่างจากจุดศูนย์กลาง */
export function checkAgainstCircle(
  lat: number,
  lng: number,
  circle: Circle,
): { inside: boolean; distance_m: number } {
  const distance_m = haversineMeters(lat, lng, circle.center_lat, circle.center_lng);
  return { inside: distance_m <= circle.radius_m, distance_m };
}

export function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
