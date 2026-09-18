import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';
import { getAdminClient, getSupabaseHost, BUCKET_NAME } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/session';
import { clientKey, rateLimit } from '@/lib/auth/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_BATCH_FILES = 20; // Maximum 20 files per batch
const MAX_TOTAL_REQUEST_SIZE = 55 * 1024 * 1024; // 55 MB total request body cap

/** Folders the admin UI is allowed to write to — blocks path traversal via `folder`. */
const ALLOWED_FOLDERS = new Set(['products', 'categories', 'hero', 'offers', 'settings', 'instagram']);

/**
 * Magic-byte signatures. The browser-supplied MIME type and the filename
 * extension are both attacker-controlled, so neither is trusted on its own.
 * SVG is deliberately absent: it is an XML document that can carry <script>,
 * making it a stored-XSS vector when served from our own origin.
 */
const SIGNATURES: Array<{ ext: string; mime: string; test: (b: Buffer) => boolean }> = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: 'png',
    mime: 'image/png',
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    ext: 'gif',
    mime: 'image/gif',
    test: (b) => b.subarray(0, 6).toString('latin1') === 'GIF87a' || b.subarray(0, 6).toString('latin1') === 'GIF89a',
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

function detectImage(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;
  return SIGNATURES.find((sig) => sig.test(buffer)) || null;
}

async function processAndUploadSingleFile(
  file: File,
  folderInput: string,
  supabase: any
): Promise<string> {
  if (file.size === 0) {
    throw new Error(`"${file.name}" is empty.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" exceeds the 5MB size limit.`);
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Authoritative check: the file's actual bytes must be a real raster image.
  const detected = detectImage(rawBuffer);
  if (!detected) {
    throw new Error(`"${file.name}" is not a valid JPEG, PNG, WEBP, or GIF image.`);
  }

  // Process & optimize with Sharp:
  // 1. Auto-rotate based on EXIF (upright orientation for mobile uploads)
  // 2. Cap width at 1600px with auto height (preserving aspect ratio, no enlargement)
  // 3. Compress & convert to WebP at 80% quality (visually lossless, 60-80% smaller)
  // 4. Preserve animation frames if an animated GIF is uploaded
  let finalBuffer: Buffer;
  let finalExt = 'webp';
  let finalMime = 'image/webp';
  const isAnimatedGif = detected.ext === 'gif';

  try {
    let pipeline = sharp(rawBuffer, { animated: isAnimatedGif });

    if (!isAnimatedGif) {
      pipeline = pipeline.rotate();
    }

    pipeline = pipeline
      .resize({
        width: 1600,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({
        quality: 80,
        effort: 4,
      });

    finalBuffer = await pipeline.toBuffer();
  } catch (sharpError: any) {
    console.warn(`[admin/upload] Sharp conversion failed for "${file.name}":`, sharpError?.message || sharpError);
    finalBuffer = rawBuffer;
    finalExt = detected.ext;
    finalMime = detected.mime;
  }

  // The stored filename is generated entirely by us.
  const objectPath = `${folderInput}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${finalExt}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(objectPath, finalBuffer, {
    contentType: finalMime,
    cacheControl: '31536000',
    upsert: false,
  });

  if (uploadError) {
    console.error('[admin/upload] storage upload failed:', uploadError.message);
    throw new Error(`Storage upload failed for "${file.name}": ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const limit = rateLimit(`admin-upload:${clientKey(request)}`, { limit: 60, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  // Reject oversized batch requests before buffering them into memory.
  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > MAX_TOTAL_REQUEST_SIZE) {
    return NextResponse.json({ error: 'Total request size exceeds the 50MB limit.' }, { status: 413 });
  }

  let supabase;
  try {
    supabase = getAdminClient();
  } catch {
    console.error('[admin/upload] Supabase service credentials are not configured.');
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const folderInput = String(formData.get('folder') || 'products');

    if (!ALLOWED_FOLDERS.has(folderInput)) {
      return NextResponse.json({ error: 'Invalid upload destination.' }, { status: 400 });
    }

    // Extract all files (supports both single 'file' and multiple 'files')
    const rawFiles = formData.getAll('files');
    const singleFile = formData.get('file');

    const filesToProcess: File[] = [];
    if (rawFiles.length > 0) {
      for (const f of rawFiles) {
        if (f instanceof File) filesToProcess.push(f);
      }
    } else if (singleFile instanceof File) {
      filesToProcess.push(singleFile);
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: 'No file(s) provided.' }, { status: 400 });
    }

    if (filesToProcess.length > MAX_BATCH_FILES) {
      return NextResponse.json(
        { error: `You can upload at most ${MAX_BATCH_FILES} files in a single batch.` },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    // Process each file with Sharp WebP conversion
    for (const file of filesToProcess) {
      try {
        const url = await processAndUploadSingleFile(file, folderInput, supabase);
        uploadedUrls.push(url);
      } catch (err: any) {
        errors.push({
          filename: file.name,
          error: err?.message || 'Processing failed',
        });
      }
    }

    // If single file was uploaded and it failed, return error
    if (filesToProcess.length === 1 && uploadedUrls.length === 0) {
      return NextResponse.json({ error: errors[0]?.error || 'Upload failed.' }, { status: 400 });
    }

    // If all files in a batch failed, return error
    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: 'All image uploads failed.', errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      url: uploadedUrls[0] || null,
      urls: uploadedUrls,
      total: filesToProcess.length,
      successful: uploadedUrls.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('[admin/upload] POST failed:', err?.message || err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const limit = rateLimit(`admin-delete:${clientKey(request)}`, { limit: 60, windowMs: 60_000 });
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

    if (typeof publicUrl !== 'string' || publicUrl.length > 2048) {
      return NextResponse.json({ error: 'Missing or invalid url.' }, { status: 400 });
    }

    // Parse properly instead of substring-matching. The old code did
    // `url.split('beadizo-media/')[1]`, so a crafted URL could smuggle
    // `../` segments or query strings into the storage remove() path.
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

    // Whitelist the exact shape our uploader produces: <folder>/<name>.<ext>
    if (!/^[a-z]+\/[A-Za-z0-9._-]+$/.test(objectPath) || objectPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.has(objectPath.split('/')[0])) {
      return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([objectPath]);
    if (error) {
      console.error('[admin/upload] storage remove failed:', error.message);
      return NextResponse.json({ error: 'Could not delete the file.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[admin/upload] DELETE failed:', err?.message || err);
    return NextResponse.json({ error: 'Could not delete the file.' }, { status: 500 });
  }
}
