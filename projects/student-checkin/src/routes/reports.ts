import { Router } from 'express';
import { db } from '../db/index.js';
import { requireRole } from '../lib/middleware.js';

export const reportsRouter = Router();

reportsRouter.use(requireRole('teacher'));

/**
 * รายงานเช็คอินรายวัน
 * query: ?date=YYYY-MM-DD (default = วันนี้ตามเวลาเซิร์ฟเวอร์)
 * คืน: รายการเช็คอินล่าสุดของนักเรียนแต่ละคนในวันนั้น + สรุป
 */
reportsRouter.get('/daily', (req, res) => {
  const date = typeof req.query.date === 'string' && req.query.date
    ? req.query.date
    : new Date().toISOString().slice(0, 10);

  // เช็คอินล่าสุดต่อคนต่อวัน
  const rows = db
    .prepare(
      `SELECT s.id AS student_id, s.student_code, s.full_name, s.class_room,
              s.phone, s.guardian_phone,
              c.status, c.distance_m, c.lat, c.lng, c.checked_at,
              z.name AS zone_name
       FROM students s
       LEFT JOIN checkins c ON c.id = (
         SELECT c2.id FROM checkins c2
         WHERE c2.student_id = s.id AND date(c2.checked_at) = ?
         ORDER BY c2.id DESC LIMIT 1
       )
       LEFT JOIN zones z ON z.id = c.zone_id
       ORDER BY s.class_room, s.student_code`,
    )
    .all(date) as Array<{ status: string | null }>;

  const summary = {
    date,
    total_students: rows.length,
    checked_in: rows.filter((r) => r.status === 'in_range').length,
    out_of_range: rows.filter((r) => r.status === 'out_of_range').length,
    not_checked_in: rows.filter((r) => r.status == null).length,
  };

  res.json({ summary, rows });
});

/** ประวัติเช็คอินทั้งหมดของนักเรียนคนหนึ่ง */
reportsRouter.get('/student/:id', (req, res) => {
  const id = Number(req.params.id);
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!student) return res.status(404).json({ error: 'ไม่พบนักเรียน' });

  const checkins = db
    .prepare(
      `SELECT c.*, z.name AS zone_name
       FROM checkins c LEFT JOIN zones z ON z.id = c.zone_id
       WHERE c.student_id = ? ORDER BY c.checked_at DESC LIMIT 100`,
    )
    .all(id);
  res.json({ student, checkins });
});

/** รายชื่อนักเรียนทั้งหมด */
reportsRouter.get('/students', (_req, res) => {
  const students = db
    .prepare('SELECT * FROM students ORDER BY class_room, student_code')
    .all();
  res.json({ students });
});
