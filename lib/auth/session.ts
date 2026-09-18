import 'server-only';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Stateless, tamper-proof admin session.
 *
 * Token format:  base64url(payloadJson).base64url(hmacSha256)
 * Payload:       { sub: 'admin', iat: <ms>, exp: <ms>, jti: <random> }
 *
 * The token is stored ONLY in an HttpOnly + Secure + SameSite=Strict cookie so
 * it is unreadable from JavaScript (no XSS token theft) and is not attached to
 * cross-site requests (CSRF mitigation).
 */

/**
 * The `__Host-` prefix is the strongest cookie binding available: the browser
 * refuses the cookie unless it is Secure, path=/, and has no Domain attribute,
 * which prevents a subdomain from overwriting it. It requires HTTPS, so plain
 * `http://` local development falls back to an unprefixed name.
 */
export const IS_SECURE_CONTEXT = process.env.NODE_ENV === 'production';
export const ADMIN_COOKIE = IS_SECURE_CONTEXT ? '__Host-beadizo_admin' : 'beadizo_admin';
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or shorter than 32 characters. Refusing to issue admin sessions.'
    );
  }
  return secret;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadB64: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(payloadB64).digest('base64url');
}

/** Constant-time string compare that never leaks length via early return. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function createSessionToken(): string {
  const now = Date.now();
  const payload = {
    sub: 'admin',
    iat: now,
    exp: now + SESSION_TTL_MS,
    jti: crypto.randomBytes(16).toString('hex'),
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string' || token.length > 1024) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;

  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    return false; // SESSION_SECRET missing/weak
  }

  // Constant-time signature comparison — verify BEFORE parsing the payload.
  if (!safeEqual(signature, expected)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload?.sub !== 'admin') return false;
    if (typeof payload.exp !== 'number' || Date.now() >= payload.exp) return false;
    // Reject tokens issued in the future (clock tamper / replay of a forged iat).
    if (typeof payload.iat !== 'number' || payload.iat > Date.now() + 60_000) return false;
    return true;
  } catch {
    return false;
  }
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: IS_SECURE_CONTEXT,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    secure: IS_SECURE_CONTEXT,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function isAuthenticated(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

/**
 * Defence-in-depth CSRF check for state-changing requests.
 * SameSite=Strict already blocks cross-site cookie attachment; this rejects
 * same-site-but-wrong-origin and null-origin requests too.
 */
export function hasValidOrigin(request: NextRequest): boolean {
  let source = request.headers.get('origin');
  if (!source && (request.method === 'GET' || request.method === 'HEAD')) {
    source = request.headers.get('referer');
  }

  // Same-origin fetch() sends Origin on mutations, and Referer on GET/HEAD.
  if (!source) return false;

  let host = request.headers.get('host');
  // Respect the proxy host when deployed behind Vercel/NGINX.
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) host = forwardedHost;
  if (!host) return false;

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/**
 * Single guard used by every admin API route.
 * Returns null when the caller is a legitimate, authenticated admin.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  return null;
}
