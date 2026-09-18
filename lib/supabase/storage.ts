import { isSupabaseConfigured } from './client';

export const BUCKET_NAME = 'beadizo-media';

/**
 * Uploads an image through the authenticated /api/admin/upload route.
 *
 * The previous version caught ANY failure — including a 401, a rejected file
 * type, or an oversized file — and silently fell back to embedding the raw
 * file as a base64 data URL in the product record. That bypassed every
 * server-side upload check, could push multi-megabyte strings into Postgres,
 * and produced images blocked by the site's own CSP. Errors now propagate so
 * the admin sees what actually went wrong.
 */
export async function uploadMedia(file: File, folder = 'products'): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Image storage is not configured. Set your Supabase credentials in .env.local.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({} as any));
    if (res.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }
    throw new Error(errData.error || 'Upload failed. Please try again.');
  }

  const data = await res.json();
  if (!data?.url || typeof data.url !== 'string') {
    throw new Error('Upload succeeded but no image URL was returned.');
  }

  return data.url;
}

export interface BulkUploadProgress {
  current: number;
  total: number;
  filename: string;
}

export interface BulkUploadResult {
  urls: string[];
  errors: Array<{ filename: string; error: string }>;
}

/**
 * Uploads a batch of images sequentially with real-time progress callbacks.
 * If some images fail (e.g. invalid format), remaining files continue uploading.
 */
export async function uploadMediaBatch(
  files: File[],
  folder = 'products',
  onProgress?: (progress: BulkUploadProgress) => void
): Promise<BulkUploadResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Image storage is not configured. Set your Supabase credentials in .env.local.');
  }

  const urls: string[] = [];
  const errors: Array<{ filename: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress({ current: i + 1, total: files.length, filename: file.name });
    }

    try {
      const url = await uploadMedia(file, folder);
      urls.push(url);
    } catch (err: any) {
      errors.push({ filename: file.name, error: err?.message || 'Upload failed' });
    }
  }

  return { urls, errors };
}

/** Deletes a stored image. Returns false if the file could not be removed. */
export async function deleteMedia(publicUrl: string): Promise<boolean> {
  if (!isSupabaseConfigured || !publicUrl) return true;

  try {
    const res = await fetch('/api/admin/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: publicUrl }),
      credentials: 'same-origin',
    });

    if (!res.ok) return false;
    const data = await res.json().catch(() => ({} as any));
    return data.success !== false;
  } catch {
    return false;
  }
}

export interface MediaItem {
  id: string;
  name: string;
  folder: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UsageScanResult {
  inUse: boolean;
  usageCount: number;
  usages: Array<{
    type: 'product' | 'category' | 'hero' | 'offer' | 'instagram' | 'settings';
    title: string;
    location: string;
  }>;
}

export async function fetchMediaLibrary(folder?: string): Promise<MediaItem[]> {
  const url = folder ? `/api/admin/media?folder=${encodeURIComponent(folder)}` : '/api/admin/media';
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch media library.');
  }

  const data = await res.json();
  return data.media || [];
}

export async function checkMediaUsage(publicUrl: string): Promise<UsageScanResult> {
  const res = await fetch(`/api/admin/media/usage?url=${encodeURIComponent(publicUrl)}`, {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to check media usage.');
  }

  return await res.json();
}

export async function deleteMediaWithSafety(
  publicUrl: string,
  force = false
): Promise<{ success: boolean; inUse?: boolean; usages?: UsageScanResult['usages']; error?: string }> {
  const res = await fetch('/api/admin/media', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: publicUrl, force }),
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 409) {
    return {
      success: false,
      inUse: true,
      usages: data.usages || [],
      error: data.error || 'This image is currently in use.',
    };
  }

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete image.');
  }

  return { success: true };
}

