import { Router } from 'express';
import { db } from '../db/index.js';
import { requireRole } from '../lib/middleware.js';
import { isValidLatLng, polygonCentroid, type LatLng } from '../lib/geo.js';
import type { Zone } from '../types.js';

export const zonesRouter = Router();

// ต้องเป็นครูทุก endpoint
zonesRouter.use(requireRole('teacher'));

interface Geometry {
  type: 'circle' | 'polygon';
  center_lat: number;
  center_lng: number;
  radius_m: number;
  polygon: string | null;
}

/** ตรวจและแปลง payload เป็นค่าที่เก็บลง DB (throw ข้อความไทยถ้าไม่ถูกต้อง) */
function buildGeometry(body: any): Geometry {
  const type = body.type === 'polygon' ? 'polygon' : 'circle';

  if (type === 'polygon') {
    let raw = body.polygon;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = null; }
    }
    if (!Array.isArray(raw) || raw.length < 3) {
      throw new Error('รูปหลายเหลี่ยมต้องมีอย่างน้อย 3 จุด');
    }
    const poly: LatLng[] = [];
    for (const p of raw) {
      const lat = Array.isArray(p) ? Number(p[0]) : Number(p?.lat);
      const lng = Array.isArray(p) ? Number(p[1]) : Number(p?.lng);
      if (!isValidLatLng(lat, lng)) throw new Error('พิกัดจุดมุมไม่ถูกต้อง');
      poly.push([lat, lng]);
    }
    const c = polygonCentroid(poly);
    return { type, center_lat: c.lat, center_lng: c.lng, radius_m: 0, polygon: JSON.stringify(poly) };
  }

  // circle
  const center_lat = Number(body.center_lat);
  const center_lng = Number(body.center_lng);
  if (!isValidLatLng(center_lat, center_lng)) throw new Error('พิกัดศูนย์กลางไม่ถูกต้อง');
  const radius_m = Number(body.radius_m);
  if (!Number.isFinite(radius_m) || radius_m <= 0 || radius_m > 100_000) {
    throw new Error('รัศมีต้องมากกว่า 0 และไม่เกิน 100 กม.');
  }
  return { type, center_lat, center_lng, radius_m, polygon: null };
}

zonesRouter.get('/', (_req, res) => {
  const zones = db.prepare('SELECT * FROM zones ORDER BY created_at DESC').all();
  res.json({ zones });
});

zonesRouter.post('/', (req, res) => {
  const { name, active } = req.body ?? {};
  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: 'ต้องตั้งชื่อพื้นที่' });
  }
  let geo: Geometry;
  try {
    geo = buildGeometry(req.body ?? {});
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  const info = db
    .prepare(
      `INSERT INTO zones (name, type, center_lat, center_lng, radius_m, polygon, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      String(name).trim(), geo.type, geo.center_lat, geo.center_lng,
      geo.radius_m, geo.polygon, active === false ? 0 : 1,
    );

  const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ zone });
});

zonesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM zones WHERE id = ?').get(id) as Zone | undefined;
  if (!existing) return res.status(404).json({ error: 'ไม่พบพื้นที่' });

  const body = req.body ?? {};
  const nextName = body.name != null ? String(body.name).trim() : existing.name;
  const nextActive = body.active != null ? (body.active ? 1 : 0) : existing.active;

  // แก้ geometry เฉพาะเมื่อส่ง type / พิกัด / polygon มา (เช่น toggle active จะไม่แตะ geometry)
  const geometryChanged =
    body.type != null || body.center_lat != null || body.radius_m != null || body.polygon != null;

  let geo: Geometry;
  if (geometryChanged) {
    try {
      geo = buildGeometry({ ...existing, ...body });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  } else {
    geo = {
      type: existing.type,
      center_lat: existing.center_lat,
      center_lng: existing.center_lng,
      radius_m: existing.radius_m,
      polygon: existing.polygon,
    };
  }

  db.prepare(
    `UPDATE zones SET name = ?, type = ?, center_lat = ?, center_lng = ?, radius_m = ?, polygon = ?, active = ?
     WHERE id = ?`,
  ).run(nextName, geo.type, geo.center_lat, geo.center_lng, geo.radius_m, geo.polygon, nextActive, id);

  const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(id);
  res.json({ zone });
});

zonesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM zones WHERE id = ?').run(id);
  res.json({ ok: true });
});
