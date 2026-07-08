import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS students (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    line_user_id  TEXT NOT NULL UNIQUE,
    student_code  TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    class_room    TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL DEFAULT '',
    guardian_phone TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    review_note   TEXT NOT NULL DEFAULT '',         -- เหตุผลตอนปฏิเสธ / โน้ตจากครู
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS zones (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'circle',  -- circle | polygon
    center_lat  REAL NOT NULL,                   -- circle=จุดศูนย์กลาง, polygon=centroid
    center_lng  REAL NOT NULL,
    radius_m    REAL NOT NULL,                   -- circle เท่านั้น (polygon=0)
    polygon     TEXT,                            -- polygon: JSON [[lat,lng],...]
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    zone_id     INTEGER REFERENCES zones(id) ON DELETE SET NULL,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    distance_m  REAL NOT NULL,
    status      TEXT NOT NULL,
    checked_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS news (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    pinned     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    leave_type  TEXT NOT NULL,               -- sick | personal
    date_from   TEXT NOT NULL,               -- YYYY-MM-DD
    date_to     TEXT NOT NULL,
    reason      TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    review_note TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,               -- 'student' | 'admin'
    target      TEXT NOT NULL DEFAULT '',    -- line_user_id / admin target
    text        TEXT NOT NULL,
    delivered   INTEGER NOT NULL DEFAULT 0,  -- push ผ่าน LINE จริงสำเร็จไหม
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_checkins_student ON checkins(student_id);
  CREATE INDEX IF NOT EXISTS idx_checkins_checked_at ON checkins(checked_at);
  CREATE INDEX IF NOT EXISTS idx_leaves_student ON leaves(student_id);
`);

// ===== Migration: เพิ่มคอลัมน์ approval ให้ DB เก่าที่ยังไม่มี =====
function hasColumn(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}
if (!hasColumn('students', 'status')) {
  db.exec(`ALTER TABLE students ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`);
}
if (!hasColumn('students', 'review_note')) {
  db.exec(`ALTER TABLE students ADD COLUMN review_note TEXT NOT NULL DEFAULT ''`);
}
if (!hasColumn('zones', 'type')) {
  db.exec(`ALTER TABLE zones ADD COLUMN type TEXT NOT NULL DEFAULT 'circle'`);
}
if (!hasColumn('zones', 'polygon')) {
  db.exec(`ALTER TABLE zones ADD COLUMN polygon TEXT`);
}
