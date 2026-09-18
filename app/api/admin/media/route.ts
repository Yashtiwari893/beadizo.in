import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getSupabaseHost, BUCKET_NAME } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/auth/rateLimit';
import { findMediaUsages } from '@/lib/supabase/mediaUsage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FOLDERS = ['products', 'categories', 'hero', 'offers', 'settings', 'instagram'] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export interface MediaFileItem {
  id: string;
  name: string;
  folder: AllowedFolder;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const limit = rateLimit(`admin-media-list:${clientKey(request)}`, { limit: 60, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch {
    return NextResponse.json({ error: 'Database service unavailable.' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const requestedFolder = searchParams.get('folder');

  const foldersToScan: AllowedFolder[] =
    requestedFolder && (ALLOWED_FOLDERS as readonly string[]).includes(requestedFolder)
      ? [requestedFolder as AllowedFolder]
      : [...ALLOWED_FOLDERS];

  try {
    const results = await Promise.all(
      foldersToScan.map(async (folder) => {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

        if (error) {
          console.warn(`[admin/media] failed to list folder "${folder}":`, error.message);
          return [] as MediaFileItem[];
        }

        if (!data || !Array.isArray(data)) return [] as MediaFileItem[];

        return data
          .filter((item) => item.name && item.name !== '.emptyFolderPlaceholder')
          .map((item): MediaFileItem => {
            const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${folder}/${item.name}`);
            return {
              id: item.id || `${folder}/${item.name}`,
              name: item.name,
              folder,
              path: `${folder}/${item.name}`,
              url: pubData.publicUrl,
              size: (item.metadata as any)?.size || 0,
              mimetype: (item.metadata as any)?.mimetype || 'image/jpeg',
              createdAt: item.created_at || null,
              updatedAt: item.updated_at || null,
            };
          });
      })
    );

    const flatMedia = results.flat();
    flatMedia.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({
      media: flatMedia,
      total: flatMedia.length,
    });
  } catch (err: any) {
    console.error('[admin/media] GET failed:', err?.message || err);
    return NextResponse.json({ error: 'Failed to retrieve media library.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const limit = rateLimit(`admin-media-delete:${clientKey(request)}`, { limit: 60, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const publicUrl = body?.url;
    const force = Boolean(body?.force);

    if (typeof publicUrl !== 'string' || publicUrl.length > 2048) {
      return NextResponse.json({ error: 'Missing or invalid url.' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(publicUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid url.' }, { status: 400 });
    }

    const expectedHost = getSupabaseHost();
    if (parsed.protocol !== 'https:' || !expectedHost || parsed.host !== expectedHost) {
      return NextResponse.json({ error: 'That file is not managed by this store.' }, { status: 400 });
    }

    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return NextResponse.json({ error: 'That file is not managed by this store.' }, { status: 400 });
    }

    const objectPath = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));

    // Whitelist path shape: <folder>/<name>.<ext>
    if (!/^[a-z]+\/[A-Za-z0-9._-]+$/.test(objectPath) || objectPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
    }
    const folder = objectPath.split('/')[0];
    if (!(ALLOWED_FOLDERS as readonly string[]).includes(folder)) {
      return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
    }

    // Check usage before deleting unless force is true
    if (!force) {
      const usages = await findMediaUsages(publicUrl);
      if (usages.length > 0) {
        return NextResponse.json(
          {
            error: 'This image is currently in use.',
            inUse: true,
            usageCount: usages.length,
            usages,
          },
          { status: 409 }
        );
      }
    }

    const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove([objectPath]);
    if (removeError) {
      console.error('[admin/media] storage remove failed:', removeError.message);
      return NextResponse.json({ error: 'Could not delete the file.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[admin/media] DELETE failed:', err?.message || err);
    return NextResponse.json({ error: 'Could not delete the file.' }, { status: 500 });
  }
}
