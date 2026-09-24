-- ==============================================================================
-- Migration: Add Dynamic Legal Policies to site_settings
-- Beadizo E-Commerce Platform
-- ==============================================================================

-- 1. Add policy columns to site_settings table if they don't already exist
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS privacy_policy TEXT,
  ADD COLUMN IF NOT EXISTS refund_policy TEXT,
  ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
  ADD COLUMN IF NOT EXISTS shipping_policy TEXT,
  ADD COLUMN IF NOT EXISTS policies_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Verify settings row exists
INSERT INTO public.site_settings (id, whatsapp_phone, contact_email, announcement_text, announcement_active, free_shipping_threshold)
VALUES ('general', '919324556148', 'shamairakhan712@gmail.com', 'Free Shipping on all orders above ₹999 | Extra 10% OFF on your first order', true, 999)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN public.site_settings.privacy_policy IS 'Custom Privacy Policy text/markdown managed via Admin Console';
COMMENT ON COLUMN public.site_settings.refund_policy IS 'Custom Refund & Return Policy text/markdown managed via Admin Console';
COMMENT ON COLUMN public.site_settings.terms_conditions IS 'Custom Terms & Conditions text/markdown managed via Admin Console';
COMMENT ON COLUMN public.site_settings.shipping_policy IS 'Custom Shipping Policy text/markdown managed via Admin Console';
