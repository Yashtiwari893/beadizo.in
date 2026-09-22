import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts } from '@/lib/supabase/data';
import { BookOpen, Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'The Beadizo Journal — Handcrafted Jewellery Stories & Styling Guides',
  description:
    'Explore artisan stories, mindful gemstone meanings, and everyday jewellery styling tips from Beadizo. Discover why small beads create the biggest stories.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'The Beadizo Journal — Handcrafted Jewellery Stories',
    description: 'Explore artisan stories, mindful gemstone meanings, and everyday jewellery styling tips from Beadizo.',
    url: 'https://beadizo.in/blog',
    siteName: 'Beadizo',
    locale: 'en_IN',
    type: 'website',
  },
};

export const revalidate = 60; // ISR cache refresh every minute

export default async function BlogIndexPage() {
  const allPosts = await getBlogPosts();
  const publishedPosts = allPosts.filter((p) => p.is_published);
  const featuredPost = publishedPosts[0];
  const remainingPosts = publishedPosts.slice(1);

  return (
    <div style={{ backgroundColor: 'var(--bg-cream)', minHeight: '100vh', padding: '40px 0 90px' }}>
      <div className="container">
        {/* Header Banner */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              backgroundColor: 'rgba(140, 89, 77, 0.08)',
              borderRadius: '100px',
              color: 'var(--accent-terracotta)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <BookOpen size={14} />
            <span>The Beadizo Journal</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              color: 'var(--text-dark)',
              lineHeight: 1.2,
              marginBottom: '14px',
            }}
          >
            Little Beads, Big Stories
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Explore handcrafted jewellery styling guides, mindful gemstone meanings, and the thoughtful artistry behind each artisan piece.
          </p>
        </div>

        {/* Featured Post Card */}
        {featuredPost && (
          <div
            style={{
              marginBottom: '54px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(140, 89, 77, 0.1)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                alignItems: 'center',
              }}
            >
              <div style={{ position: 'relative', minHeight: '340px', height: '100%', overflow: 'hidden' }}>
                <img
                  src={featuredPost.cover_image}
                  alt={featuredPost.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '18px',
                    left: '18px',
                    backgroundColor: 'var(--accent-terracotta)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '4px 12px',
                    borderRadius: '4px',
                  }}
                >
                  Featured Story
                </span>
              </div>

              <div style={{ padding: '36px 32px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />
                    {new Date(featuredPost.published_at || featuredPost.created_at || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} />
                    {featuredPost.read_time || '4 min read'}
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                    color: 'var(--text-dark)',
                    lineHeight: 1.3,
                    marginBottom: '14px',
                  }}
                >
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {featuredPost.title}
                  </Link>
                </h2>

                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.65,
                    marginBottom: '22px',
                  }}
                >
                  {featuredPost.excerpt}
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {featuredPost.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.72rem',
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

                <Link
                  href={`/blog/${featuredPost.slug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--accent-terracotta)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span>READ FULL STORY</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stories Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px',
          }}
        >
          {remainingPosts.map((post) => (
            <article
              key={post.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <Link
                href={`/blog/${post.slug}`}
                style={{
                  display: 'block',
                  position: 'relative',
                  height: '210px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={post.cover_image}
                  alt={post.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Link>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    {new Date(post.published_at || post.created_at || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {post.read_time || '4 min'}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--text-dark)',
                    lineHeight: 1.35,
                    marginBottom: '10px',
                  }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {post.title}
                  </Link>
                </h3>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    marginBottom: '18px',
                    flex: 1,
                  }}
                >
                  {post.excerpt}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          backgroundColor: 'rgba(0,0,0,0.04)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--accent-terracotta)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
