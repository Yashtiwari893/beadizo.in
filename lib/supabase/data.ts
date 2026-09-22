import { supabase, isSupabaseConfigured } from './client';
import { DbProduct, DbCategory, DbHeroSlide, DbPopupOffer, DbSiteSettings, DbContactSubmission, DbInstagramPost, DbBlogPost } from './types';
import { BEADIZO_PRODUCTS } from '@/data/products';
import { safeLink, safeImageUrl } from '@/lib/security/sanitize';

/**
 * Storefront + admin data access.
 *
 * Two important changes from the original implementation:
 *
 * 1. localStorage is used ONLY as a demo mode when Supabase is unconfigured.
 *    Previously every read fell back to localStorage whenever a query errored
 *    or returned zero rows, and every delete wrote back to localStorage even
 *    in Supabase mode. That let a visitor edit `beadizo_cms_products` and see
 *    a catalogue of their own invention — including prices — and it made an
 *    empty catalogue silently display demo products.
 *
 * 2. Reads are targeted. The product page and admin editor no longer pull the
 *    entire products table to find one row.
 */

const DEMO_MODE = !isSupabaseConfigured;

const LOCAL_PRODUCTS_KEY = 'beadizo_cms_products';
const LOCAL_CATEGORIES_KEY = 'beadizo_cms_categories';
const LOCAL_HERO_KEY = 'beadizo_cms_hero';
const LOCAL_OFFERS_KEY = 'beadizo_cms_offers';
const LOCAL_SETTINGS_KEY = 'beadizo_cms_settings';
const LOCAL_INQUIRIES_KEY = 'beadizo_cms_inquiries';
const LOCAL_INSTAGRAM_KEY = 'beadizo_cms_instagram';
const LOCAL_BLOGS_KEY = 'beadizo_cms_blogs';

// In-memory cache for instantaneous client navigation (0ms)
interface CacheItem<T> {
  data: T;
  timestamp: number;
}
const MEM_CACHE = new Map<string, CacheItem<any>>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getCache<T>(key: string): T | null {
  const item = MEM_CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    MEM_CACHE.delete(key);
    return null;
  }
  return item.data as T;
}

function setCache<T>(key: string, data: T): void {
  MEM_CACHE.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    MEM_CACHE.clear();
    return;
  }
  for (const key of Array.from(MEM_CACHE.keys())) {
    if (key.startsWith(prefix)) MEM_CACHE.delete(key);
  }
}

function readLocal<T>(key: string): T | null {
  if (!DEMO_MODE || typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown): void {
  if (!DEMO_MODE || typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — demo mode only, safe to ignore */
  }
}

/** Calls the authenticated admin mutation API and surfaces real errors. */
async function callAdminDataApi<T>(action: string, payload: unknown): Promise<T> {
  const res = await fetch('/api/admin/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
    credentials: 'same-origin',
  });

  const json = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    if (res.status === 401) throw new Error('Your admin session has expired. Please sign in again.');
    // The server already sanitised this message.
    throw new Error(json?.error || 'The operation could not be completed.');
  }

  return json.data as T;
}

/** Normalises untrusted URL fields coming back from the database. */
function sanitiseProduct(p: any): DbProduct {
  return {
    ...p,
    gender: ['men', 'women', 'unisex'].includes(p.gender) ? p.gender : 'unisex',
    images: Array.isArray(p.images) && p.images.length > 0
      ? p.images.map((img: unknown) => safeImageUrl(img))
      : ['/assets/product_bracelet.jpg'],
  };
}

// ==============================================================================
// 1. PRODUCTS
// ==============================================================================
const PRODUCT_COLUMNS =
  'id, slug, title, category_id, category_slug, price, original_price, images, description, features, badge, is_available, is_featured, rating, reviews_count, gender, created_at, updated_at';

function demoProducts(): DbProduct[] {
  const saved = readLocal<DbProduct[]>(LOCAL_PRODUCTS_KEY);
  if (saved) return saved;

  return BEADIZO_PRODUCTS.map((p) => ({
    id: p.id,
    slug: p.id,
    title: p.title,
    category_slug: p.category,
    price: p.price,
    original_price: p.originalPrice,
    images: [p.img],
    description: p.description || '',
    features: ['100% Anti-Tarnish', 'Waterproof & Sweatproof', 'Hypoallergenic', 'Free Pan-India Delivery'],
    badge: p.badge || null,
    is_available: true,
    is_featured: ['blush-charm-bracelet', 'daisy-bloom-necklace', 'petal-drop-earrings', 'golden-pearl-anklet'].includes(p.id),
    rating: p.rating,
    reviews_count: p.reviewsCount,
    gender: (p.gender as 'men' | 'women' | 'unisex') || 'unisex',
  }));
}

