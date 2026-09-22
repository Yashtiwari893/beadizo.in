import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, getBlogPosts, getProducts } from '@/lib/supabase/data';
import { Calendar, Clock, ArrowLeft, Share2, Sparkles, ChevronRight, Check } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';

interface Props {
  params: { slug: string } | Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = 'then' in params ? await params : params;
  const post = await getBlogPostBySlug(resolved.slug);

  if (!post) {
    return {
      title: 'Article Not Found | Beadizo',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beadizo.in';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const cover = post.cover_image.startsWith('http') ? post.cover_image : `${siteUrl}${post.cover_image}`;

  return {
    title: post.meta_title || `${post.title} | Beadizo Journal`,
    description: post.meta_description || post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: postUrl,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      authors: ['Beadizo'],
      images: [
        {
          url: cover,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [cover],
    },
  };
}

export const revalidate = 60;

export default async function BlogPostDetailPage({ params }: Props) {
  const resolved = 'then' in params ? await params : params;
  const post = await getBlogPostBySlug(resolved.slug);

  if (!post) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beadizo.in';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const coverUrl = post.cover_image.startsWith('http') ? post.cover_image : `${siteUrl}${post.cover_image}`;

  const [allPosts, allProducts] = await Promise.all([
    getBlogPosts(),
    getProducts(),
  ]);

  const relatedPosts = allPosts.filter((p) => p.id !== post.id && p.is_published).slice(0, 2);
  const featuredProducts = allProducts.filter((p) => p.is_available !== false).slice(0, 3);

  // Schema.org BlogPosting
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    headline: post.title,
    description: post.excerpt,
    image: [coverUrl],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: 'Beadizo',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Beadizo',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Journal',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <article style={{ backgroundColor: 'var(--bg-cream)', minHeight: '100vh', padding: '36px 0 90px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Navigation Breadcrumb */}
        <nav
          style={{
            marginBottom: '28px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <ChevronRight size={12} />
          <Link href="/blog" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Journal</Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{post.title}</span>
        </nav>

        {/* Back Link */}
        <Link
          href="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent-terracotta)',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
            marginBottom: '20px',
          }}
        >
          <ArrowLeft size={16} />
          <span>BACK TO ALL STORIES</span>
        </Link>

        {/* Article Header */}
        <header style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-terracotta)',
                  backgroundColor: 'rgba(140, 89, 77, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  fontWeight: 600,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
              color: 'var(--text-dark)',
              lineHeight: 1.25,
              marginBottom: '18px',
            }}
          >
            {post.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              paddingBottom: '20px',
            }}
          >
            <span>By Beadizo Studio</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} />
              {new Date(post.published_at || post.created_at || '').toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} />
              {post.read_time || '5 min read'}
            </span>
          </div>
        </header>

        {/* Cover Photo */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(260px, 45vw, 440px)',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '40px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
          }}
        >
          <img
            src={post.cover_image}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Article Body Content */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: ' clamp(24px, 5vw, 44px)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            marginBottom: '48px',
          }}
        >
          {/* Excerpt Lead */}
          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--accent-terracotta)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              marginBottom: '28px',
              borderLeft: '3px solid var(--accent-terracotta)',
              paddingLeft: '18px',
            }}
          >
            &ldquo;{post.excerpt}&rdquo;
          </p>

          {/* Formatted Markdown/Paragraph Rendering */}
          <div
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: 'var(--text-dark)',
            }}
          >
            {post.content.split('\n\n').map((block, idx) => {
              const trimmed = block.trim();
              if (trimmed.startsWith('### ')) {
                return (
                  <h3
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.45rem',
                      color: 'var(--text-dark)',
                      margin: '32px 0 12px',
                    }}
                  >
                    {trimmed.replace(/^###\s*/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.7rem',
                      color: 'var(--text-dark)',
                      margin: '36px 0 14px',
                    }}
                  >
                    {trimmed.replace(/^##\s*/, '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('- ')) {
                const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- '));
                return (
                  <ul key={idx} style={{ paddingLeft: '22px', margin: '14px 0 20px' }}>
                    {items.map((item, itemIdx) => (
                      <li key={itemIdx} style={{ marginBottom: '8px' }}>
                        {item.replace(/^-\s*/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} style={{ marginBottom: '18px' }}>
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* CTA Box */}
          <div
            style={{
              marginTop: '40px',
              padding: '24px',
              backgroundColor: 'rgba(140, 89, 77, 0.06)',
              borderRadius: '12px',
              border: '1px dashed var(--accent-terracotta)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-terracotta)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
              <Sparkles size={16} />
              <span>EXPLORE THE COLLECTION</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Handcrafted in small batches with genuine crystals, polished stones, and enduring passion.
            </p>
            <Link href="/collections" className="btn-blush" style={{ display: 'inline-flex' }}>
              SHOP HANDCRAFTED JEWELLERY →
            </Link>
          </div>
        </div>

        {/* Featured Products recommendation */}
        {featuredProducts.length > 0 && (
          <section style={{ marginBottom: '54px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                color: 'var(--text-dark)',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              Pieces You May Love
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
              }}
            >
              {featuredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        {/* Related Stories */}
        {relatedPosts.length > 0 && (
          <section>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                color: 'var(--text-dark)',
                marginBottom: '18px',
              }}
            >
              More Stories from the Journal
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: 700 }}>
                    {rel.read_time || '4 min read'}
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', margin: '8px 0', color: 'var(--text-dark)' }}>
                    <Link href={`/blog/${rel.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {rel.title}
                    </Link>
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    {rel.excerpt}
                  </p>
                  <Link href={`/blog/${rel.slug}`} style={{ color: 'var(--accent-terracotta)', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
                    Read Article →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
