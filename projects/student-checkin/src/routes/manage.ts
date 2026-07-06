import { Router } from 'express';
import { db } from '../db/index.js';
import { requireRole } from '../lib/middleware.js';
import type { Student, StudentStatus } from '../types.js';

export const manageRouter = Router();

// ทุก endpoint เป็นของครูเท่านั้น
manageRouter.use(requireRole('teacher'));

/** รายชื่อนักเรียนทั้งหมด + สรุปจำนวนแต่ละสถานะ (?status=pending เพื่อกรอง) */
manageRouter.get('/students', (req, res) => {
  const filter = req.query.status;
  let rows: Student[];
  if (filter === 'pending' || filter === 'approved' || filter === 'rejected') {
    rows = db
      .prepare('SELECT * FROM students WHERE status = ? ORDER BY created_at DESC')
      .all(filter) as Student[];
  } else {
    rows = db
      .prepare('SELECT * FROM students ORDER BY created_at DESC')
      .all() as Student[];
  }
  const counts = db
    .prepare('SELECT status, COUNT(*) AS n FROM students GROUP BY status')
    .all() as Array<{ status: StudentStatus; n: number }>;
  const summary = { pending: 0, approved: 0, rejected: 0 };
  for (const c of counts) summary[c.status] = c.n;
  res.json({ students: rows, summary });
});

/** อนุมัติ / ปฏิเสธ นักเรียน */
manageRouter.post('/students/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status, note } = req.body ?? {};
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'status ต้องเป็น approved หรือ rejected' });
  }
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as Student | undefined;
  if (!existing) return res.status(404).json({ error: 'ไม่พบนักเรียน' });

  db.prepare('UPDATE students SET status = ?, review_note = ? WHERE id = ?').run(
    status,
    status === 'rejected' ? String(note ?? '') : '',
    id,
  );
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.json({ student });
});

/** ครูแก้ไขข้อมูลนักเรียน (ไม่เปลี่ยนสถานะการอนุมัติ) */
manageRouter.put('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as Student | undefined;
  if (!existing) return res.status(404).json({ error: 'ไม่พบนักเรียน' });

  const { student_code, full_name, class_room, phone, guardian_phone } = req.body ?? {};
  if (!student_code || !full_name) {
    return res.status(400).json({ error: 'ต้องกรอกเลขประจำตัวและชื่อ-สกุล' });
  }
  db.prepare(
    `UPDATE students SET student_code = ?, full_name = ?, class_room = ?, phone = ?, guardian_phone = ?
     WHERE id = ?`,
  ).run(
    String(student_code),
    String(full_name),
    String(class_room ?? ''),
    String(phone ?? ''),
    String(guardian_phone ?? ''),
    id,
  );
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  res.json({ student });
});

/** ลบนักเรียน (พร้อมประวัติเช็คอิน — cascade) */
manageRouter.delete('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  res.json({ ok: true });
});
