import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { config } from '../config.js';
import type { TokenPayload } from '../types.js';

// ===== Password hashing (scrypt) =====

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 32);
  const hashBuf = Buffer.from(hash, 'hex');
  return derived.length === hashBuf.length && timingSafeEqual(derived, hashBuf);
}

// ===== Signed tokens (mini-JWT ด้วย HMAC) =====

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 ชั่วโมง

export function signToken(payload: Omit<TokenPayload, 'exp'>): string {
  const full: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const body = base64url(JSON.stringify(full));
  const sig = base64url(createHmac('sha256', config.appSecret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = base64url(
    createHmac('sha256', config.appSecret).update(body).digest(),
  );
  const a = fromBase64url(sig);
  const b = fromBase64url(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromBase64url(body).toString('utf8')) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
