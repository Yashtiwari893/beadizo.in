import {
  clampString,
  clampStringArray,
  clampNumber,
  toBoolean,
  toSlug,
  isUuid,
  safeLink,
  safeImageUrl,
  MAX_LONG_TEXT,
} from '@/lib/security/sanitize';

/**
 * Every admin mutation goes through one of these builders.
 *
 * They are strict ALLOWLISTS: any field the client sends that is not named
 * here is dropped. This closes the mass-assignment hole where `{...payload}`
 * was spread straight into a service-role INSERT/UPDATE, letting a caller
 * write arbitrary columns (id, created_at, or any column added in future).
 */

export class ValidationError extends Error {}

function fail(message: string): never {
  throw new ValidationError(message);
}

export interface Validated<T> {
  /** Present only for updates. Always a verified UUID. */
  id?: string;
  record: T;
}

/** An id is an update target only if it is a genuine UUID. */
function extractId(payload: any): string | undefined {
  const id = payload?.id;
  if (id === undefined || id === null || id === '') return undefined;
  if (!isUuid(id)) {
    // Locally-generated ids ("local-123", "cat-456", "insta-789") are not database rows.
    if (typeof id === 'string' && /^(local|cat|hero|offer|insta)-/.test(id)) return undefined;
    fail('Invalid record id.');
  }
  return id as string;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export function validateProduct(payload: any): Validated<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') fail('Invalid product payload.');

  const title = clampString(payload.title, 160);
  if (!title) fail('Product title is required.');

  const price = clampNumber(payload.price, { min: 0, max: 10_000_000, fallback: -1 });
  if (price < 0) fail('Product price must be a positive number.');

  const rawOriginal = payload.original_price;
  let originalPrice: number | null = null;
  if (rawOriginal !== null && rawOriginal !== undefined && rawOriginal !== '') {
    const parsed = clampNumber(rawOriginal, { min: 0, max: 10_000_000, fallback: -1 });
    if (parsed < 0) fail('Original price must be a positive number.');
    // A "discount" that raises the price is a data-integrity bug, not a sale.
    if (parsed > 0 && parsed < price) {
      fail('Original price cannot be lower than the selling price.');
    }
    // 0 means "no MRP set", which is stored as NULL rather than a fake ₹0 MRP.
    originalPrice = parsed === 0 ? null : parsed;
  }

  const images = clampStringArray(payload.images, 10, 2048).map((u) => safeImageUrl(u));
  if (images.length === 0) fail('At least one product image is required.');

  const categorySlug = toSlug(payload.category_slug, 'bracelets');

  const rawGender = typeof payload.gender === 'string' ? payload.gender.toLowerCase().trim() : '';
  const gender = ['men', 'women', 'unisex'].includes(rawGender) ? rawGender : 'unisex';

  const record: Record<string, unknown> = {
    title,
    slug: toSlug(payload.slug || title, `product-${Date.now()}`),
    category_slug: categorySlug,
    price,
    original_price: originalPrice,
    images,
    description: clampString(payload.description, MAX_LONG_TEXT),
    features: clampStringArray(payload.features, 20, 120),
    badge: clampString(payload.badge, 40) || null,
    is_available: toBoolean(payload.is_available, true),
    is_featured: toBoolean(payload.is_featured, false),
    rating: clampNumber(payload.rating, { min: 0, max: 5, fallback: 5 }),
    reviews_count: clampNumber(payload.reviews_count, { min: 0, max: 1_000_000, fallback: 0 }),
    gender,
    updated_at: new Date().toISOString(),
  };

  if (isUuid(payload.category_id)) record.category_id = payload.category_id;

  return { id: extractId(payload), record };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export function validateCategory(payload: any): Validated<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') fail('Invalid category payload.');

  const name = clampString(payload.name, 80);
  if (!name) fail('Category name is required.');

  return {
    id: extractId(payload),
    record: {
      name,
      slug: toSlug(payload.slug || name, 'category'),
      image_url: safeImageUrl(payload.image_url),
      display_order: clampNumber(payload.display_order, { min: 0, max: 9999, fallback: 0 }),
    },
  };
}

