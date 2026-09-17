-- ==========================================================================
-- BEADIZO E-COMMERCE & CMS — SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor (supabase.com -> SQL Editor)
-- ==========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------------
-- 1. CATEGORIES TABLE
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2. PRODUCTS TABLE (With Multiple Image Support)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug TEXT NOT NULL DEFAULT 'bracelets',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  original_price NUMERIC(10, 2),
  images TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  features TEXT[] DEFAULT '{}',
  badge TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating NUMERIC(2, 1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 100,
  gender TEXT NOT NULL DEFAULT 'unisex',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 3. HERO SLIDES TABLE (Hero Banner CMS)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag TEXT DEFAULT 'HANDCRAFTED JEWELLERY',
  headline TEXT NOT NULL,
  description TEXT,
  button_text TEXT DEFAULT 'EXPLORE COLLECTIONS →',
  button_link TEXT DEFAULT '/collections',
  watermark_text TEXT DEFAULT 'More than\nJewellery',
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 4. POPUP OFFERS TABLE (Promotional Modal CMS)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.popup_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  discount_code TEXT,
  badge TEXT DEFAULT 'SPECIAL OFFER',
  image_url TEXT,
  button_text TEXT DEFAULT 'CLAIM OFFER NOW →',
  button_link TEXT DEFAULT '/collections',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 5. SITE SETTINGS TABLE (Global Configuration)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'general',
  whatsapp_phone TEXT DEFAULT '919324556148',
  contact_email TEXT DEFAULT 'shamairakhan712@gmail.com',
  announcement_text TEXT DEFAULT 'Free Shipping on all orders above ₹999  |  Extra 10% OFF on your first order',
  announcement_active BOOLEAN DEFAULT true,
  free_shipping_threshold NUMERIC(10, 2) DEFAULT 999.00,
  editorial_headline TEXT DEFAULT 'Jewellery That Feels Like You',
  editorial_subtext TEXT DEFAULT 'Minimal, meaningful and made to be a part of your everyday moments.',
  editorial_image_url TEXT DEFAULT '/assets/jewellery_feels_like_you.png',
  craft_headline TEXT DEFAULT 'More Than Jewellery',
  craft_description TEXT DEFAULT 'Every bead tells a story – of tradition, craftsmanship and the little moments that make life beautiful.',
  craft_image_url TEXT DEFAULT '/assets/more_than_jewellery.png',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 5b. CONTACT SUBMISSIONS TABLE (Customer Inquiries)
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- 6. DATA INTEGRITY CONSTRAINTS
--    Enforced by Postgres, so they hold even if an application check is missed.
-- --------------------------------------------------------------------------
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_price_non_negative,
  DROP CONSTRAINT IF EXISTS products_original_price_sane,
  DROP CONSTRAINT IF EXISTS products_rating_range,
  DROP CONSTRAINT IF EXISTS products_slug_format,
  DROP CONSTRAINT IF EXISTS products_images_not_empty,
  DROP CONSTRAINT IF EXISTS products_gender_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_price_non_negative CHECK (price >= 0),
  -- A "discount" may never raise the price.
  ADD CONSTRAINT products_original_price_sane CHECK (original_price IS NULL OR original_price >= price),
  ADD CONSTRAINT products_rating_range CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  ADD CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 80),
  ADD CONSTRAINT products_images_not_empty CHECK (array_length(images, 1) >= 1),
  ADD CONSTRAINT products_gender_check CHECK (gender IN ('men', 'women', 'unisex'));

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_slug_format;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 80);

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_singleton,
  DROP CONSTRAINT IF EXISTS site_settings_threshold_non_negative;
ALTER TABLE public.site_settings
  -- There is exactly one settings row; this prevents a stray insert.
  ADD CONSTRAINT site_settings_singleton CHECK (id = 'general'),
  ADD CONSTRAINT site_settings_threshold_non_negative CHECK (free_shipping_threshold >= 0);

