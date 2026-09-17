import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientKey, rateLimit } from '@/lib/auth/rateLimit';
import { hasValidOrigin } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Trusted pricing endpoint.
 *
 * The cart lives in localStorage, so titles, prices and availability in the
 * browser are fully under the visitor's control — anyone could edit
 * `beadizo_cart_v4` and generate a WhatsApp order for ₹1. This route accepts
 * ONLY `{ id, qty }` pairs and re-reads every price, title and stock flag
 * from Postgres, then returns the authoritative order summary and message.
 *
 * The storefront renders and sends what this route returns, so the figures
 * that reach the shop owner always come from the database.
 */

const MAX_ITEMS = 50;
const MAX_QTY_PER_ITEM = 20;

interface RequestedItem {
  id: string;
  qty: number;
}

function parseItems(raw: unknown): RequestedItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: RequestedItem[] = [];

  for (const entry of raw.slice(0, MAX_ITEMS)) {
    const id = typeof entry?.id === 'string' ? entry.id.slice(0, 64) : '';
    if (!id || seen.has(id)) continue; // de-duplicate: same product cannot appear twice
    seen.add(id);

    const qty = Math.floor(Number(entry?.qty));
    if (!Number.isFinite(qty) || qty < 1) continue;

    items.push({ id, qty: Math.min(qty, MAX_QTY_PER_ITEM) });
  }
  return items;
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // Anon key + read-only RLS policies: this route only ever SELECTs.
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  const limit = rateLimit(`cart-validate:${clientKey(request)}`, { limit: 40, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  if (Number(request.headers.get('content-length') || 0) > 16 * 1024) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
  }

  let items: RequestedItem[];
  try {
    const body = await request.json();
    items = parseItems(body?.items);
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ items: [], subtotal: 0, removed: [], freeShipping: false });
  }

  const supabase = publicClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Store catalogue is unavailable.' }, { status: 503 });
  }

  // A cart entry may hold either a UUID or a slug, so both are looked up.
  // Each list is passed through `.in()`, which the client library encodes as a
  // parameterised filter — user input is never concatenated into PostgREST
  // filter syntax, so no filter/SQL injection is possible here.
  const uuidIds = items.map((i) => i.id).filter((i) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(i));
  const slugIds = items.map((i) => i.id).filter((i) => /^[a-z0-9-]{1,80}$/i.test(i));

  const columns = 'id, slug, title, price, images, is_available';

  const [byId, bySlug, settingsResult] = await Promise.all([
    uuidIds.length
      ? supabase.from('products').select(columns).in('id', uuidIds)
      : Promise.resolve({ data: [], error: null } as any),
    slugIds.length
      ? supabase.from('products').select(columns).in('slug', slugIds)
      : Promise.resolve({ data: [], error: null } as any),
    supabase.from('site_settings').select('free_shipping_threshold, whatsapp_phone').eq('id', 'general').maybeSingle(),
  ]);

  if (byId.error || bySlug.error) {
    console.error('[cart/validate] product lookup failed:', byId.error?.message || bySlug.error?.message);
    return NextResponse.json({ error: 'Could not verify your bag right now.' }, { status: 502 });
  }

  const catalogue = [...(byId.data || []), ...(bySlug.data || [])];
  const threshold = Number(settingsResult.data?.free_shipping_threshold ?? 999);

  const validated: Array<{
    id: string;
    title: string;
    price: number;
    qty: number;
    img: string;
    lineTotal: number;
  }> = [];
  const removed: string[] = [];

  for (const requested of items) {
    const product = catalogue.find((p: any) => p.id === requested.id || p.slug === requested.id);

    // Unknown or out-of-stock products are dropped, never silently priced.
    if (!product || product.is_available === false) {
      removed.push(requested.id);
      continue;
    }

    const price = Number(product.price) || 0;
    validated.push({
      id: product.id,
      title: product.title,
      price,
      qty: requested.qty,
      img: Array.isArray(product.images) && product.images[0] ? product.images[0] : '/assets/product_bracelet.jpg',
      lineTotal: price * requested.qty,
    });
  }

  const subtotal = validated.reduce((sum, item) => sum + item.lineTotal, 0);
  const freeShipping = subtotal >= threshold;

  // Build the order text here so the message the customer sends is derived
  // from database prices, not from whatever the browser had in memory.
  const lines = validated.map(
    (item, i) => `${i + 1}. *${item.title}* (Qty: ${item.qty}) — ₹${item.lineTotal.toLocaleString('en-IN')}`
  );
  const message =
    '*BEADIZO ORDER INQUIRY*\n\n' +
    'Hi Beadizo! I would like to order the following handcrafted pieces:\n\n' +
    lines.join('\n') +
    `\n\n*Order Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n` +
    `*Pan-India Shipping:* ${freeShipping ? 'FREE' : '₹60 standard'}\n\n` +
    'Please confirm availability and dispatch timeline. Thank you!';

  return NextResponse.json(
    {
      items: validated,
      subtotal,
      freeShipping,
      removed,
      phone: String(settingsResult.data?.whatsapp_phone || '').replace(/[^0-9]/g, ''),
      message,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
