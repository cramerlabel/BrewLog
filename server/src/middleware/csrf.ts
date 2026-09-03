import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../env.js';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Double-submit cookie CSRF protection: a readable cookie must be echoed back in a header
// on state-changing requests, which a cross-site form/fetch cannot do on the victim's behalf.
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  let token = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: env.NODE_ENV === 'production',
      path: '/',
    });
  }

  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const headerToken = req.get(CSRF_HEADER);
  if (!headerToken || headerToken !== token) {
    res.status(403).json({ error: 'Invalid or missing CSRF token' });
    return;
  }
  next();
}
