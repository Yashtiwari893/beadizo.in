import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
  hasValidOrigin,
  safeEqual,
} from '@/lib/auth/session';
import { clientKey, rateLimit, resetRateLimit } from '@/lib/auth/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Longest admin key we will even hash. Blocks long-password DoS (LPDoS). */
const MAX_KEY_LENGTH = 256;
/** Reject oversized JSON bodies outright. */
const MAX_BODY_BYTES = 2048;

/**
 * GET — session probe. The admin UI calls this on mount to learn whether it
 * holds a valid session. Authority lives in the signed HttpOnly cookie, never
 * in localStorage.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { authenticated: isAuthenticated(request) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/** POST — exchange the admin key for a signed session cookie. */
export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  // Brute-force protection: 5 attempts / 15 min, then progressive lockout.
  const key = `admin-login:${clientKey(request)}`;
  const limit = rateLimit(key, { limit: 5, windowMs: 15 * 60 * 1000, lockoutMs: 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
  }

  const expectedRaw = process.env.ADMIN_SECRET_KEY;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!expectedRaw || expectedRaw.length < 12 || !sessionSecret || sessionSecret.length < 32) {
    // Do not tell the client which variable is missing.
    console.error(
      '[auth] Misconfiguration: ADMIN_SECRET_KEY (min 12 chars) and SESSION_SECRET (min 32 chars) must both be set.'
    );
    return NextResponse.json({ error: 'Admin access is unavailable.' }, { status: 503 });
  }

  let submitted = '';
  try {
    const body = await request.json();
    const raw = body?.key;
    if (typeof raw !== 'string') {
      return NextResponse.json({ error: 'Incorrect admin security key.' }, { status: 401 });
    }
    if (raw.length > MAX_KEY_LENGTH) {
      return NextResponse.json({ error: 'Incorrect admin security key.' }, { status: 401 });
    }
    submitted = raw.trim();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  // Unwrap quotes only on the SERVER-side value (a common .env paste mistake).
  // The submitted value is compared verbatim — previously both sides were
  // stripped, which silently made `"secret"` and `secret` equivalent.
  const expected = expectedRaw.replace(/^["']/, '').replace(/["']$/, '').trim();

  if (!submitted || !safeEqual(submitted, expected)) {
    return NextResponse.json({ error: 'Incorrect admin security key.' }, { status: 401 });
  }

  resetRateLimit(key);

  const res = NextResponse.json(
    { success: true },
    { headers: { 'Cache-Control': 'no-store' } }
  );
  setSessionCookie(res, createSessionToken());
  return res;
}

/** DELETE — sign out, clearing the session cookie server-side. */
export async function DELETE(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
