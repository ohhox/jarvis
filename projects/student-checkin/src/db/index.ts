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
    center_lat  REAL NOT NULL,
    center_lng  REAL NOT NULL,
    radius_m    REAL NOT NULL,
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

  CREATE INDEX IF NOT EXISTS idx_checkins_student ON checkins(student_id);
  CREATE INDEX IF NOT EXISTS idx_checkins_checked_at ON checkins(checked_at);
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
