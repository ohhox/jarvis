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

export type LatLng = [number, number]; // [lat, lng]

/** จุดอยู่ในรูปหลายเหลี่ยมหรือไม่ (ray casting; x=lng, y=lat) */
export function pointInPolygon(lat: number, lng: number, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i][0], xi = poly[i][1];
    const yj = poly[j][0], xj = poly[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** ระยะจากจุดไปหาขอบรูปหลายเหลี่ยมที่ใกล้ที่สุด (เมตร) — 0 ถ้าอยู่ข้างใน */
export function distanceToPolygonMeters(lat: number, lng: number, poly: LatLng[]): number {
  if (pointInPolygon(lat, lng, poly)) return 0;
  let min = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    min = Math.min(
      min,
      pointToSegmentMeters(lat, lng, poly[j][0], poly[j][1], poly[i][0], poly[i][1]),
    );
  }
  return min;
}

// ระยะจุด-ถึง-ส่วนของเส้น โดยฉายเป็นระนาบเมตรรอบจุด (equirectangular)
function pointToSegmentMeters(
  plat: number, plng: number,
  alat: number, alng: number,
  blat: number, blng: number,
): number {
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((plat * Math.PI) / 180);
  const ax = (alng - plng) * mPerDegLng, ay = (alat - plat) * mPerDegLat;
  const bx = (blng - plng) * mPerDegLng, by = (blat - plat) * mPerDegLat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((-ax) * dx + (-ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(cx, cy);
}

/** centroid ของรูปหลายเหลี่ยม (เฉลี่ยพิกัดมุม) — ใช้จัดกึ่งกลางแผนที่ */
export function polygonCentroid(poly: LatLng[]): { lat: number; lng: number } {
  const n = poly.length || 1;
  const sum = poly.reduce((a, p) => ({ lat: a.lat + p[0], lng: a.lng + p[1] }), { lat: 0, lng: 0 });
  return { lat: sum.lat / n, lng: sum.lng / n };
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
