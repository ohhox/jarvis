import { Router } from 'express';
import { db } from '../db/index.js';
import { requireRole } from '../lib/middleware.js';
import { isValidLatLng } from '../lib/geo.js';
import type { Zone } from '../types.js';

export const zonesRouter = Router();

// ต้องเป็นครูทุก endpoint
zonesRouter.use(requireRole('teacher'));

zonesRouter.get('/', (_req, res) => {
  const zones = db.prepare('SELECT * FROM zones ORDER BY created_at DESC').all();
  res.json({ zones });
});

zonesRouter.post('/', (req, res) => {
  const { name, center_lat, center_lng, radius_m, active } = req.body ?? {};
  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: 'ต้องตั้งชื่อพื้นที่' });
  }
  if (!isValidLatLng(center_lat, center_lng)) {
    return res.status(400).json({ error: 'พิกัดศูนย์กลางไม่ถูกต้อง' });
  }
  const radius = Number(radius_m);
  if (!Number.isFinite(radius) || radius <= 0 || radius > 100_000) {
    return res.status(400).json({ error: 'รัศมีต้องมากกว่า 0 และไม่เกิน 100 กม.' });
  }

  const info = db
    .prepare(
      `INSERT INTO zones (name, center_lat, center_lng, radius_m, active)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(String(name).trim(), center_lat, center_lng, radius, active === false ? 0 : 1);

  const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ zone });
});

zonesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM zones WHERE id = ?').get(id) as Zone | undefined;
  if (!existing) return res.status(404).json({ error: 'ไม่พบพื้นที่' });

  const { name, center_lat, center_lng, radius_m, active } = req.body ?? {};
  const nextName = name != null ? String(name).trim() : existing.name;
  const nextLat = center_lat != null ? Number(center_lat) : existing.center_lat;
  const nextLng = center_lng != null ? Number(center_lng) : existing.center_lng;
  const nextRadius = radius_m != null ? Number(radius_m) : existing.radius_m;
  const nextActive = active != null ? (active ? 1 : 0) : existing.active;

  if (!isValidLatLng(nextLat, nextLng)) {
    return res.status(400).json({ error: 'พิกัดไม่ถูกต้อง' });
  }
  if (!Number.isFinite(nextRadius) || nextRadius <= 0 || nextRadius > 100_000) {
    return res.status(400).json({ error: 'รัศมีไม่ถูกต้อง' });
  }

  db.prepare(
    `UPDATE zones SET name = ?, center_lat = ?, center_lng = ?, radius_m = ?, active = ? WHERE id = ?`,
  ).run(nextName, nextLat, nextLng, nextRadius, nextActive, id);

  const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(id);
  res.json({ zone });
});

zonesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM zones WHERE id = ?').run(id);
  res.json({ ok: true });
});
