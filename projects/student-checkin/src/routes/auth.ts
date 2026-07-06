import { Router } from 'express';
import { db } from '../db/index.js';
import { config, MOCK_MODE } from '../config.js';
import { resolveLineProfile, AuthError } from '../lib/line.js';
import { signToken, verifyPassword } from '../lib/auth.js';
import type { Student, Teacher } from '../types.js';

export const authRouter = Router();

/**
 * นักเรียนเข้าระบบจาก LIFF
 * รับ idToken (จริง) หรือ mockUserId (mock mode)
 * คืน token + สถานะว่าลงทะเบียนแล้วหรือยัง
 */
authRouter.post('/line', async (req, res) => {
  try {
    const { idToken, mockUserId, mockName } = req.body ?? {};
    const profile = await resolveLineProfile({ idToken, mockUserId, mockName });

    const student = db
      .prepare('SELECT * FROM students WHERE line_user_id = ?')
      .get(profile.userId) as Student | undefined;

    const token = signToken({
      role: 'student',
      sub: profile.userId,
      id: student?.id,
    });

    res.json({
      token,
      lineProfile: profile,
      registered: Boolean(student),
      student: student ?? null,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(401).json({ error: err.message });
    }
    console.error('auth/line error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

/** ครูเข้าระบบด้วย username/password */
authRouter.post('/teacher/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: 'ต้องกรอก username และ password' });
  }
  const teacher = db
    .prepare('SELECT * FROM teachers WHERE username = ?')
    .get(String(username)) as Teacher | undefined;

  if (!teacher || !verifyPassword(String(password), teacher.password_hash)) {
    return res.status(401).json({ error: 'username หรือ password ไม่ถูกต้อง' });
  }

  const token = signToken({ role: 'teacher', sub: teacher.username, id: teacher.id });
  res.json({ token, teacher: { username: teacher.username, full_name: teacher.full_name } });
});

/** config สำหรับ frontend (LIFF ID, โหมด mock) */
authRouter.get('/config', (_req, res) => {
  res.json({ liffId: config.liffId, mockMode: MOCK_MODE });
});
