import { CartItem } from '@/context/CartContext';

/**
 * WhatsApp order helpers.
 *
 * The order total is NOT computed here any more. `validateCartOnServer` sends
 * only product ids and quantities to /api/cart/validate, which re-reads every
 * price from Postgres and returns the message text. The browser therefore
 * cannot influence the figures the shop owner receives.
 */

export interface ValidatedCartLine {
  id: string;
  title: string;
  price: number;
  qty: number;
  img: string;
  lineTotal: number;
}

export interface ValidatedCart {
  items: ValidatedCartLine[];
  subtotal: number;
  freeShipping: boolean;
  /** Ids the catalogue no longer sells — removed from the order. */
  removed: string[];
  /** Ready-to-open wa.me deep link built from server-side prices. */
  url: string;
}

/** Defaults used before site settings load, and by static footer/contact links. */
export const WHATSAPP_PHONE = '919324556148';
export const CONTACT_EMAIL = 'shamairakhan712@gmail.com';

const FALLBACK_PHONE = WHATSAPP_PHONE;

export async function validateCartOnServer(cart: CartItem[]): Promise<ValidatedCart> {
  const res = await fetch('/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      // Deliberately send nothing but identity and quantity.
      items: cart.map((item) => ({ id: item.id, qty: item.qty })),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({} as any));
    throw new Error(data?.error || 'We could not verify your bag right now. Please try again.');
  }

  const data = await res.json();
  const phone = String(data.phone || FALLBACK_PHONE).replace(/[^0-9]/g, '') || FALLBACK_PHONE;

  return {
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: Number(data.subtotal) || 0,
    freeShipping: Boolean(data.freeShipping),
    removed: Array.isArray(data.removed) ? data.removed : [],
    url: `https://wa.me/${phone}?text=${encodeURIComponent(String(data.message || ''))}`,
  };
}

/** Generic "say hello" link used by the footer and contact page. */
export function generateGeneralWhatsAppUrl(phone?: string): string {
  const digits = String(phone || FALLBACK_PHONE).replace(/[^0-9]/g, '') || FALLBACK_PHONE;
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    'Hi Beadizo! I have a question about your handcrafted jewellery.'
  )}`;
}

/**
 * Single-product enquiry link. This is an enquiry, not an order, so the price
 * shown is only a talking point — the shop confirms the real figure on reply.
 */
export function generateWhatsAppProductUrl(productTitle: string, price: number, phone?: string): string {
  const digits = String(phone || FALLBACK_PHONE).replace(/[^0-9]/g, '') || FALLBACK_PHONE;
  const text = `Hi Beadizo! I would like to inquire about *${productTitle}* (₹${Number(price).toLocaleString(
    'en-IN'
  )}). Is it currently available for dispatch?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
