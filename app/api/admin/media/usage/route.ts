import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/auth/rateLimit';
import { findMediaUsages } from '@/lib/supabase/mediaUsage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const limit = rateLimit(`admin-media-usage:${clientKey(request)}`, { limit: 120, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || typeof targetUrl !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid url parameter.' }, { status: 400 });
  }

  try {
    const usages = await findMediaUsages(targetUrl);
    return NextResponse.json({
      inUse: usages.length > 0,
      usageCount: usages.length,
      usages,
    });
  } catch (err: any) {
    console.error('[admin/media/usage] query error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to scan media usage.' }, { status: 500 });
  }
}
