import { MetadataRoute } from 'next';
import { getProducts, getCategories, getBlogPosts } from '@/lib/supabase/data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Refresh at most once every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beadizo.in';
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [products, categories, blogs] = await Promise.all([
      getProducts().catch(() => []),
      getCategories().catch(() => []),
      getBlogPosts().catch(() => []),
    ]);

    // Product routes
    const productRoutes: MetadataRoute.Sitemap = products
      .filter((p) => p.is_available !== false)
      .map((p) => ({
        url: `${baseUrl}/product/${encodeURIComponent(p.slug || p.id)}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.85,
      }));

    // Category collection routes
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/collections?category=${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Blog post routes
    const blogRoutes: MetadataRoute.Sitemap = blogs
      .filter((b) => b.is_published)
      .map((b) => ({
        url: `${baseUrl}/blog/${encodeURIComponent(b.slug)}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : (b.published_at ? new Date(b.published_at) : now),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
