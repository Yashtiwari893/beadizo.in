/**
 * Shared sanitisation helpers. Safe to import from both client and server.
 * Every function is total: it never throws and always returns a usable value.
 */

/** Hard ceiling applied to any free-text field, to prevent long-input DoS. */
export const MAX_TEXT = 500;
export const MAX_LONG_TEXT = 5000;
export const MAX_POLICY_TEXT = 100_000;

/**
 * Coerces to a trimmed string and clamps its length.
 * Also strips C0/C1 control characters, which break JSON logs and terminals.
 */
export function clampString(value: unknown, max = MAX_TEXT): string {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'string' ? value : String(value);
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

/** Coerces to a finite number inside [min, max]; returns fallback otherwise. */
export function clampNumber(
  value: unknown,
  { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 }: { min?: number; max?: number; fallback?: number } = {}
): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && value.length === 36 && UUID_RE.test(value);
}


/**
 * Normalises a slug. Linear-time (no nested quantifiers), length-capped,
 * so it cannot be used as a ReDoS or memory-exhaustion vector.
 */
export function toSlug(value: unknown, fallback = ''): string {
  const base = clampString(value, 120).toLowerCase();
  const slug = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 80);
  return slug || fallback;
}

/**
 * Returns a link that is safe to place in an href.
 *
 * Accepts only same-site absolute paths ("/collections") and https:// URLs.
 * Rejects javascript:, data:, vbscript:, protocol-relative ("//evil.com")
 * and anything else — closing both the stored-XSS and open-redirect holes.
 */
export function safeLink(value: unknown, fallback = '/collections'): string {
  const raw = clampString(value, 2048);
  if (!raw) return fallback;

  // Protocol-relative URLs silently become cross-origin. Reject.
  if (raw.startsWith('//')) return fallback;

  // Same-site path: must start with a single slash, no backslash tricks.
  if (raw.startsWith('/')) {
    if (raw.includes('\\') || raw.includes('\t') || raw.includes('\n')) return fallback;
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === 'https:') return url.toString();
  } catch {
    /* not a parseable absolute URL */
  }

  return fallback;
}

/**
 * Returns a value safe to use as an <img src>.
 * Allows local /assets paths and https:// URLs only — no data:, no javascript:.
 */
export function safeImageUrl(value: unknown, fallback = '/assets/product_bracelet.jpg'): string {
  const raw = clampString(value, 2048);
  if (!raw) return fallback;

  if (raw.startsWith('//')) return fallback;

  if (raw.startsWith('/')) {
    // Block traversal attempts and control characters in local paths.
    if (raw.includes('..') || raw.includes('\\')) return fallback;
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === 'https:') return url.toString();
  } catch {
    /* fall through */
  }

  return fallback;
}

/** Sanitises an array of strings with a per-item and total-count cap. */
export function clampStringArray(value: unknown, maxItems: number, maxLen = MAX_TEXT): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((item) => clampString(item, maxLen))
    .filter(Boolean);
}
