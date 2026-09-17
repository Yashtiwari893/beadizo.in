import 'server-only';
import { NextRequest } from 'next/server';

/**
 * Lightweight fixed-window rate limiter.
 *
 * NOTE: state lives in the process. On a single Node server (or a single
 * Vercel instance) this is effective. If you scale to multiple instances,
 * swap the `hits` Map for Upstash Redis / Vercel KV — the call sites below
 * do not need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const hits = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number) {
  if (hits.size < MAX_TRACKED_KEYS) return;
  hits.forEach((bucket, key) => {
    if (bucket.resetAt < now && (!bucket.lockedUntil || bucket.lockedUntil < now)) {
      hits.delete(key);
    }
  });
  // Hard cap so a spoofed-header flood cannot exhaust memory.
  if (hits.size >= MAX_TRACKED_KEYS) hits.clear();
}

/** Best-effort client identity. Trusts the platform's forwarding headers. */
export function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    (forwarded ? forwarded.split(',')[0] : '').trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return ip.slice(0, 64);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs, lockoutMs = 0 }: { limit: number; windowMs: number; lockoutMs?: number }
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = hits.get(key);

  if (bucket?.lockedUntil && bucket.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000),
      remaining: 0,
    };
  }

  if (!bucket || bucket.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: limit - 1 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    // Progressive lockout: each additional attempt past the limit extends it.
    if (lockoutMs > 0) {
      const overage = bucket.count - limit;
      bucket.lockedUntil = now + Math.min(lockoutMs * overage, 60 * 60 * 1000);
    }
    const until = bucket.lockedUntil ?? bucket.resetAt;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((until - now) / 1000),
      remaining: 0,
    };
  }

  return { allowed: true, retryAfterSeconds: 0, remaining: limit - bucket.count };
}

/** Clears the counter for a key — call on a successful login. */
export function resetRateLimit(key: string): void {
  hits.delete(key);
}
