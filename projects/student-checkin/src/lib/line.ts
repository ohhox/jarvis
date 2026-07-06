import { config, MOCK_MODE } from '../config.js';
import type { LineProfile } from '../types.js';

/**
 * ตรวจ id_token จาก LINE LIFF ฝั่ง server
 *
 * - โหมดจริง: เรียก LINE verify endpoint ด้วย LINE_LOGIN_CHANNEL_ID
 * - MOCK MODE (ยังไม่ตั้งค่า LINE): รับ mockUserId/mockName จาก client ตรง ๆ
 *   เพื่อให้ทดสอบ flow ได้โดยไม่ต้องมี channel จริง
 */
export async function resolveLineProfile(input: {
  idToken?: string;
  mockUserId?: string;
  mockName?: string;
}): Promise<LineProfile> {
  if (MOCK_MODE) {
    const userId = (input.mockUserId ?? '').trim();
    if (!userId) {
      throw new AuthError('MOCK MODE: ต้องส่ง mockUserId มาด้วย');
    }
    return {
      userId: `mock:${userId}`,
      displayName: input.mockName?.trim() || `ผู้ใช้ ${userId}`,
    };
  }

  if (!input.idToken) {
    throw new AuthError('ต้องส่ง idToken จาก LIFF มาด้วย');
  }

  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: input.idToken,
      client_id: config.lineLoginChannelId,
    }),
  });

  if (!res.ok) {
    throw new AuthError('ยืนยัน LINE id_token ไม่สำเร็จ');
  }

  const data = (await res.json()) as {
    sub?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub) {
    throw new AuthError('LINE id_token ไม่มี user id');
  }
  return {
    userId: data.sub,
    displayName: data.name ?? 'นักเรียน',
    pictureUrl: data.picture,
  };
}

export class AuthError extends Error {}
