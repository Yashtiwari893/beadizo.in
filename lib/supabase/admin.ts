import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. Bypasses RLS, so it must NEVER be imported
 * from a client component — the `server-only` import above turns any such
 * attempt into a build-time error.
 *
 * There is deliberately NO fallback to the anon key. The previous code did
 * `SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY`, which meant a
 * misconfigured deployment silently ran every admin write as `anon` — writes
 * then failed against RLS with confusing errors, or (if a permissive policy
 * ever got added) ran with the wrong identity. Failing loudly is safer.
 */

export const BUCKET_NAME = 'beadizo-media';

let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured.');
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'beadizo-admin-server' } },
  });

  return cached;
}

/** The Supabase project host, used to validate storage URLs before deletion. */
export function getSupabaseHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').host;
  } catch {
    return null;
  }
}
