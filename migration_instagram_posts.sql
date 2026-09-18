-- ==============================================================================
-- Migration: Create instagram_posts table for dynamic "Follow Us @Beadizo" feed
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  post_link TEXT NOT NULL DEFAULT 'https://www.instagram.com/beadizo.in',
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering active posts on the storefront
CREATE INDEX IF NOT EXISTS idx_instagram_posts_order 
  ON public.instagram_posts (display_order ASC) 
  WHERE is_active = true;

-- Enable and force Row Level Security (RLS)
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts FORCE ROW LEVEL SECURITY;

-- Idempotent policy creation: drop before creating
DROP POLICY IF EXISTS "Public Read Instagram Posts" ON public.instagram_posts;

-- Public read policy: Anyone (anon/authenticated) can select active posts
CREATE POLICY "Public Read Instagram Posts" 
  ON public.instagram_posts 
  FOR SELECT 
  TO anon, authenticated 
  USING (is_active = true);

-- Revoke direct writes from public roles (writes only via service-role key in admin API)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.instagram_posts FROM anon, authenticated;
