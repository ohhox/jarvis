import { Router } from 'express';
import { db } from '../db/index.js';
import { requireRole } from '../lib/middleware.js';
import { signToken } from '../lib/auth.js';
import { notifyAdmin } from '../lib/notify.js';
import type { Student } from '../types.js';

export const studentsRouter = Router();

/** ข้อมูลตัวเองของนักเรียน (ต้อง login) */
studentsRouter.get('/me', requireRole('student'), (req, res) => {
  const student = db
    .prepare('SELECT * FROM students WHERE line_user_id = ?')
    .get(req.auth!.sub) as Student | undefined;
  res.json({ registered: Boolean(student), student: student ?? null });
});

/**
 * ลงทะเบียนครั้งแรก — ผูก LINE user id กับข้อมูลนักเรียน
 * ถ้าเคยลงทะเบียนแล้ว = อัปเดตข้อมูล (upsert)
 */
studentsRouter.post('/register', requireRole('student'), (req, res) => {
  const lineUserId = req.auth!.sub;
  const { student_code, full_name, class_room, phone, guardian_phone } = req.body ?? {};

  if (!student_code || !full_name) {
    return res.status(400).json({ error: 'ต้องกรอกเลขประจำตัวและชื่อ-สกุล' });
  }

  const existing = db
    .prepare('SELECT * FROM students WHERE line_user_id = ?')
    .get(lineUserId) as Student | undefined;

  if (existing) {
    // นักเรียนแก้ข้อมูลเอง → กลับไปสถานะรอตรวจสอบใหม่ (กันแก้ข้อมูลหลบการอนุมัติ)
    db.prepare(
      `UPDATE students SET student_code = ?, full_name = ?, class_room = ?, phone = ?, guardian_phone = ?,
              status = 'pending', review_note = ''
       WHERE line_user_id = ?`,
    ).run(
      String(student_code),
      String(full_name),
      String(class_room ?? ''),
      String(phone ?? ''),
      String(guardian_phone ?? ''),
      lineUserId,
    );
  } else {
    db.prepare(
      `INSERT INTO students (line_user_id, student_code, full_name, class_room, phone, guardian_phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      lineUserId,
      String(student_code),
      String(full_name),
      String(class_room ?? ''),
      String(phone ?? ''),
      String(guardian_phone ?? ''),
    );
  }

  const student = db
    .prepare('SELECT * FROM students WHERE line_user_id = ?')
    .get(lineUserId) as Student;

  // แจ้งครูว่ามีนักเรียนรออนุมัติ (fire-and-forget, ไม่บล็อก response)
  const classText = student.class_room ? ` (${student.class_room})` : '';
  void notifyAdmin(
    existing
      ? `📝 นักเรียนแก้ไขข้อมูลและรอตรวจสอบใหม่: ${student.full_name}${classText}`
      : `🆕 มีนักเรียนใหม่รออนุมัติ: ${student.full_name}${classText} เลขที่ ${student.student_code}`,
  );

  // ออก token ใหม่ที่มี student id แนบมาด้วย
  const token = signToken({ role: 'student', sub: lineUserId, id: student.id });
  res.json({ student, token });
});
