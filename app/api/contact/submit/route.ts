import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { hasValidOrigin } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/auth/rateLimit';
import { ValidationError, validateContactSubmission } from '@/lib/validation/adminSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 32 * 1024; // 32 KB is ample for text form submission

export async function POST(request: NextRequest) {
  // 1. Defence-in-depth CSRF origin check
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  }

  // 2. Anti-spam rate limiting: 5 contact requests per 10 minutes per IP
  const limit = rateLimit(`contact-submit:${clientKey(request)}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'You have submitted multiple messages recently. Please wait a few minutes before trying again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  try {
    const record = validateContactSubmission(body);

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      // In demo mode or if Supabase service credentials are unconfigured,
      // return success so the user's immediate WhatsApp dispatch is not blocked.
      console.warn('[contact/submit] Supabase server credentials not configured. Running in demo mode.');
      return NextResponse.json({ success: true, demo: true });
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([record])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[contact/submit] Database insert error:', error.message);
      return NextResponse.json({ error: 'Unable to save your message. Please reach us directly via WhatsApp.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[contact/submit] Unexpected error:', err?.message || err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again or message via WhatsApp.' }, { status: 500 });
  }
}
