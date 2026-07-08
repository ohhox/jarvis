import { Router } from 'express';
import { db } from '../db/index.js';
import { requireRole } from '../lib/middleware.js';
import { notifyStudent, notifyAdmin } from '../lib/notify.js';
import type { Leave, Student } from '../types.js';

export const leavesRouter = Router();

// ---- ฝั่งนักเรียน ----

/** นักเรียนส่งคำขอลา */
leavesRouter.post('/', requireRole('student'), (req, res) => {
  const student = db
    .prepare('SELECT * FROM students WHERE line_user_id = ?')
    .get(req.auth!.sub) as Student | undefined;
  if (!student) return res.status(403).json({ error: 'ยังไม่ได้ลงทะเบียน' });

  const { leave_type, date_from, date_to, reason } = req.body ?? {};
  const type = leave_type === 'personal' ? 'personal' : 'sick';
  if (!date_from) return res.status(400).json({ error: 'ต้องระบุวันที่ลา' });
  const from = String(date_from);
  const to = String(date_to || date_from);
  if (to < from) return res.status(400).json({ error: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม' });

  const info = db
    .prepare(
      `INSERT INTO leaves (student_id, leave_type, date_from, date_to, reason)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(student.id, type, from, to, String(reason ?? ''));

  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(info.lastInsertRowid) as Leave;
  const label = type === 'sick' ? 'ลาป่วย' : 'ลากิจ';
  void notifyAdmin(`📝 คำขอลาใหม่: ${student.full_name} (${label} ${from}${to !== from ? '–' + to : ''})`);
  res.status(201).json({ leave });
});

/** ประวัติคำขอลาของตัวเอง */
leavesRouter.get('/mine', requireRole('student'), (req, res) => {
  const student = db
    .prepare('SELECT * FROM students WHERE line_user_id = ?')
    .get(req.auth!.sub) as Student | undefined;
  if (!student) return res.json({ leaves: [] });
  const leaves = db
    .prepare('SELECT * FROM leaves WHERE student_id = ? ORDER BY id DESC LIMIT 50')
    .all(student.id);
  res.json({ leaves });
});

// ---- ฝั่งครู ----

/** ครูดูคำขอลาทั้งหมด (?status=pending เพื่อกรอง) */
leavesRouter.get('/', requireRole('teacher'), (req, res) => {
  const filter = req.query.status;
  const where =
    filter === 'pending' || filter === 'approved' || filter === 'rejected'
      ? 'WHERE l.status = ?'
      : '';
  const stmt = db.prepare(
    `SELECT l.*, s.full_name, s.student_code, s.class_room
     FROM leaves l JOIN students s ON s.id = l.student_id
     ${where}
     ORDER BY l.id DESC LIMIT 100`,
  );
  const leaves = where ? stmt.all(filter) : stmt.all();
  res.json({ leaves });
});

/** ครูอนุมัติ/ปฏิเสธคำขอลา */
leavesRouter.post('/:id/status', requireRole('teacher'), (req, res) => {
  const id = Number(req.params.id);
  const { status, note } = req.body ?? {};
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'status ต้องเป็น approved หรือ rejected' });
  }
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id) as Leave | undefined;
  if (!leave) return res.status(404).json({ error: 'ไม่พบคำขอลา' });

  const reason = status === 'rejected' ? String(note ?? '') : '';
  db.prepare('UPDATE leaves SET status = ?, review_note = ? WHERE id = ?').run(status, reason, id);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(leave.student_id) as Student;
  const label = leave.leave_type === 'sick' ? 'ลาป่วย' : 'ลากิจ';
  void notifyStudent(
    student.line_user_id,
    status === 'approved'
      ? `✅ คำขอ${label} (${leave.date_from}) ได้รับการอนุมัติแล้ว`
      : `❌ คำขอ${label} (${leave.date_from}) ไม่อนุมัติ${reason ? ': ' + reason : ''}`,
  );

  const updated = db.prepare('SELECT * FROM leaves WHERE id = ?').get(id);
  res.json({ leave: updated });
});