-- --------------------------------------------------------------------------
-- 7. INDEXES
--    Every storefront query filters on one of these columns.
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON public.products (category_slug);
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products (gender);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products (is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories (display_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON public.hero_slides (display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_popup_offers_active ON public.popup_offers (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON public.contact_submissions (is_read);

-- Keep products.updated_at honest even for direct SQL edits.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Only one popup offer may be active at a time.
-- A trigger does this atomically inside the same transaction as the write, so
-- there is no window where two offers are active or none is. The previous
-- application-level approach deactivated every other offer BEFORE saving, so a
-- failed save left the storefront with no offer at all.
CREATE OR REPLACE FUNCTION public.enforce_single_active_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.popup_offers
       SET is_active = false
     WHERE is_active = true
       AND id IS DISTINCT FROM NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS popup_offers_single_active ON public.popup_offers;
CREATE TRIGGER popup_offers_single_active
  BEFORE INSERT OR UPDATE OF is_active ON public.popup_offers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_offer();

-- --------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
--
--  Model: the storefront reads with the anon key and may ONLY select.
--  Every write goes through a Next.js server route that authenticates the
--  admin session first and then uses the service-role key (which bypasses RLS).
--  There is deliberately NO insert/update/delete policy for anon or
--  authenticated — absence of a policy under RLS means the operation is denied.
-- --------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- FORCE applies RLS even to the table owner, so a future owner-context
-- connection cannot quietly bypass these policies.
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides FORCE ROW LEVEL SECURITY;
ALTER TABLE public.popup_offers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions FORCE ROW LEVEL SECURITY;

-- Idempotent: drop every policy this script manages before re-creating.
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Hero Slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Public Read Popup Offers" ON public.popup_offers;
DROP POLICY IF EXISTS "Public Read Site Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public Insert Contact Submissions" ON public.contact_submissions;

-- Drop any permissive write policies left over from earlier revisions.
DROP POLICY IF EXISTS "Admin All Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin All Products" ON public.products;
DROP POLICY IF EXISTS "Admin All Hero Slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admin All Popup Offers" ON public.popup_offers;
DROP POLICY IF EXISTS "Admin All Site Settings" ON public.site_settings;

CREATE POLICY "Public Read Categories"    ON public.categories    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Hero Slides"   ON public.hero_slides   FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public Read Popup Offers"  ON public.popup_offers  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Site Settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- Draft/hidden products stay invisible to the public entirely, rather than
-- being fetched and then filtered in the browser.
CREATE POLICY "Public Read Products"      ON public.products      FOR SELECT TO anon, authenticated USING (true);

-- Public visitors can submit contact forms (INSERT only)
CREATE POLICY "Public Insert Contact Submissions" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Belt and braces: revoke write privileges at the GRANT level too, so an
-- accidentally-added permissive policy still cannot enable writes.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.categories    FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.products      FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.hero_slides   FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.popup_offers  FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.site_settings FROM anon, authenticated;
REVOKE SELECT, UPDATE, DELETE, TRUNCATE ON public.contact_submissions FROM anon, authenticated;

-- --------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKET: beadizo-media
--    Public READ (product photos must load for visitors), server-side writes only.
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'beadizo-media',
  'beadizo-media',
  true,
  5242880, -- 5 MB, matching the API route
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Read Beadizo Media" ON storage.objects;
DROP POLICY IF EXISTS "Public Read beadizo-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads To Beadizo Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates To Beadizo Media" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete On Beadizo Media" ON storage.objects;

-- SELECT only. Uploads and deletes run server-side with the service-role key
-- after the admin session has been verified, so anon can never write here.
CREATE POLICY "Public Read Beadizo Media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'beadizo-media');

-- --------------------------------------------------------------------------
-- 10. SEED DATA (Pre-populates existing catalog & settings)
-- --------------------------------------------------------------------------

-- Seed Categories
INSERT INTO public.categories (id, name, slug, image_url, display_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bracelets', 'bracelets', '/assets/product_bracelet.jpg', 1),
  ('22222222-2222-2222-2222-222222222222', 'Necklaces', 'necklaces', '/assets/product_necklace.jpg', 2),
  ('33333333-3333-3333-3333-333333333333', 'Earrings', 'earrings', '/assets/product_earrings.jpg', 3),
  ('44444444-4444-4444-4444-444444444444', 'Anklets', 'anklets', '/assets/product_anklet.jpg', 4),
  ('55555555-5555-5555-5555-555555555555', 'Combo Sets', 'combos', '/assets/product_combo.jpg', 5),
  ('66666666-6666-6666-6666-666666666666', 'Gifting Box', 'gifting', '/assets/product_gifting.jpg', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed Products
INSERT INTO public.products (slug, title, category_slug, price, original_price, images, description, features, badge, is_available, is_featured, rating, reviews_count, gender)
VALUES
  (
    'blush-charm-bracelet',
    'Blush Charm Bracelet',
    'bracelets',
    699.00,
    999.00,
    ARRAY['/assets/product_bracelet.jpg', '/assets/product_necklace.jpg', '/assets/product_earrings.jpg'],
    'Delicately handcrafted with premium blush crystal beads, 18k gold-plated accents, and an adjustable extender chain. Hypoallergenic and waterproof for daily elegance.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Bestseller',
    true,
    true,
    5.0,
    128,
    'women'
  ),
  (
    'daisy-bloom-necklace',
    'Daisy Bloom Necklace',
    'necklaces',
    899.00,
    1299.00,
    ARRAY['/assets/product_necklace.jpg', '/assets/product_bracelet.jpg', '/assets/product_earrings.jpg'],
    'Charming floral beadwork woven meticulously by hand. Features a dainty daisy pattern with iridescent pearl centerpieces.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Trending',
    true,
    true,
    5.0,
    96,
    'women'
  ),
  (
    'petal-drop-earrings',
    'Petal Drop Earrings',
    'earrings',
    799.00,
    1099.00,
    ARRAY['/assets/product_earrings.jpg', '/assets/product_necklace.jpg', '/assets/product_bracelet.jpg'],
    'Graceful cascading petal droplets made of fine pastel glass beads. Ultra-lightweight with sterling silver ear hooks.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Limited',
    true,
    true,
    5.0,
    74,
    'women'
  ),
  (
    'golden-pearl-anklet',
    'Golden Pearl Anklet',
    'anklets',
    699.00,
    999.00,
    ARRAY['/assets/product_anklet.jpg', '/assets/product_minimal_charm_anklet.jpg'],
    'Lustrous freshwater pearl beads paired with golden seed beads. Waterproof design crafted for beach days and everyday charm.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Summer Fav',
    true,
    true,
    5.0,
    52,
    'women'
  ),
  (
    'rose-quartz-combo',
    'Rose Quartz Combo',
    'combos',
    1299.00,
    1799.00,
    ARRAY['/assets/product_combo.jpg', '/assets/product_gifting.jpg'],
    'Harmonious duo featuring matching rose quartz charm bracelet and pendant necklace. Arrives in our signature velvet keepsake pouch.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Value Set',
    true,
    false,
    5.0,
    89,
    'women'
  ),
  (
    'classic-pearl-bracelet',
    'Classic Pearl Bracelet',
    'bracelets',
    749.00,
    1099.00,
    ARRAY['/assets/product_classic_pearl_bracelet.jpg', '/assets/product_bracelet.jpg'],
    'Timeless elegance. High-luster round pearls strung on durable stainless steel wire with gold magnetic lock.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Classic',
    true,
    false,
    5.0,
    63,
    'unisex'
  ),
  (
    'minimal-charm-anklet',
    'Minimal Charm Anklet',
    'anklets',
    799.00,
    1199.00,
    ARRAY['/assets/product_minimal_charm_anklet.jpg', '/assets/product_anklet.jpg'],
    'Delicate micro beads with petite starry charms that catch the light effortlessly. Non-tarnish finish.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Minimal',
    true,
    false,
    5.0,
    41,
    'women'
  ),
  (
    'gift-hamper-box',
    'Gift Hamper Box',
    'gifting',
    1499.00,
    2199.00,
    ARRAY['/assets/product_gifting.jpg', '/assets/product_combo.jpg'],
    'Curated luxury gifting box with 3 bestselling handcrafted pieces, personalized handwritten note, and premium gift ribbon wrap.',
    ARRAY['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    'Gift Choice',
    true,
    false,
    5.0,
    112,
    'unisex'
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed Hero Slides
INSERT INTO public.hero_slides (tag, headline, description, button_text, button_link, watermark_text, image_url, display_order, is_active)
VALUES
  (
    'HANDCRAFTED JEWELLERY',
    'Small Beads\nBig Stories',
    'Thoughtfully crafted pieces, made to add a little more love to your everyday.',
    'EXPLORE COLLECTIONS →',
    '/collections',
    'More than\nJewellery',
    '/assets/hero_banner.png',
    1,
    true
  );

-- Seed Site Settings
INSERT INTO public.site_settings (id, whatsapp_phone, contact_email, announcement_text, free_shipping_threshold)
VALUES
  (
    'general',
    '919324556148',
    'shamairakhan712@gmail.com',
    'Free Shipping on all orders above ₹999  |  Extra 10% OFF on your first order',
    999.00
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Popup Offer
INSERT INTO public.popup_offers (title, subtitle, discount_code, badge, button_text, button_link, is_active)
VALUES
  (
    'Special Festive Offer ✨',
    'Get an instant 10% discount on your first handcrafted jewellery order with free gift packaging.',
    'BEADIZO10',
    'LIMITED TIME',
    'EXPLORE DESIGNS →',
    '/collections',
    true
  );
