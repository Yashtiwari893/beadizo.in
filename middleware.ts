import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side gate for the admin console.
 *
 * Previously the ONLY thing standing between a visitor and the CMS was
 * `localStorage.beadizo_admin_auth_v1 === 'true'`, which anyone could set from
 * the browser console. The admin HTML is now never served without a valid
 * signed session cookie.
 *
 * Runs on the Edge runtime, so it uses Web Crypto rather than node:crypto and
 * duplicates a small amount of the verification logic in lib/auth/session.ts.
 */

// Must stay in sync with lib/auth/session.ts. Duplicated rather than imported
// because that module is `server-only` and this runs on the Edge runtime.
const ADMIN_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Host-beadizo_admin' : 'beadizo_admin';

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Length-independent comparison. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still burn a comparison so timing does not reveal the mismatch reason.
    let sink = 0;
    for (let i = 0; i < a.length; i++) sink |= a.charCodeAt(i);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret || secret.length < 32 || token.length > 1024) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    if (!constantTimeEqual(signature, bytesToBase64Url(mac))) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
    if (payload?.sub !== 'admin') return false;
    if (typeof payload.exp !== 'number' || Date.now() >= payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page and the auth API must stay reachable while signed out.
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }

  const authed = await verifyToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
    process.env.SESSION_SECRET
  );

  if (authed) return NextResponse.next();

  // API calls get a clean 401; page requests get redirected to the login form.
  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
