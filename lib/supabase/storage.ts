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
