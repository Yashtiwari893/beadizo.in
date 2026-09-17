-- ==========================================================================
-- BEADIZO MIGRATION: CONTACT SUBMISSIONS & INQUIRIES TABLE
-- Run this in Supabase SQL Editor (supabase.com -> Project -> SQL Editor)
-- ==========================================================================

-- 1. Create table for contact submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  inquiry_type TEXT NOT NULL DEFAULT 'Custom Handcrafted Jewellery',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON public.contact_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read
  ON public.contact_submissions (is_read);

-- 3. Row Level Security (RLS)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions FORCE ROW LEVEL SECURITY;

-- Idempotent policy management
DROP POLICY IF EXISTS "Public Insert Contact Submissions" ON public.contact_submissions;

-- Public anon & authenticated visitors may ONLY insert their inquiry
CREATE POLICY "Public Insert Contact Submissions"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Revoke read, edit, and delete from anon and authenticated (admin service-role only)
REVOKE SELECT, UPDATE, DELETE, TRUNCATE
  ON public.contact_submissions
  FROM anon, authenticated;

COMMENT ON TABLE public.contact_submissions IS 'Customer inquiries submitted via the public contact form';
