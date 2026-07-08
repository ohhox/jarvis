import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../lib/middleware.js';

export const newsRouter = Router();

/** อ่านข่าว — ทั้งครูและนักเรียน (ปักหมุดขึ้นก่อน แล้วล่าสุดก่อน) */
newsRouter.get('/', requireAuth, (_req, res) => {
  const news = db
    .prepare('SELECT * FROM news ORDER BY pinned DESC, id DESC LIMIT 50')
    .all();
  res.json({ news });
});

/** ครูโพสต์ข่าว */
newsRouter.post('/', requireRole('teacher'), (req, res) => {
  const { title, body, pinned } = req.body ?? {};
  if (!title || String(title).trim() === '') {
    return res.status(400).json({ error: 'ต้องมีหัวข้อข่าว' });
  }
  const info = db
    .prepare('INSERT INTO news (title, body, pinned) VALUES (?, ?, ?)')
    .run(String(title).trim(), String(body ?? ''), pinned ? 1 : 0);
  const item = db.prepare('SELECT * FROM news WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ news: item });
});

/** ครูลบข่าว */
newsRouter.delete('/:id', requireRole('teacher'), (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});
