'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import PopupOfferModal from '@/components/ui/PopupOfferModal';
import { getHeroSlides, getCategories, getProducts, getSiteSettings } from '@/lib/supabase/data';
import { DbHeroSlide, DbCategory, DbProduct, DbSiteSettings } from '@/lib/supabase/types';

export default function HomePage() {
  const [heroSlides, setHeroSlides] = useState<DbHeroSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [settings, setSettings] = useState<DbSiteSettings | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [slidesData, catsData, prodsData, settingsData] = await Promise.all([
          getHeroSlides(),
          getCategories(),
          getProducts(),
          getSiteSettings(),
        ]);
        const activeSlides = slidesData.filter((s) => s.is_active);
        setHeroSlides(activeSlides.length > 0 ? activeSlides : slidesData);
        setCategories(catsData);
        setProducts(prodsData);
        setSettings(settingsData);
      } catch (err) {
        console.error('Error loading homepage data', err);
      }
    }
    loadData();
  }, []);

  const activeSlide = heroSlides[currentSlideIndex] || {
    id: 'default',
    tag: 'HANDCRAFTED JEWELLERY',
    headline: 'Small Beads\nBig Stories',
    description: 'Thoughtfully crafted pieces, made to add a little more love to your everyday.',
    button_text: 'EXPLORE COLLECTIONS →',
    button_link: '/collections',
    watermark_text: 'More than\nJewellery',
    image_url: '/assets/hero_banner.png',
  };

  // Best sellers: featured products first, or first 4 available products
  const bestSellers = products.filter((p) => p.is_featured).length > 0
    ? products.filter((p) => p.is_featured).slice(0, 4)
    : products.slice(0, 4);

  // Format Hero text so that formatting matches Image 1 consistently
  const rawHeadline = (activeSlide.headline || 'Small Beads\nBig Stories').replace(/\\n/g, '\n').trim();
  const heroHeadlineText = rawHeadline.toLowerCase() === 'small beads big stories'
    ? 'Small Beads\nBig Stories'
    : rawHeadline;
  const headlineLines = heroHeadlineText.split('\n');

  const rawWatermark = (activeSlide.watermark_text || 'More than\nJewellery').replace(/\\n/g, '\n').trim();
  const heroWatermarkText = rawWatermark.toLowerCase() === 'more than jewellery'
    ? 'More than\nJewellery'
    : rawWatermark;
  const watermarkLines = heroWatermarkText.split('\n');

  const rawBtnText = (activeSlide.button_text || 'EXPLORE COLLECTIONS →').trim();
  const heroButtonText = rawBtnText.endsWith('→') || rawBtnText.endsWith('->')
    ? rawBtnText.replace(/->$/, '→')
    : `${rawBtnText} →`;

  return (
    <div>
      {/* Promotional Popup Modal */}
      <PopupOfferModal />

      {/* ================= 03. HERO SECTION ================= */}
      <section className="hero-wrapper" id="hero">
        <img
          src={activeSlide.image_url || '/assets/hero_banner.png'}
          alt={activeSlide.headline || 'Beadizo jewellery'}
          className="hero-bg-image"
        />
        <div className="hero-overlay-gradient" />

        <div className="container" style={{ width: '100%' }}>
          <div className="hero-inner">
            <span className="hero-tag">{activeSlide.tag || 'HANDCRAFTED JEWELLERY'}</span>
            <h1 className="hero-headline">
              {headlineLines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  {idx < headlineLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="hero-description">
              {activeSlide.description || 'Thoughtfully crafted pieces, made to add a little more love to your everyday.'}
            </p>
            <Link href={activeSlide.button_link || '/collections'} className="btn-blush">
              {heroButtonText}
            </Link>

            {/* Slide Indicators if multiple */}
            {heroSlides.length > 1 && (
              <div className="slider-indicators-row">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`slider-bar ${currentSlideIndex === idx ? 'active' : ''}`}
                    style={{ border: 'none', padding: 0, cursor: 'pointer' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {activeSlide.watermark_text && (
          <div className="hero-watermark-right">
            <span className="handwritten-watermark">
              {watermarkLines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  {idx < watermarkLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          </div>
        )}
      </section>

      {/* ================= 04. TRUST BAR (4 FEATURES) ================= */}
      <section className="trust-features-bar">
        <div className="container">
          <div className="trust-features-grid">
            <div className="trust-feature-col">
              <svg
                className="trust-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18.5" r="2.5" />
                <circle cx="7" cy="18.5" r="2.5" />
              </svg>
              <h4>Free Shipping</h4>
              <p>on all orders above ₹{settings?.free_shipping_threshold || 999}</p>
            </div>

            <div className="trust-feature-col">
              <svg
                className="trust-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h12l4 6-10 13L2 9Z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
                <path d="M2 9h20" />
              </svg>
              <h4>Premium Quality</h4>
              <p>Carefully crafted beads</p>
            </div>

            <div className="trust-feature-col">
              <svg
                className="trust-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <h4>Handmade with Love</h4>
              <p>Unique &amp; artisanal designs</p>
            </div>

            <div className="trust-feature-col">
              <svg
                className="trust-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
              </svg>
              <h4>Beautiful Packaging</h4>
              <p>Perfect for gifting</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 05. SHOP BY CATEGORY ================= */}
      <section className="category-section-wrap" id="categories">
        <div className="container">
          <span className="section-eyebrow">SHOP BY CATEGORY</span>
          <h2 className="section-main-title">Find Your Perfect Piece</h2>
          <p className="section-subtext">
            Explore our handcrafted collections, designed for every mood and moment.
          </p>

          <div className="category-cards-grid">
            {categories.map((cat) => (
              <Link
                key={cat.id || cat.slug}
                href={`/collections?category=${cat.slug}`}
                className="aesthetic-cat-card"
              >
                <div className="cat-card-thumb">
                  <img src={cat.image_url || '/assets/product_bracelet.jpg'} alt={cat.name} loading="lazy" />
                </div>
                <div className="cat-card-footer">
                  <span>{cat.name} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 06. EDITORIAL BANNER ================= */}
      <section className="editorial-banner-section">
        <img
          src={settings?.editorial_image_url || '/assets/jewellery_feels_like_you.png'}
          alt="Jewellery That Feels Like You - Beadizo"
          className="editorial-bg-img"
          loading="lazy"
        />
        <div className="editorial-banner-overlay" />

        <div className="container" style={{ width: '100%' }}>
          <div className="editorial-text-panel">
            <div className="editorial-doodle">
              Little
              <br />
              Beads
              <br />
              Big Stories
            </div>
            <h2>
              {settings?.editorial_headline || 'Jewellery\nThat Feels Like You'}
            </h2>
            <p>{settings?.editorial_subtext || 'Minimal, meaningful and made to be a part of your everyday moments.'}</p>
            <Link href="/about" className="btn-blush">
              OUR STORY →
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 07. BEST SELLERS ================= */}
      <section className="bestsellers-section-wrap" id="bestsellers">
        <div className="container">
          <div className="bestsellers-header-row">
            <div>
              <span className="section-eyebrow">BEST SELLERS</span>
              <h2 className="section-main-title" style={{ marginBottom: 0 }}>
                Loved by Many
              </h2>
            </div>
            <Link
              href="/collections"
              style={{
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All →
            </Link>
          </div>

          <div className="bestsellers-products-grid">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= 08. CRAFT BANNER ================= */}
      <section className="craft-banner-section">
        <img
          src={settings?.craft_image_url || '/assets/more_than_jewellery.png'}
          alt="Artisan handcrafting Beadizo jewellery"
          className="craft-bg-img"
          loading="lazy"
        />
        <div className="craft-banner-overlay" />

        <div className="container" style={{ width: '100%' }}>
          <div className="craft-content-panel">
            <span className="section-eyebrow" style={{ color: '#DFBDB5' }}>
              HANDCRAFTED WITH LOVE
            </span>
            <h2>{settings?.craft_headline || 'More Than Jewellery'}</h2>
            <p>
              {settings?.craft_description ||
                'Every bead tells a story – of tradition, craftsmanship and the little moments that make life beautiful.'}
            </p>
            <Link href="/about" className="btn-blush">
              OUR STORY →
            </Link>
          </div>
        </div>

        <div className="craft-watermark-right">
          <span>
            Made
            <br />
            with
            <br />
            Love
          </span>
        </div>
      </section>

      {/* ================= 09. TESTIMONIALS ================= */}
      <section className="testimonials-section" id="reviews">
        <div className="container">
          <span className="section-eyebrow">WHAT OUR CUSTOMERS SAY</span>
          <h2 className="section-main-title">Real Stories, Real Love</h2>

          <div className="testimonials-cards-grid">
            <div className="testimonial-card-item">
              <div className="testimonial-stars" aria-label="5 stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="#D9822B"
                    stroke="#D9822B"
                    style={{ display: 'inline-block' }}
                  />
                ))}
              </div>
              <p className="testimonial-quote">
                &ldquo;Absolutely loved the quality! The bracelet looks even more beautiful in
                person.&rdquo;
              </p>
              <span className="testimonial-author-name">— Riya S.</span>
            </div>

            <div className="testimonial-card-item">
              <div className="testimonial-stars" aria-label="5 stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="#D9822B"
                    stroke="#D9822B"
                    style={{ display: 'inline-block' }}
                  />
                ))}
              </div>
              <p className="testimonial-quote">
                &ldquo;Such elegant designs and amazing packaging. Perfect for gifting!&rdquo;
              </p>
              <span className="testimonial-author-name">— Ananya M.</span>
            </div>

            <div className="testimonial-card-item">
              <div className="testimonial-stars" aria-label="5 stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="#D9822B"
                    stroke="#D9822B"
                    style={{ display: 'inline-block' }}
                  />
                ))}
              </div>
              <p className="testimonial-quote">
                &ldquo;Minimal, classy and so unique. Beadizo has become my favourite jewellery
                brand!&rdquo;
              </p>
              <span className="testimonial-author-name">— Kriti P.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 10. INSTAGRAM GRID ================= */}
      <section className="instagram-strip-section" id="instagram">
        <div className="container">
          <span className="section-eyebrow">FOLLOW US @BEADIZO</span>
          <h2 className="section-main-title" style={{ fontSize: '1.6rem' }}>
            Be a part of our beautiful journey
          </h2>

          <div className="insta-strip-grid">
            <div className="insta-tile">
              <img
                src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=600&q=80"
                alt="Beadizo lookbook 1"
                loading="lazy"
              />
            </div>
            <div className="insta-tile">
              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"
                alt="Beadizo lookbook 2"
                loading="lazy"
              />
            </div>
            <div className="insta-tile">
              <img
                src="https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80"
                alt="Beadizo lookbook 3"
                loading="lazy"
              />
            </div>
            <div className="insta-tile">
              <img
                src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80"
                alt="Beadizo lookbook 4"
                loading="lazy"
              />
            </div>
            <div className="insta-tile">
              <img
                src="https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=600&q=80"
                alt="Beadizo lookbook 5"
                loading="lazy"
              />
            </div>
            <div className="insta-tile">
              <img
                src="https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=600&q=80"
                alt="Beadizo lookbook 6"
                loading="lazy"
              />
            </div>
            <div className="insta-tile">
              <img
                src="https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&w=600&q=80"
                alt="Beadizo lookbook 7"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= 11. NEWSLETTER ================= */}
      <section className="newsletter-strip-section">
        <div className="container">
          <div className="newsletter-flex-wrap">
            <div className="newsletter-left">
              <h3>Join Our Beadizo Family</h3>
              <p>Get exclusive updates, new arrivals and special offers.</p>
            </div>

            <form
              className="newsletter-center-form"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you for subscribing to Beadizo!');
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-email-input"
                required
                aria-label="Email address"
              />
              <button type="submit" className="btn-blush">
                SUBSCRIBE
              </button>
            </form>

            <div className="newsletter-doodle-right">
              <span>
                Good
                <br />
                Things
                <br />
                Take Time
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
