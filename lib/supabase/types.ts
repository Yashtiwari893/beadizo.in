export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  display_order: number;
  created_at?: string;
}

export interface DbProduct {
  id: string;
  slug: string;
  title: string;
  category_id?: string | null;
  category_slug: string;
  price: number;
  original_price?: number | null;
  images: string[];
  description?: string | null;
  features?: string[];
  badge?: string | null;
  is_available: boolean;
  is_featured: boolean;
  rating?: number;
  reviews_count?: number;
  gender?: 'men' | 'women' | 'unisex';
  created_at?: string;
  updated_at?: string;
}

export interface DbHeroSlide {
  id: string;
  tag?: string;
  headline: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  watermark_text?: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface DbPopupOffer {
  id: string;
  title: string;
  subtitle?: string;
  discount_code?: string;
  badge?: string;
  image_url?: string;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  created_at?: string;
}

export interface DbSiteSettings {
  id: string;
  whatsapp_phone: string;
  contact_email: string;
  announcement_text: string;
  announcement_active: boolean;
  free_shipping_threshold: number;
  editorial_headline?: string;
  editorial_subtext?: string;
  editorial_image_url?: string;
  craft_headline?: string;
  craft_description?: string;
  craft_image_url?: string;
  updated_at?: string;
}

export interface DbContactSubmission {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  inquiry_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DbInstagramPost {
  id: string;
  image_url: string;
  post_link: string;
  caption?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

