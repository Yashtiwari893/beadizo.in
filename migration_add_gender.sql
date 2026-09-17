-- ==========================================================================
-- BEADIZO MIGRATION: ADD GENDER ATTRIBUTE TO PRODUCTS
-- Run this in Supabase SQL Editor (supabase.com -> Project -> SQL Editor)
-- ==========================================================================

-- 1. Add gender column with default 'unisex'
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'unisex';

-- 2. Add validation check constraint (men, women, unisex)
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_gender_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_gender_check
  CHECK (gender IN ('men', 'women', 'unisex'));

-- 3. Create index for fast filtering (.eq('gender', selectedGender))
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products (gender);

-- 4. Set sensible initial values for seed products (optional)
UPDATE public.products
SET gender = 'women'
WHERE category_slug IN ('earrings', 'anklets') AND gender = 'unisex';

COMMENT ON COLUMN public.products.gender IS 'Product audience attribute: men, women, or unisex';
