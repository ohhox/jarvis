import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..');

// โหลด .env แบบง่าย ๆ โดยไม่ต้องพึ่ง dependency (ถ้ามีไฟล์)
function loadDotenv() {
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // ไม่มี .env ก็ใช้ default / env จริง
  }
}
loadDotenv();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  appSecret: process.env.APP_SECRET ?? 'dev-insecure-secret-change-me',
  liffId: process.env.LIFF_ID ?? '',
  lineLoginChannelId: process.env.LINE_LOGIN_CHANNEL_ID ?? '',
  // Messaging API (สำหรับ push แจ้งเตือน) — คนละ channel กับ Login
  lineMessagingToken: process.env.LINE_MESSAGING_TOKEN ?? '',
  // ปลายทางแจ้งเตือนครู: LINE userId หรือ groupId (ครู/กลุ่มครู)
  adminLineTarget: process.env.ADMIN_LINE_TARGET ?? '',
  teacher: {
    username: process.env.TEACHER_USERNAME ?? 'teacher',
    password: process.env.TEACHER_PASSWORD ?? 'teacher1234',
    name: process.env.TEACHER_NAME ?? 'ครูประจำชั้น',
  },
  dbPath: join(ROOT, 'data', 'checkin.sqlite'),
};

// MOCK MODE: ถ้ายังไม่ได้ตั้งค่า LINE จริง ระบบจะรับ mock profile เพื่อให้ทดสอบ flow ได้
export const MOCK_MODE = !config.lineLoginChannelId;
