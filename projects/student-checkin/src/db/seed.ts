import { db } from './index.js';
import { config } from '../config.js';
import { hashPassword } from '../lib/auth.js';
import type { Teacher } from '../types.js';

/**
 * สร้างบัญชีครูเริ่มต้น + พื้นที่ตัวอย่าง (รันครั้งแรกเท่านั้น)
 */
export function ensureSeed() {
  const teacher = db
    .prepare('SELECT * FROM teachers WHERE username = ?')
    .get(config.teacher.username) as Teacher | undefined;

  if (!teacher) {
    db.prepare(
      'INSERT INTO teachers (username, password_hash, full_name) VALUES (?, ?, ?)',
    ).run(config.teacher.username, hashPassword(config.teacher.password), config.teacher.name);
    console.log(`✅ สร้างบัญชีครู: ${config.teacher.username} / ${config.teacher.password}`);
  }

  const zoneCount = (
    db.prepare('SELECT COUNT(*) AS n FROM zones').get() as { n: number }
  ).n;
  if (zoneCount === 0) {
    // ตัวอย่าง: หน้าโรงเรียน (พิกัดสมมติแถวอนุสาวรีย์ชัยฯ) รัศมี 200 ม.
    db.prepare(
      `INSERT INTO zones (name, center_lat, center_lng, radius_m, active)
       VALUES (?, ?, ?, ?, 1)`,
    ).run('หน้าโรงเรียน (ตัวอย่าง)', 13.7649, 100.5383, 200);
    console.log('✅ สร้างพื้นที่เช็คอินตัวอย่าง 1 จุด');
  }
}

// รันตรง ๆ ด้วย `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureSeed();
  console.log('เสร็จสิ้น');
}