// ---------------------------------------------------------------------------
// Hero slides
// ---------------------------------------------------------------------------
export function validateHeroSlide(payload: any): Validated<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') fail('Invalid hero slide payload.');

  let headline = clampString(payload.headline, 200).replace(/\\n/g, '\n').trim();
  if (!headline) fail('Hero headline is required.');
  if (headline.toLowerCase() === 'small beads big stories') {
    headline = 'Small Beads\nBig Stories';
  }

  let watermark_text = clampString(payload.watermark_text, 120).replace(/\\n/g, '\n').trim();
  if (watermark_text.toLowerCase() === 'more than jewellery') {
    watermark_text = 'More than\nJewellery';
  }

  let button_text = clampString(payload.button_text, 60).trim();
  if (button_text && !button_text.endsWith('→') && !button_text.endsWith('->')) {
    button_text = `${button_text} →`;
  }

  return {
    id: extractId(payload),
    record: {
      tag: clampString(payload.tag, 80) || 'HANDCRAFTED JEWELLERY',
      headline,
      description: clampString(payload.description, 500),
      button_text: button_text || 'EXPLORE COLLECTIONS →',
      button_link: safeLink(payload.button_link, '/collections'),
      watermark_text,
      image_url: safeImageUrl(payload.image_url, '/assets/hero_banner.png'),
      display_order: clampNumber(payload.display_order, { min: 0, max: 9999, fallback: 0 }),
      is_active: toBoolean(payload.is_active, true),
    },
  };
}

// ---------------------------------------------------------------------------
// Popup offers
// ---------------------------------------------------------------------------
export function validatePopupOffer(payload: any): Validated<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') fail('Invalid offer payload.');

  const title = clampString(payload.title, 160);
  if (!title) fail('Offer title is required.');

  return {
    id: extractId(payload),
    record: {
      title,
      subtitle: clampString(payload.subtitle, 500),
      discount_code: clampString(payload.discount_code, 40),
      badge: clampString(payload.badge, 40),
      image_url: payload.image_url ? safeImageUrl(payload.image_url, '') : null,
      button_text: clampString(payload.button_text, 60),
      button_link: safeLink(payload.button_link, '/collections'),
      is_active: toBoolean(payload.is_active, false),
    },
  };
}

// ---------------------------------------------------------------------------
// Instagram posts
// ---------------------------------------------------------------------------
export function validateInstagramPost(payload: any): Validated<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') fail('Invalid Instagram post payload.');

  const rawImage = payload.image_url;
  if (!rawImage || typeof rawImage !== 'string' || !rawImage.trim()) {
    fail('Post image URL is required.');
  }
  const imageUrl = safeImageUrl(rawImage, '');
  if (!imageUrl) {
    fail('Invalid image URL.');
  }

  const rawLink = payload.post_link;
  const postLink = safeLink(rawLink, 'https://www.instagram.com/beadizo.in');

  return {
    id: extractId(payload),
    record: {
      image_url: imageUrl,
      post_link: postLink,
      caption: clampString(payload.caption, 200),
      display_order: clampNumber(payload.display_order, { min: 0, max: 9999, fallback: 0 }),
      is_active: toBoolean(payload.is_active, true),
    },
  };
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------
export function validateSiteSettings(payload: any): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') fail('Invalid settings payload.');

  const phone = clampString(payload.whatsapp_phone, 20).replace(/[^0-9]/g, '');
  if (phone && (phone.length < 10 || phone.length > 15)) {
    fail('WhatsApp number must be 10–15 digits including the country code.');
  }

  const email = clampString(payload.contact_email, 160);
  if (email && !/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i.test(email)) {
    fail('Contact email is not a valid address.');
  }

  // Only fields present in the payload are written, so a partial save
  // cannot blank out unrelated settings.
  const out: Record<string, unknown> = { id: 'general', updated_at: new Date().toISOString() };

  if (phone) out.whatsapp_phone = phone;
  if (email) out.contact_email = email;
  if ('announcement_text' in payload) out.announcement_text = clampString(payload.announcement_text, 300);
  if ('announcement_active' in payload) out.announcement_active = toBoolean(payload.announcement_active, true);
  if ('free_shipping_threshold' in payload)
    out.free_shipping_threshold = clampNumber(payload.free_shipping_threshold, { min: 0, max: 10_000_000, fallback: 999 });
  if ('editorial_headline' in payload) out.editorial_headline = clampString(payload.editorial_headline, 200);
  if ('editorial_subtext' in payload) out.editorial_subtext = clampString(payload.editorial_subtext, 500);
  if ('editorial_image_url' in payload) out.editorial_image_url = safeImageUrl(payload.editorial_image_url);
  if ('craft_headline' in payload) out.craft_headline = clampString(payload.craft_headline, 200);
  if ('craft_description' in payload) out.craft_description = clampString(payload.craft_description, 1000);
  if ('craft_image_url' in payload) out.craft_image_url = safeImageUrl(payload.craft_image_url);

  return out;
}

