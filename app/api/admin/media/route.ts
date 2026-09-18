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

function parseAndValidateObjectPath(publicUrl: string): string | null {
  try {
    const parsed = new URL(publicUrl);
    const expectedHost = getSupabaseHost();
    if (parsed.protocol !== 'https:' || !expectedHost || parsed.host !== expectedHost) {
      return null;
    }

    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const objectPath = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));

    // Whitelist path shape: <folder>/<name>.<ext>
    if (!/^[a-z]+\/[A-Za-z0-9._-]+$/.test(objectPath) || objectPath.includes('..')) {
      return null;
    }

    const folder = objectPath.split('/')[0];
    if (!(ALLOWED_FOLDERS as readonly string[]).includes(folder)) {
      return null;
    }

    return objectPath;
  } catch {
    return null;
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
    const force = Boolean(body?.force);

    // Support both single url: string and bulk urls: string[]
    const rawUrls: string[] = Array.isArray(body?.urls)
      ? body.urls
      : typeof body?.url === 'string'
      ? [body.url]
      : [];

    if (rawUrls.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid url(s).' }, { status: 400 });
    }

    if (rawUrls.length > 100) {
      return NextResponse.json({ error: 'Cannot delete more than 100 images at once.' }, { status: 400 });
    }

    // Validate each URL and parse object path
    const validItems: Array<{ url: string; objectPath: string }> = [];
    for (const u of rawUrls) {
      if (typeof u !== 'string' || u.length > 2048) continue;
      const objectPath = parseAndValidateObjectPath(u);
      if (objectPath) {
        validItems.push({ url: u, objectPath });
      }
    }

    if (validItems.length === 0) {
      return NextResponse.json({ error: 'No valid image URLs provided for deletion.' }, { status: 400 });
    }

    // Check usage before deleting unless force is true
    if (!force) {
      const inUseItems: Array<{ url: string; usages: any[] }> = [];
      for (const item of validItems) {
        const usages = await findMediaUsages(item.url);
        if (usages.length > 0) {
          inUseItems.push({ url: item.url, usages });
        }
      }

      if (inUseItems.length > 0) {
        return NextResponse.json(
          {
            error:
              validItems.length === 1
                ? 'This image is currently in use.'
                : `${inUseItems.length} of ${validItems.length} selected images are currently in use.`,
            inUse: true,
            inUseCount: inUseItems.length,
            inUseItems,
            usages: inUseItems[0]?.usages || [],
          },
          { status: 409 }
        );
      }
    }

    const objectPaths = validItems.map((item) => item.objectPath);
    const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(objectPaths);
    if (removeError) {
      console.error('[admin/media] storage remove failed:', removeError.message);
      return NextResponse.json({ error: 'Could not delete the file(s).' }, { status: 502 });
    }

    return NextResponse.json({ success: true, deletedCount: objectPaths.length });
  } catch (err: any) {
    console.error('[admin/media] DELETE failed:', err?.message || err);
    return NextResponse.json({ error: 'Could not delete the file(s).' }, { status: 500 });
  }
}