async function fetchProductsFromDb(options?: {
  categorySlug?: string;
  gender?: string;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<DbProduct[]> {
  if (DEMO_MODE) {
    let list = demoProducts();
    if (options?.categorySlug && options.categorySlug !== 'all') list = list.filter((p) => p.category_slug === options.categorySlug);
    if (options?.gender && options.gender !== 'all') list = list.filter((p) => (p.gender || 'unisex') === options.gender);
    if (options?.featuredOnly) list = list.filter((p) => p.is_featured);
    return options?.limit ? list.slice(0, options.limit) : list;
  }

  let query = supabase.from('products').select(PRODUCT_COLUMNS).order('created_at', { ascending: false });

  if (options?.categorySlug && options.categorySlug !== 'all') query = query.eq('category_slug', options.categorySlug);
  if (options?.gender && options.gender !== 'all') query = query.eq('gender', options.gender);
  if (options?.featuredOnly) query = query.eq('is_featured', true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    console.error('[data] getProducts failed:', error.message);
    return [];
  }
  return (data || []).map(sanitiseProduct);
}

export async function getProducts(options?: {
  categorySlug?: string;
  gender?: string;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<DbProduct[]> {
  const cacheKey = `products:${options?.categorySlug || 'all'}:${options?.gender || 'all'}:${options?.featuredOnly ? 'feat' : 'all'}:${options?.limit || 'all'}`;

  const cached = MEM_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached) {
    if (now - cached.timestamp > CACHE_TTL_MS) {
      // Background revalidation
      fetchProductsFromDb(options).then((fresh) => {
        MEM_CACHE.set(cacheKey, { data: fresh, timestamp: Date.now() });
      }).catch(() => {});
    }
    return cached.data;
  }

  const fresh = await fetchProductsFromDb(options);
  MEM_CACHE.set(cacheKey, { data: fresh, timestamp: Date.now() });
  // Index individual items
  for (const p of fresh) {
    if (p.id) MEM_CACHE.set(`product:${p.id}`, { data: p, timestamp: Date.now() });
    if (p.slug) MEM_CACHE.set(`product:${p.slug}`, { data: p, timestamp: Date.now() });
  }
  return fresh;
}

async function fetchProductByIdOrSlugFromDb(key: string): Promise<DbProduct | null> {
  if (DEMO_MODE) {
    return demoProducts().find((p) => p.id === key || p.slug === key) || null;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq(isUuid ? 'id' : 'slug', key)
    .maybeSingle();

  if (error) {
    console.error('[data] getProductByIdOrSlug failed:', error.message);
    return null;
  }
  return data ? sanitiseProduct(data) : null;
}

export function getCachedProduct(idOrSlug: string): DbProduct | null {
  const key = String(idOrSlug || '').slice(0, 80);
  if (!key) return null;
  const direct = MEM_CACHE.get(`product:${key}`);
  if (direct) return direct.data;
  for (const [cKey, item] of Array.from(MEM_CACHE.entries())) {
    if (cKey.startsWith('products:') && Array.isArray(item.data)) {
      const match = item.data.find((p: DbProduct) => p.id === key || p.slug === key);
      if (match) return match;
    }
  }
  return null;
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<DbProduct | null> {
  const key = String(idOrSlug || '').slice(0, 80);
  if (!key) return null;

  const cached = getCachedProduct(key);
  if (cached) {
    return cached;
  }

  // Scan products array cache
  for (const [cKey, item] of Array.from(MEM_CACHE.entries())) {
    if (cKey.startsWith('products:') && Array.isArray(item.data)) {
      const match = item.data.find((p: DbProduct) => p.id === key || p.slug === key);
      if (match) {
        MEM_CACHE.set(`product:${key}`, { data: match, timestamp: Date.now() });
        return match;
      }
    }
  }

  const fresh = await fetchProductByIdOrSlugFromDb(key);
  if (fresh) {
    MEM_CACHE.set(`product:${key}`, { data: fresh, timestamp: Date.now() });
    if (fresh.id) MEM_CACHE.set(`product:${fresh.id}`, { data: fresh, timestamp: Date.now() });
    if (fresh.slug) MEM_CACHE.set(`product:${fresh.slug}`, { data: fresh, timestamp: Date.now() });
  }
  return fresh;
}

/** Related products for a PDP: same category, excluding the current item. */
export async function getRelatedProducts(product: DbProduct, limit = 4): Promise<DbProduct[]> {
  if (DEMO_MODE) {
    return demoProducts()
      .filter((p) => p.id !== product.id && (p.category_slug === product.category_slug || p.is_featured))
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('category_slug', product.category_slug)
    .eq('is_available', true)
    .neq('id', product.id)
    .limit(limit);

  if (error) {
    console.error('[data] getRelatedProducts failed:', error.message);
    return [];
  }

  return (data || []).map(sanitiseProduct);
}

export async function saveProduct(product: Partial<DbProduct>): Promise<DbProduct> {
  invalidateCache('product');
  if (!DEMO_MODE) {
    return callAdminDataApi<DbProduct>('saveProduct', product);
  }

  const current = demoProducts();
  const id = product.id || `local-${Date.now()}`;
  const slug = product.slug || `product-${Date.now()}`;
  const item: DbProduct = {
    id,
    slug,
    title: product.title || 'Untitled Product',
    category_slug: product.category_slug || 'bracelets',
    price: Number(product.price || 0),
    original_price: product.original_price ? Number(product.original_price) : null,
    images: product.images?.length ? product.images : ['/assets/product_bracelet.jpg'],
    description: product.description || '',
    features: product.features || [],
    badge: product.badge || null,
    is_available: product.is_available !== false,
    is_featured: Boolean(product.is_featured),
    rating: product.rating || 5.0,
    reviews_count: product.reviews_count || 0,
  };

  const idx = current.findIndex((p) => p.id === id);
  if (idx > -1) current[idx] = item;
  else current.unshift(item);

  writeLocal(LOCAL_PRODUCTS_KEY, current);
  return item;
}

export async function deleteProduct(id: string): Promise<boolean> {
  invalidateCache('product');
  if (!DEMO_MODE) {
    await callAdminDataApi('deleteProduct', { id });
    return true;
  }
  writeLocal(LOCAL_PRODUCTS_KEY, demoProducts().filter((p) => p.id !== id));
  return true;
}

export async function deleteProductsBatch(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) return true;
  invalidateCache('product');
  if (!DEMO_MODE) {
    await callAdminDataApi('deleteProductsBatch', { ids });
    return true;
  }
  const current = demoProducts().filter((p) => !ids.includes(p.id));
  writeLocal(LOCAL_PRODUCTS_KEY, current);
  return true;
}


// ==============================================================================
// 2. CATEGORIES
// ==============================================================================
const DEFAULT_CATEGORIES: DbCategory[] = [
  { id: '1', name: 'Bracelets', slug: 'bracelets', image_url: '/assets/product_bracelet.jpg', display_order: 1 },
  { id: '2', name: 'Necklaces', slug: 'necklaces', image_url: '/assets/product_necklace.jpg', display_order: 2 },
  { id: '3', name: 'Earrings', slug: 'earrings', image_url: '/assets/product_earrings.jpg', display_order: 3 },
  { id: '4', name: 'Anklets', slug: 'anklets', image_url: '/assets/product_anklet.jpg', display_order: 4 },
  { id: '5', name: 'Combo Sets', slug: 'combos', image_url: '/assets/product_combo.jpg', display_order: 5 },
  { id: '6', name: 'Gifting Box', slug: 'gifting', image_url: '/assets/product_gifting.jpg', display_order: 6 },
];

export async function getCategories(): Promise<DbCategory[]> {
  const cached = MEM_CACHE.get('categories:all');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (DEMO_MODE) {
    const list = readLocal<DbCategory[]>(LOCAL_CATEGORIES_KEY) || DEFAULT_CATEGORIES;
    MEM_CACHE.set('categories:all', { data: list, timestamp: Date.now() });
    return list;
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, display_order')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[data] getCategories failed:', error.message);
    return cached?.data || DEFAULT_CATEGORIES;
  }

  const result = (data || []).map((c: any) => ({ ...c, image_url: safeImageUrl(c.image_url) }));
  MEM_CACHE.set('categories:all', { data: result, timestamp: Date.now() });
  return result;
}

export async function saveCategory(category: Partial<DbCategory>): Promise<DbCategory> {
  invalidateCache('categories');
  if (!DEMO_MODE) {
    return callAdminDataApi<DbCategory>('saveCategory', category);
  }

  const current = readLocal<DbCategory[]>(LOCAL_CATEGORIES_KEY) || DEFAULT_CATEGORIES;
  const id = category.id || `cat-${Date.now()}`;
  const item: DbCategory = {
    id,
    name: category.name || 'New Category',
    slug: category.slug || 'category',
    image_url: category.image_url || '/assets/product_bracelet.jpg',
    display_order: category.display_order || current.length + 1,
  };
  const idx = current.findIndex((c) => c.id === id);
  if (idx > -1) current[idx] = item;
  else current.push(item);

  writeLocal(LOCAL_CATEGORIES_KEY, current);
  return item;
}

export async function deleteCategory(id: string): Promise<boolean> {
  invalidateCache('categories');
  if (!DEMO_MODE) {
    await callAdminDataApi('deleteCategory', { id });
    return true;
  }
  const current = readLocal<DbCategory[]>(LOCAL_CATEGORIES_KEY) || DEFAULT_CATEGORIES;
  writeLocal(LOCAL_CATEGORIES_KEY, current.filter((c) => c.id !== id));
  return true;
}

export async function deleteCategoriesBatch(ids: string[], force = false): Promise<any> {
  if (!ids || ids.length === 0) return { success: true, count: 0 };
  invalidateCache('categories');
  if (!DEMO_MODE) {
    return await callAdminDataApi('deleteCategoriesBatch', { ids, force });
  }
  const current = readLocal<DbCategory[]>(LOCAL_CATEGORIES_KEY) || DEFAULT_CATEGORIES;
  writeLocal(LOCAL_CATEGORIES_KEY, current.filter((c) => !ids.includes(c.id)));
  return { success: true, count: ids.length };
}


// ==============================================================================
// 3. HERO SLIDES
// ==============================================================================
const DEFAULT_HERO: DbHeroSlide[] = [
  {
    id: 'default-hero',
    tag: 'HANDCRAFTED JEWELLERY',
    headline: 'Small Beads\nBig Stories',
    description: 'Thoughtfully crafted pieces, made to add a little more love to your everyday.',
    button_text: 'EXPLORE COLLECTIONS →',
    button_link: '/collections',
    watermark_text: 'More than\nJewellery',
    image_url: '/assets/hero_banner.png',
    display_order: 1,
    is_active: true,
  },
];

function normaliseHeroSlide(slide: any): DbHeroSlide {
  let headline = String(slide.headline || 'Small Beads\nBig Stories').replace(/\\n/g, '\n').trim();
  if (headline.toLowerCase() === 'small beads big stories') {
    headline = 'Small Beads\nBig Stories';
  }

  let watermark_text = String(slide.watermark_text || 'More than\nJewellery').replace(/\\n/g, '\n').trim();
  if (watermark_text.toLowerCase() === 'more than jewellery') {
    watermark_text = 'More than\nJewellery';
  }

  let button_text = String(slide.button_text || 'EXPLORE COLLECTIONS →').trim();
  if (button_text && !button_text.endsWith('→') && !button_text.endsWith('->')) {
    button_text = `${button_text} →`;
  }

  return {
    ...slide,
    headline,
    watermark_text,
    button_text: button_text || 'EXPLORE COLLECTIONS →',
    button_link: safeLink(slide.button_link, '/collections'),
    image_url: safeImageUrl(slide.image_url, '/assets/hero_banner.png'),
  };
}

export async function getHeroSlides(): Promise<DbHeroSlide[]> {
  const cached = MEM_CACHE.get('hero:all');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (DEMO_MODE) {
    const list = (readLocal<DbHeroSlide[]>(LOCAL_HERO_KEY) || DEFAULT_HERO).map(normaliseHeroSlide);
    MEM_CACHE.set('hero:all', { data: list, timestamp: Date.now() });
    return list;
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[data] getHeroSlides failed:', error.message);
    return cached?.data || DEFAULT_HERO.map(normaliseHeroSlide);
  }

  const result = (data?.length ? data : DEFAULT_HERO).map(normaliseHeroSlide);
  MEM_CACHE.set('hero:all', { data: result, timestamp: Date.now() });
  return result;
}

export async function saveHeroSlide(slide: Partial<DbHeroSlide>): Promise<DbHeroSlide> {
  invalidateCache('hero');
  const cleaned: Partial<DbHeroSlide> = {
    ...slide,
    headline: slide.headline ? String(slide.headline).replace(/\\n/g, '\n').trim() : undefined,
    watermark_text: slide.watermark_text ? String(slide.watermark_text).replace(/\\n/g, '\n').trim() : undefined,
  };
  if (!DEMO_MODE) {
    return callAdminDataApi<DbHeroSlide>('saveHeroSlide', cleaned);
  }

  const current = readLocal<DbHeroSlide[]>(LOCAL_HERO_KEY) || DEFAULT_HERO;
  const id = slide.id || `hero-${Date.now()}`;
  const item = normaliseHeroSlide({ ...DEFAULT_HERO[0], ...cleaned, id });
  const idx = current.findIndex((h) => h.id === id);
  if (idx > -1) current[idx] = item;
  else current.unshift(item);

  writeLocal(LOCAL_HERO_KEY, current);
  return item;
}

export async function deleteHeroSlide(id: string): Promise<boolean> {
  invalidateCache('hero');
  if (!DEMO_MODE) {
    await callAdminDataApi('deleteHeroSlide', { id });
    return true;
  }
  const current = readLocal<DbHeroSlide[]>(LOCAL_HERO_KEY) || DEFAULT_HERO;
  writeLocal(LOCAL_HERO_KEY, current.filter((h) => h.id !== id));
  return true;
}

// ==============================================================================
// 4. POPUP OFFERS
// ==============================================================================
const DEFAULT_OFFERS: DbPopupOffer[] = [
  {
    id: 'default-offer',
    title: 'Special Festive Offer ✨',
    subtitle: 'Get an instant 10% discount on your first handcrafted jewellery order with free gift packaging.',
    discount_code: 'BEADIZO10',
    badge: 'LIMITED TIME',
    button_text: 'EXPLORE DESIGNS →',
    button_link: '/collections',
    is_active: true,
  },
];

export async function getPopupOffers(): Promise<DbPopupOffer[]> {
  const cached = MEM_CACHE.get('offers:all');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (DEMO_MODE) {
    const list = readLocal<DbPopupOffer[]>(LOCAL_OFFERS_KEY) || DEFAULT_OFFERS;
    MEM_CACHE.set('offers:all', { data: list, timestamp: Date.now() });
    return list;
  }

  const { data, error } = await supabase
    .from('popup_offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[data] getPopupOffers failed:', error.message);
    return cached?.data || [];
  }

  const result = (data || []).map((offer: any) => ({
    ...offer,
    button_link: safeLink(offer.button_link, '/collections'),
    image_url: offer.image_url ? safeImageUrl(offer.image_url, '') : undefined,
  }));
  MEM_CACHE.set('offers:all', { data: result, timestamp: Date.now() });
  return result;
}

export async function savePopupOffer(offer: Partial<DbPopupOffer>): Promise<DbPopupOffer> {
  invalidateCache('offers');
  if (!DEMO_MODE) {
    return callAdminDataApi<DbPopupOffer>('savePopupOffer', offer);
  }

  const current = readLocal<DbPopupOffer[]>(LOCAL_OFFERS_KEY) || DEFAULT_OFFERS;
  const id = offer.id || `offer-${Date.now()}`;
  if (offer.is_active) current.forEach((o) => (o.is_active = false));

  const item = { ...DEFAULT_OFFERS[0], ...offer, id } as DbPopupOffer;
  const idx = current.findIndex((o) => o.id === id);
  if (idx > -1) current[idx] = item;
  else current.unshift(item);

  writeLocal(LOCAL_OFFERS_KEY, current);
  return item;
}

export async function deletePopupOffer(id: string): Promise<boolean> {
  invalidateCache('offers');
  if (!DEMO_MODE) {
    await callAdminDataApi('deletePopupOffer', { id });
    return true;
  }
  const current = readLocal<DbPopupOffer[]>(LOCAL_OFFERS_KEY) || DEFAULT_OFFERS;
  writeLocal(LOCAL_OFFERS_KEY, current.filter((o) => o.id !== id));
  return true;
}

// ==============================================================================
// 5. SITE SETTINGS
// ==============================================================================
const DEFAULT_SETTINGS: DbSiteSettings = {
  id: 'general',
  whatsapp_phone: '919324556148',
  contact_email: 'shamairakhan712@gmail.com',
  announcement_text: 'Free Shipping on all orders above ₹999  |  Extra 10% OFF on your first order',
  announcement_active: true,
  free_shipping_threshold: 999,
  editorial_headline: 'Jewellery That Feels Like You',
  editorial_subtext: 'Minimal, meaningful and made to be a part of your everyday moments.',
  editorial_image_url: '/assets/jewellery_feels_like_you.png',
  craft_headline: 'More Than Jewellery',
  craft_description:
    'Every bead tells a story – of tradition, craftsmanship and the little moments that make life beautiful.',
  craft_image_url: '/assets/more_than_jewellery.png',
};

export async function getSiteSettings(): Promise<DbSiteSettings> {
  const cached = MEM_CACHE.get('settings:general');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (DEMO_MODE) {
    const list = readLocal<DbSiteSettings>(LOCAL_SETTINGS_KEY) || DEFAULT_SETTINGS;
    MEM_CACHE.set('settings:general', { data: list, timestamp: Date.now() });
    return list;
  }

  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'general').maybeSingle();

  if (error) {
    console.error('[data] getSiteSettings failed:', error.message);
    return cached?.data || DEFAULT_SETTINGS;
  }

  if (!data) return cached?.data || DEFAULT_SETTINGS;

  const result = {
    ...DEFAULT_SETTINGS,
    ...data,
    editorial_image_url: safeImageUrl(data.editorial_image_url, DEFAULT_SETTINGS.editorial_image_url),
    craft_image_url: safeImageUrl(data.craft_image_url, DEFAULT_SETTINGS.craft_image_url),
  };
  MEM_CACHE.set('settings:general', { data: result, timestamp: Date.now() });
  return result;
}

export async function saveSiteSettings(settings: Partial<DbSiteSettings>): Promise<DbSiteSettings> {
  invalidateCache('settings');
  if (!DEMO_MODE) {
    return callAdminDataApi<DbSiteSettings>('saveSiteSettings', settings);
  }

  const current = readLocal<DbSiteSettings>(LOCAL_SETTINGS_KEY) || DEFAULT_SETTINGS;
  const merged = { ...current, ...settings, id: 'general' };
  writeLocal(LOCAL_SETTINGS_KEY, merged);
  return merged;
}

// ==============================================================================
// 6. CONTACT SUBMISSIONS / INQUIRIES
// ==============================================================================
const DEFAULT_INQUIRIES: DbContactSubmission[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Priya Sharma',
    phone: '9876543210',
    email: 'priya.sharma@example.com',
    inquiry_type: 'Custom Handcrafted Jewellery',
    message: 'Hello, I loved the Rose Quartz bracelet! Can you make a customized matching necklace for a wedding reception next month?',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Aarav Patel',
    phone: '9123456789',
    email: 'aarav.p@example.com',
    inquiry_type: 'Bulk / Corporate Order',
    message: 'Looking for 25 units of evil eye bracelets in individual gift boxes for gifting to our design team.',
    is_read: true,
    created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
];

export async function getContactSubmissions(): Promise<DbContactSubmission[]> {
  if (DEMO_MODE) {
    const list = readLocal<DbContactSubmission[]>(LOCAL_INQUIRIES_KEY);
    if (!list) {
      writeLocal(LOCAL_INQUIRIES_KEY, DEFAULT_INQUIRIES);
      return DEFAULT_INQUIRIES;
    }
    return list;
  }

  // Under RLS, anon cannot SELECT contact_submissions.
  // We use the authenticated admin endpoint which reads with the service-role client.
  return callAdminDataApi<DbContactSubmission[]>('getContactSubmissions', {});
}

export async function markContactSubmissionRead(id: string, is_read: boolean): Promise<DbContactSubmission> {
  if (DEMO_MODE) {
    const list = (readLocal<DbContactSubmission[]>(LOCAL_INQUIRIES_KEY) || DEFAULT_INQUIRIES).map((item) =>
      item.id === id ? { ...item, is_read } : item
    );
    writeLocal(LOCAL_INQUIRIES_KEY, list);
    const updated = list.find((i) => i.id === id);
    if (!updated) throw new Error('Inquiry not found.');
    return updated;
  }

  return callAdminDataApi<DbContactSubmission>('markContactSubmissionRead', { id, is_read });
}

export async function deleteContactSubmission(id: string): Promise<boolean> {
  if (DEMO_MODE) {
    const list = (readLocal<DbContactSubmission[]>(LOCAL_INQUIRIES_KEY) || DEFAULT_INQUIRIES).filter((i) => i.id !== id);
    writeLocal(LOCAL_INQUIRIES_KEY, list);
    return true;
  }

  await callAdminDataApi<{ success: boolean }>('deleteContactSubmission', { id });
  return true;
}

export async function getUnreadInquiriesCount(): Promise<number> {
  try {
    const submissions = await getContactSubmissions();
    return submissions.filter((s) => !s.is_read).length;
  } catch {
    return 0;
  }
}

// ==============================================================================
// 7. INSTAGRAM POSTS ("FOLLOW US @BEADIZO")
// ==============================================================================
export const DEFAULT_INSTAGRAM_POSTS: DbInstagramPost[] = [
  {
    id: 'default-insta-1',
    image_url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=600&q=80',
    post_link: 'https://www.instagram.com/beadizo.in',
    caption: 'Beadizo lookbook 1',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'default-insta-2',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    post_link: 'https://www.instagram.com/beadizo.in',
    caption: 'Beadizo lookbook 2',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'default-insta-3',
    image_url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
    post_link: 'https://www.instagram.com/beadizo.in',
    caption: 'Beadizo lookbook 3',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'default-insta-4',
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
    post_link: 'https://www.instagram.com/beadizo.in',
    caption: 'Beadizo lookbook 4',
    display_order: 4,
    is_active: true,
  },
  {
    id: 'default-insta-5',
    image_url: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=600&q=80',
    post_link: 'https://www.instagram.com/beadizo.in',
    caption: 'Beadizo lookbook 5',
    display_order: 5,
    is_active: true,
  },
  {
    id: 'default-insta-6',
    image_url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=600&q=80',
    post_link: 'https://www.instagram.com/beadizo.in',
    caption: 'Beadizo lookbook 6',
    display_order: 6,
    is_active: true,
  },
];

function normaliseInstagramPost(raw: any): DbInstagramPost {
  return {
    id: String(raw.id || ''),
    image_url: safeImageUrl(raw.image_url, DEFAULT_INSTAGRAM_POSTS[0].image_url),
    post_link: safeLink(raw.post_link, 'https://www.instagram.com/beadizo.in'),
    caption: raw.caption ? String(raw.caption).slice(0, 200) : null,
    display_order: Number.isFinite(Number(raw.display_order)) ? Number(raw.display_order) : 0,
    is_active: Boolean(raw.is_active ?? true),
    created_at: raw.created_at,
  };
}

export async function getInstagramPosts(includeInactive = false): Promise<DbInstagramPost[]> {
  const cacheKey = `instagram:${includeInactive ? 'all' : 'active'}`;
  const cached = MEM_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (DEMO_MODE) {
    const list = readLocal<DbInstagramPost[]>(LOCAL_INSTAGRAM_KEY) || DEFAULT_INSTAGRAM_POSTS;
    const filtered = includeInactive ? list : list.filter((p) => p.is_active);
    const result = filtered.map(normaliseInstagramPost);
    MEM_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  let query = supabase
    .from('instagram_posts')
    .select('*')
    .order('display_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[data] getInstagramPosts failed:', error.message);
    const fallback = includeInactive ? DEFAULT_INSTAGRAM_POSTS : DEFAULT_INSTAGRAM_POSTS.filter((p) => p.is_active);
    return cached?.data || fallback;
  }

  // If table has records, use them; if empty, fallback to curated lookbook posts
  const list = data && data.length > 0 ? data : (includeInactive ? [] : DEFAULT_INSTAGRAM_POSTS);
  const result = list.map(normaliseInstagramPost);
  MEM_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

export async function saveInstagramPost(post: Partial<DbInstagramPost>): Promise<DbInstagramPost> {
  invalidateCache('instagram');
  if (!DEMO_MODE) {
    return callAdminDataApi<DbInstagramPost>('saveInstagramPost', post);
  }

  const current = readLocal<DbInstagramPost[]>(LOCAL_INSTAGRAM_KEY) || [...DEFAULT_INSTAGRAM_POSTS];
  const id = post.id || `insta-${Date.now()}`;
  const item = normaliseInstagramPost({ ...DEFAULT_INSTAGRAM_POSTS[0], ...post, id });
  const idx = current.findIndex((p) => p.id === id);
  if (idx > -1) current[idx] = item;
  else current.push(item);

  writeLocal(LOCAL_INSTAGRAM_KEY, current);
  return item;
}

export async function deleteInstagramPost(id: string): Promise<boolean> {
  invalidateCache('instagram');
  if (!DEMO_MODE) {
    await callAdminDataApi('deleteInstagramPost', { id });
    return true;
  }

  const current = readLocal<DbInstagramPost[]>(LOCAL_INSTAGRAM_KEY) || [...DEFAULT_INSTAGRAM_POSTS];
  writeLocal(LOCAL_INSTAGRAM_KEY, current.filter((p) => p.id !== id));
  return true;
}

export async function generateProductAiContent(
  type: 'description' | 'features',
  title: string,
  slug?: string,
  existingDescription?: string
): Promise<string | string[]> {
  const res = await fetch('/api/admin/ai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, title, slug, existingDescription }),
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate AI content.');
  }

  return data.result;
}

// ==============================================================================
// 7. BLOG POSTS & SEO JOURNAL
// ==============================================================================

const DEFAULT_BLOG_POSTS: DbBlogPost[] = [
  {
    id: 'blog-1',
    slug: 'the-art-of-handcrafted-beaded-jewellery',
    title: 'The Art of Handcrafted Beaded Jewellery: Why Handmade Matters',
    excerpt: 'Discover the patience, passion, and intricate artistry behind handcrafted bead jewellery. Explore why handmade pieces hold timeless emotional and aesthetic value.',
    content: `In a world dominated by mass-produced accessories, handcrafted jewellery stands out as a breath of fresh air. At **Beadizo**, every bead is hand-strung, every knot is thoughtfully secured, and every design is born from passion and purpose.

### The Soul in Every Bead
Handmade bead jewellery is more than just an ornament—it is a wearable story. Unlike machine-molded pieces that lack individuality, artisan jewellery reflects the subtle nuances of human hands:
- **Intricate Attention to Detail**: Each bead is selected for color harmony, shape consistency, and lustre.
- **Durable Craftsmanship**: High-tensile cords, premium elastic threads, and secure clasps ensure lasting beauty.
- **Unique Character**: No two handmade pieces are ever 100% identical, making your jewellery truly one-of-a-kind.

### Sustainable & Thoughtful Gifting
Choosing handmade also means supporting slow fashion and ethical creation. Whether you are treating yourself or gifting a loved one, a handcrafted beaded necklace or bracelet carries genuine sentiment.

Explore our latest handcrafted arrivals and celebrate the beauty of Little Beads and Big Stories.`,
    cover_image: '/assets/product_necklace.jpg',
    tags: ['Handcrafted', 'Slow Fashion', 'Artisan Story', 'Styling'],
    meta_title: 'The Art of Handcrafted Beaded Jewellery | Beadizo Journal',
    meta_description: 'Explore why handcrafted beaded jewellery from Beadizo is the perfect blend of slow fashion, timeless artistry, and personal storytelling.',
    is_published: true,
    published_at: '2026-03-15T10:00:00Z',
    read_time: '4 min read',
    created_at: '2026-03-15T10:00:00Z',
  },
  {
    id: 'blog-2',
    slug: 'how-to-style-beaded-bracelets-everyday-festive',
    title: 'How to Style Beaded Bracelets for Everyday Elegance & Festive Looks',
    excerpt: 'From delicate wrist stacks to statement crystal pieces, master the art of styling beaded bracelets for office wear, casual outings, and traditional Indian celebrations.',
    content: `Beaded bracelets are among the most versatile fashion accessories in your wardrobe. Whether you prefer a minimalist aesthetic or vibrant bohemian layers, here is your ultimate styling guide:

### 1. The Everyday Minimalist Stack
For workplace elegance or casual weekend coffee dates, less is often more:
- Pair 1-2 slender glass bead bracelets with a classic metallic watch.
- Stick to neutral tones: champagne, soft blush rose-gold, or earthy sand tones.

### 2. Festive Glamour with Traditional Attire
During wedding seasons, Diwali, or festive family gatherings, handcrafted beads add effortless royal charm:
- Stack multi-toned crystal and pearl beads alongside metallic bangles.
- Contrast deep jewel tones (emerald green, ruby red, sapphire blue) against pastel sarees or lehengas.

### 3. Mixed Texture Layering
Do not be afraid to combine different bead materials:
- Pair natural matte gemstone beads with high-shine faceted crystals.
- Add charm accents (evil eye, moon, stars) to introduce dynamic focal points.

Discover your signature wrist stack in the Beadizo Bracelets Collection today!`,
    cover_image: '/assets/product_bracelet.jpg',
    tags: ['Style Guide', 'Bracelets', 'Festive Fashion', 'Stacking Tips'],
    meta_title: 'How to Style Beaded Bracelets: Everyday & Festive Guide | Beadizo',
    meta_description: 'Master the art of stacking and styling handcrafted beaded bracelets for work, casual outings, and festive occasions with Beadizo.',
    is_published: true,
    published_at: '2026-03-18T14:30:00Z',
    read_time: '5 min read',
    created_at: '2026-03-18T14:30:00Z',
  },
  {
    id: 'blog-3',
    slug: 'healing-crystals-and-bead-meanings',
    title: 'The Meaning Behind Gemstones & Glass Beads: More Than Just Jewellery',
    excerpt: 'Uncover the symbolism and emotional significance behind popular bead materials, from calming turquoise to protective evil eye charms and vibrant agates.',
    content: `Throughout history, beads have been cherished not only for adornment but as talismans of protection, healing, and positive energy. When you wear a Beadizo piece, you carry these timeless meanings with you:

### The Evil Eye Charm — Protection & Good Fortune
The ancient Mediterranean symbol is renowned for warding off negativity, envy, and harmful intentions. Wearing an evil eye bead acts as a personal shield while infusing modern elegance into your daily ensemble.

### Rose Quartz — Unconditional Love & Harmony
Known as the stone of unconditional love, rose quartz beads promote self-compassion, emotional healing, and gentle warmth in relationships.

### Turquoise & Ocean Blue — Calm & Clear Expression
Blue beads evoke the serenity of the sea. They encourage calm mindfulness, clear communication, and grounding throughout busy days.

### Celebrating Your Personal Talisman
Jewellery becomes infinitely more precious when it connects with your spirit. Explore our symbolic bead collections and find the piece that resonates with your personal journey.`,
    cover_image: '/assets/product_earring.jpg',
    tags: ['Crystal Meanings', 'Evil Eye', 'Symbolism', 'Mindful Living'],
    meta_title: 'Gemstone & Bead Meanings: Crystal Symbolism Guide | Beadizo',
    meta_description: 'Learn the spiritual and emotional meanings behind evil eye charms, rose quartz, and crystal beads in Beadizo handcrafted jewellery.',
    is_published: true,
    published_at: '2026-03-20T09:15:00Z',
    read_time: '6 min read',
    created_at: '2026-03-20T09:15:00Z',
  },
];

function normaliseBlogPost(raw: any): DbBlogPost {
  return {
    id: String(raw.id || `blog-${Date.now()}`),
    slug: String(raw.slug || '').trim().toLowerCase(),
    title: String(raw.title || 'Untitled Post').trim(),
    excerpt: String(raw.excerpt || '').trim(),
    content: String(raw.content || ''),
    cover_image: safeImageUrl(raw.cover_image || '/assets/product_necklace.jpg'),
    tags: Array.isArray(raw.tags) ? raw.tags.map((t: any) => String(t).trim()).filter(Boolean) : ['Handcrafted'],
    meta_title: raw.meta_title ? String(raw.meta_title).trim() : undefined,
    meta_description: raw.meta_description ? String(raw.meta_description).trim() : undefined,
    is_published: typeof raw.is_published === 'boolean' ? raw.is_published : true,
    published_at: raw.published_at || new Date().toISOString(),
    read_time: raw.read_time || '4 min read',
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export async function getBlogPosts(): Promise<DbBlogPost[]> {
  const cached = getCache<DbBlogPost[]>('blogs:all');
  if (cached) return cached;

  if (!DEMO_MODE) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalised = data.map(normaliseBlogPost);
        setCache('blogs:all', normalised);
        return normalised;
      }
    } catch {
      // Graceful fallback if table does not exist yet
    }
  }

  const local = readLocal<DbBlogPost[]>(LOCAL_BLOGS_KEY);
  const posts = local && local.length > 0 ? local.map(normaliseBlogPost) : [...DEFAULT_BLOG_POSTS];
  setCache('blogs:all', posts);
  return posts;
}

export async function getBlogPostBySlug(slug: string): Promise<DbBlogPost | null> {
  const cleanSlug = slug.trim().toLowerCase();
  const all = await getBlogPosts();
  return all.find((p) => p.slug === cleanSlug && p.is_published) || null;
}

export async function saveBlogPost(post: Partial<DbBlogPost>): Promise<DbBlogPost> {
  invalidateCache('blogs');

  if (!DEMO_MODE) {
    try {
      const saved = await callAdminDataApi<DbBlogPost>('saveBlogPost', post);
      return normaliseBlogPost(saved);
    } catch {
      // fallback to local below
    }
  }

  const current = readLocal<DbBlogPost[]>(LOCAL_BLOGS_KEY) || [...DEFAULT_BLOG_POSTS];
  const id = post.id || `blog-${Date.now()}`;
  const item = normaliseBlogPost({
    ...DEFAULT_BLOG_POSTS[0],
    ...post,
    id,
    updated_at: new Date().toISOString(),
  });

  const idx = current.findIndex((p) => p.id === id);
  if (idx > -1) current[idx] = item;
  else current.unshift(item);

  writeLocal(LOCAL_BLOGS_KEY, current);
  return item;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  invalidateCache('blogs');

  if (!DEMO_MODE) {
    try {
      await callAdminDataApi('deleteBlogPost', { id });
      return true;
    } catch {
      // fallback
    }
  }

  const current = readLocal<DbBlogPost[]>(LOCAL_BLOGS_KEY) || [...DEFAULT_BLOG_POSTS];
  writeLocal(LOCAL_BLOGS_KEY, current.filter((p) => p.id !== id));
  return true;
}

export async function generateBlogAiPost(
  topic: string,
  keywords?: string
): Promise<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  read_time?: string;
}> {
  const res = await fetch('/api/admin/ai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'blog', title: topic, existingDescription: keywords }),
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate AI blog article.');
  }

  return data.result;
}



