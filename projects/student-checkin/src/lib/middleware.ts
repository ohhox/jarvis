import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from './auth.js';
import type { TokenPayload } from '../types.js';

// แนบ auth payload ไว้บน request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

export function requireRole(role: 'student' | 'teacher') {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = verifyToken(extractToken(req));
    if (!payload || payload.role !== role) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    req.auth = payload;
    next();
  };
}
