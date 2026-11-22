import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const COOKIE_NAME = 'nm_admin_session';

// Daily salt rotated automatically per UTC day; never store raw IPs
let saltDay = '';
let dailySalt = '';

function getDailySalt(): string {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== saltDay) {
    saltDay = today;
    dailySalt = crypto.randomBytes(16).toString('hex');
  }
  return dailySalt;
}

export function hashIpDaily(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(`${getDailySalt()}:${ip || 'unknown'}`)
    .digest('hex')
    .slice(0, 24);
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, BucketEntry>();

export function createRateLimiter(bucketName: string, maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const key = `${bucketName}:${hashIpDaily(rawIp)}`;
    const now = Date.now();
    const entry = rateBuckets.get(key);

    if (!entry || now > entry.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }

    entry.count += 1;
    next();
  };
}

function getAdminSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    'dev-fallback-session-secret-change-in-prod'
  );
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim() || 'demo-admin-2026';
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    // Perform dummy equal-length compare to reduce timing variance
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function signAdminToken(): string {
  const payload = `admin:${Date.now() + 8 * 60 * 60 * 1000}`;
  const sig = crypto
    .createHmac('sha256', getAdminSecret())
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [role, expStr, sig] = parts;
    if (role !== 'admin') return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    const expectedSig = crypto
      .createHmac('sha256', getAdminSecret())
      .update(`${role}:${expStr}`)
      .digest('hex');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function setAdminCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const flags = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=28800',
  ];
  if (isProd) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
}

export function clearAdminCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const cookies = parseCookies(req.headers.cookie);
  if (!verifyAdminToken(cookies[COOKIE_NAME])) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export function isAdminRequest(req: Request): boolean {
  const cookies = parseCookies(req.headers.cookie);
  return verifyAdminToken(cookies[COOKIE_NAME]);
}

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Permissions-Policy',
    'microphone=(self), camera=(), geolocation=(), payment=()',
  );
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'",
    );
  }
  next();
}
