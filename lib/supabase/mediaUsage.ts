import { getAdminClient } from '@/lib/supabase/admin';

export interface MediaUsageItem {
  type: 'product' | 'category' | 'hero' | 'offer' | 'instagram' | 'settings';
  title: string;
  location: string;
}

export async function findMediaUsages(url: string): Promise<MediaUsageItem[]> {
  const supabase = getAdminClient();
  const usages: MediaUsageItem[] = [];

  const [
    productsRes,
    categoriesRes,
    heroRes,
    offersRes,
    instagramRes,
    settingsRes,
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, slug')
      .contains('images', [url])
      .limit(10),
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('image_url', url)
      .limit(10),
    supabase
      .from('hero_slides')
      .select('id, headline')
      .eq('image_url', url)
      .limit(10),
    supabase
      .from('popup_offers')
      .select('id, title')
      .eq('image_url', url)
      .limit(10),
    supabase
      .from('instagram_posts')
      .select('id, caption')
      .eq('image_url', url)
      .limit(10),
    supabase
      .from('site_settings')
      .select('id, editorial_image_url, craft_image_url')
      .or(`editorial_image_url.eq.${url},craft_image_url.eq.${url}`)
      .limit(2),
  ]);

  if (productsRes.data && productsRes.data.length > 0) {
    productsRes.data.forEach((p) => {
      usages.push({
        type: 'product',
        title: p.title || p.slug || 'Untitled Product',
        location: 'Product Catalog',
      });
    });
  }

  if (categoriesRes.data && categoriesRes.data.length > 0) {
    categoriesRes.data.forEach((c) => {
      usages.push({
        type: 'category',
        title: c.name || c.slug || 'Untitled Category',
        location: 'Category Thumbnail',
      });
    });
  }

  if (heroRes.data && heroRes.data.length > 0) {
    heroRes.data.forEach((h) => {
      usages.push({
        type: 'hero',
        title: h.headline || 'Hero Slide',
        location: 'Hero Banner Slide',
      });
    });
  }

  if (offersRes.data && offersRes.data.length > 0) {
    offersRes.data.forEach((o) => {
      usages.push({
        type: 'offer',
        title: o.title || 'Special Offer',
        location: 'Promotional Popup Offer',
      });
    });
  }

  if (instagramRes.data && instagramRes.data.length > 0) {
    instagramRes.data.forEach((i) => {
      usages.push({
        type: 'instagram',
        title: i.caption || 'Instagram Post',
        location: 'Instagram Showcase Feed',
      });
    });
  }

  if (settingsRes.data && settingsRes.data.length > 0) {
    settingsRes.data.forEach((s) => {
      if (s.editorial_image_url === url) {
        usages.push({
          type: 'settings',
          title: 'Editorial Section Photo',
          location: 'Site Settings (Editorial Story)',
        });
      }
      if (s.craft_image_url === url) {
        usages.push({
          type: 'settings',
          title: 'Craftsmanship Story Photo',
          location: 'Site Settings (Craft Story)',
        });
      }
    });
  }

  return usages;
}
