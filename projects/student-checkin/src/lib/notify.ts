import { db } from '../db/index.js';
import { config } from '../config.js';

/**
 * ส่ง push message ผ่าน LINE Messaging API
 * คืน true ถ้าส่งสำเร็จจริง, false ถ้าอยู่โหมด mock / ไม่มี token / error
 */
async function pushLine(to: string, text: string): Promise<boolean> {
  // mock user (mock:xxx) หรือยังไม่ตั้ง token → ไม่ push จริง
  if (!config.lineMessagingToken || !to || to.startsWith('mock:')) return false;
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.lineMessagingToken}`,
      },
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    });
    if (!res.ok) console.error('LINE push failed', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('LINE push error', err);
    return false;
  }
}

function record(targetType: 'student' | 'admin', target: string, text: string, delivered: boolean) {
  db.prepare(
    'INSERT INTO notifications (target_type, target, text, delivered) VALUES (?, ?, ?, ?)',
  ).run(targetType, target, text, delivered ? 1 : 0);
  const tag = delivered ? 'LINE✓' : 'log';
  console.log(`🔔 [${tag}] → ${targetType}${target ? ' ' + target : ''}: ${text}`);
}

/** แจ้งเตือนนักเรียน (ไม่ throw — บันทึก log เสมอ ถึงจะ push ไม่สำเร็จ) */
export async function notifyStudent(lineUserId: string, text: string): Promise<void> {
  const delivered = await pushLine(lineUserId, text);
  record('student', lineUserId, text, delivered);
}

/** แจ้งเตือนครู/แอดมิน */
export async function notifyAdmin(text: string): Promise<void> {
  const delivered = await pushLine(config.adminLineTarget, text);
  record('admin', config.adminLineTarget, text, delivered);
}
