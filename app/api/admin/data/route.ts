import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/auth/rateLimit';
import {
  ValidationError,
  validateProduct,
  validateCategory,
  validateHeroSlide,
  validatePopupOffer,
  validateSiteSettings,
  validateDeleteId,
  validateMarkContactRead,
} from '@/lib/validation/adminSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 256 * 1024; // generous for base64-free JSON, blocks payload floods

/** Maps a Postgres error to a safe, user-facing message. Never leaks details. */
function friendlyDbError(error: { code?: string; message?: string }): { message: string; status: number } {
  switch (error.code) {
    case '23505':
      return { message: 'A record with that slug already exists. Choose a different one.', status: 409 };
    case '23503':
      return { message: 'That record is still referenced by other data and cannot be changed.', status: 409 };
    case '23514':
      return { message: 'The submitted values failed a database validation rule.', status: 400 };
    case 'PGRST116':
      return { message: 'Record not found.', status: 404 };
    default:
      return { message: 'The operation could not be completed.', status: 500 };
  }
}

export async function POST(request: NextRequest) {
  // 1. Authentication + CSRF origin check. This route wields the service-role
  //    key, so it must never be reachable by an anonymous visitor.
  const denied = requireAdmin(request);
  if (denied) return denied;

  // 2. Rate limit even authenticated admins, to bound accidental or malicious floods.
  const limit = rateLimit(`admin-data:${clientKey(request)}`, { limit: 60, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
  }

  let action: unknown;
  let payload: unknown;
  try {
    const body = await request.json();
    action = body?.action;
    payload = body?.payload;
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  if (typeof action !== 'string') {
    return NextResponse.json({ error: 'Missing action.' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch {
    console.error('[admin/data] Supabase service credentials are not configured.');
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  try {
    switch (action) {
      // ---------------------------------------------------------------- Products
      case 'saveProduct': {
        const { id, record } = validateProduct(payload);
        const query = id
          ? supabase.from('products').update(record).eq('id', id).select().single()
          : supabase.from('products').insert([record]).select().single();

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteProduct': {
        const id = validateDeleteId(payload);
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      // -------------------------------------------------------------- Categories
      case 'saveCategory': {
        const { id, record } = validateCategory(payload);
        const query = id
          ? supabase.from('categories').update(record).eq('id', id).select().single()
          : supabase.from('categories').insert([record]).select().single();

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteCategory': {
        const id = validateDeleteId(payload);
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      // ------------------------------------------------------------- Hero slides
      case 'saveHeroSlide': {
        const { id, record } = validateHeroSlide(payload);
        const query = id
          ? supabase.from('hero_slides').update(record).eq('id', id).select().single()
          : supabase.from('hero_slides').insert([record]).select().single();

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteHeroSlide': {
        const id = validateDeleteId(payload);
        const { error } = await supabase.from('hero_slides').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      // ------------------------------------------------------------ Popup offers
      case 'savePopupOffer': {
        const { id, record } = validatePopupOffer(payload);

        // Write the offer FIRST. The old code deactivated every other offer
        // before the insert, so a failed insert left the site with no active
        // offer at all. It also ran `.neq('id', '')` against a uuid column,
        // which Postgres rejects outright.
        const query = id
          ? supabase.from('popup_offers').update(record).eq('id', id).select().single()
          : supabase.from('popup_offers').insert([record]).select().single();

        const { data, error } = await query;
        if (error) throw error;

        // "Only one offer may be active" is enforced by the
        // popup_offers_single_active trigger, atomically, in this same
        // transaction — no second round trip and no partially-applied state.
        return NextResponse.json({ data });
      }

      case 'deletePopupOffer': {
        const id = validateDeleteId(payload);
        const { error } = await supabase.from('popup_offers').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      // ----------------------------------------------------------- Site settings
      case 'saveSiteSettings': {
        // Only the fields actually submitted are written, and the merge happens
        // here on the server — the client can no longer round-trip a stale copy
        // of every setting and clobber concurrent edits.
        const record = validateSiteSettings(payload);
        const { data, error } = await supabase
          .from('site_settings')
          .upsert(record, { onConflict: 'id' })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ data });
      }

      // -------------------------------------------------- Contact Submissions
      case 'getContactSubmissions': {
        const { data, error } = await supabase
          .from('contact_submissions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ data: data || [] });
      }

      case 'markContactSubmissionRead': {
        const { id, is_read } = validateMarkContactRead(payload);
        const { data, error } = await supabase
          .from('contact_submissions')
          .update({ is_read })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteContactSubmission': {
        const id = validateDeleteId(payload);
        const { error } = await supabase
          .from('contact_submissions')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
    }
  } catch (err: any) {
    if (err instanceof ValidationError) {
      // Validation messages are authored by us and safe to show.
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    // Everything else is logged server-side and reported generically, so raw
    // Postgres errors can no longer leak schema, column names, or constraints.
    console.error(`[admin/data] action="${action}" failed:`, err?.message || err);
    const { message, status } = friendlyDbError(err || {});
    return NextResponse.json({ error: message }, { status });
  }
}