/** Validates a `{ id }` delete payload. */
export function validateDeleteId(payload: any): string {
  const id = payload?.id;
  if (!isUuid(id)) fail('A valid record id is required.');
  return id as string;
}

/** Validates a `{ ids: string[] }` bulk delete payload. */
export function validateDeleteIds(payload: any): string[] {
  const ids = payload?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    fail('A non-empty array of record ids is required.');
  }
  if (ids.length > 100) {
    fail('Cannot delete more than 100 records in a single batch.');
  }
  const validIds: string[] = [];
  for (const id of ids) {
    if (
      typeof id !== 'string' ||
      (!isUuid(id) && !/^(local|cat|hero|offer|insta|prod)-/.test(id) && !/^\d+$/.test(id))
    ) {
      fail(`Invalid record id: ${id}`);
    }
    validIds.push(id);
  }
  return validIds;
}


// ---------------------------------------------------------------------------
// Contact Submissions
// ---------------------------------------------------------------------------
export function validateContactSubmission(payload: any): {
  name: string;
  phone: string;
  email: string | null;
  inquiry_type: string;
  message: string;
  is_read: boolean;
} {
  if (!payload || typeof payload !== 'object') fail('Invalid contact submission payload.');

  const name = clampString(payload.name, 100);
  if (!name || name.length < 2) fail('Please provide a valid name (at least 2 characters).');

  const rawPhone = clampString(payload.phone, 25);
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (!digitsOnly || digitsOnly.length < 10 || digitsOnly.length > 15) {
    fail('Please provide a valid 10-15 digit phone number.');
  }

  let email: string | null = null;
  const rawEmail = clampString(payload.email, 160);
  if (rawEmail) {
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i.test(rawEmail)) {
      fail('Please provide a valid email address.');
    }
    email = rawEmail.toLowerCase();
  }

  const inquiryType = clampString(payload.inquiry_type, 100) || 'Custom Handcrafted Jewellery';

  const message = clampString(payload.message, 2000);
  if (!message || message.length < 5) {
    fail('Please provide a descriptive message (at least 5 characters).');
  }

  return {
    name,
    phone: rawPhone,
    email,
    inquiry_type: inquiryType,
    message,
    is_read: false,
  };
}

export function validateMarkContactRead(payload: any): { id: string; is_read: boolean } {
  if (!payload || typeof payload !== 'object') fail('Invalid payload.');
  const id = payload.id;
  if (!isUuid(id)) fail('A valid inquiry id is required.');
  const is_read = toBoolean(payload.is_read, true);
  return { id, is_read };
}
