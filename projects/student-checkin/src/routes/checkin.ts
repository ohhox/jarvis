import { Router } from 'express';
import { db } from '../db/index.js';
import { requireRole } from '../lib/middleware.js';
import {
  checkAgainstCircle,
  isValidLatLng,
  pointInPolygon,
  distanceToPolygonMeters,
  type LatLng,
} from '../lib/geo.js';
import type { Student, Zone } from '../types.js';

/** ประเมินว่าจุดอยู่ในพื้นที่ (วงกลมหรือ polygon) + ระยะห่าง */
function evaluateZone(lat: number, lng: number, zone: Zone): { inside: boolean; distance_m: number } {
  if (zone.type === 'polygon' && zone.polygon) {
    let poly: LatLng[];
    try {
      poly = JSON.parse(zone.polygon);
    } catch {
      return { inside: false, distance_m: Infinity };
    }
    const inside = pointInPolygon(lat, lng, poly);
    return { inside, distance_m: inside ? 0 : distanceToPolygonMeters(lat, lng, poly) };
  }
  return checkAgainstCircle(lat, lng, zone);
}

export const checkinRouter = Router();

/**
 * นักเรียนเช็คอินตำแหน่งปัจจุบัน
 * - หา zone ที่ active ที่นักเรียนอยู่ในวง (ใกล้สุดถ้ามีหลายวง)
 * - ถ้าอยู่ในวง = in_range → บันทึกและอนุญาตให้กลับบ้าน
 * - ถ้าไม่อยู่ในวงไหนเลย = out_of_range → บันทึกไว้เป็นหลักฐาน แต่ไม่ผ่าน
 */
checkinRouter.post('/', requireRole('student'), (req, res) => {
  const student = db
    .prepare('SELECT * FROM students WHERE line_user_id = ?')
    .get(req.auth!.sub) as Student | undefined;
  if (!student) {
    return res.status(403).json({ error: 'ยังไม่ได้ลงทะเบียน' });
  }

  // approval gate: เช็คอินได้เฉพาะนักเรียนที่ครูอนุมัติแล้ว
  if (student.status !== 'approved') {
    return res.status(403).json({
      error:
        student.status === 'rejected'
          ? `ข้อมูลไม่ถูกต้อง${student.review_note ? ': ' + student.review_note : ''} — กรุณาแก้ไขข้อมูล`
          : 'ข้อมูลของคุณอยู่ระหว่างรอครูตรวจสอบและอนุมัติ',
      status: student.status,
      review_note: student.review_note,
    });
  }

  const { lat, lng } = req.body ?? {};
  if (!isValidLatLng(lat, lng)) {
    return res.status(400).json({ error: 'พิกัดไม่ถูกต้อง' });
  }

  const zones = db
    .prepare('SELECT * FROM zones WHERE active = 1')
    .all() as Zone[];
  if (zones.length === 0) {
    return res.status(409).json({ error: 'ครูยังไม่ได้กำหนดพื้นที่เช็คอิน' });
  }

  // ประเมินทุกวง เลือกวงที่ "อยู่ใน" และใกล้ที่สุด; ถ้าไม่อยู่ในวงไหน เลือกวงที่ใกล้ที่สุด
  let best: { zone: Zone; distance_m: number; inside: boolean } | null = null;
  for (const zone of zones) {
    const { inside, distance_m } = evaluateZone(lat, lng, zone);
    if (
      best === null ||
      (inside && !best.inside) ||
      (inside === best.inside && distance_m < best.distance_m)
    ) {
      best = { zone, distance_m, inside };
    }
  }

  const status = best!.inside ? 'in_range' : 'out_of_range';
  const distance_m = Math.round(best!.distance_m);

  const info = db
    .prepare(
      `INSERT INTO checkins (student_id, zone_id, lat, lng, distance_m, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(student.id, best!.zone.id, lat, lng, distance_m, status);

  res.json({
    ok: best!.inside,
    status,
    distance_m,
    zone: { id: best!.zone.id, name: best!.zone.name, radius_m: best!.zone.radius_m },
    checkin_id: info.lastInsertRowid,
    message: best!.inside
      ? `เช็คอินสำเร็จ อยู่ในพื้นที่ "${best!.zone.name}"`
      : `ยังไม่อยู่ในพื้นที่ที่กำหนด (ห่างจาก "${best!.zone.name}" ${distance_m} ม.)`,
  });
});

/** ประวัติเช็คอินของตัวเอง */
checkinRouter.get('/mine', requireRole('student'), (req, res) => {
  const student = db
    .prepare('SELECT * FROM students WHERE line_user_id = ?')
    .get(req.auth!.sub) as Student | undefined;
  if (!student) return res.json({ checkins: [] });

  const checkins = db
    .prepare(
      `SELECT c.*, z.name AS zone_name
       FROM checkins c LEFT JOIN zones z ON z.id = c.zone_id
       WHERE c.student_id = ?
       ORDER BY c.id DESC LIMIT 30`,
    )
    .all(student.id);
  res.json({ checkins });
});
