'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Gem, Heart, Sparkles, Gift, Loader2, RotateCcw } from 'lucide-react';
import { getProducts, getCategories } from '@/lib/supabase/data';
import { DbProduct, DbCategory } from '@/lib/supabase/types';
import ProductCard from '@/components/ui/ProductCard';

function CollectionsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const genderParam = searchParams.get('gender') || 'all';

  // Initialize state directly from URL query parameters so first paint is correct
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [activeGender, setActiveGender] = useState<string>(genderParam);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state whenever URL searchParams change (navigation or browser back/forward)
  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'all');
    setActiveGender(searchParams.get('gender') || 'all');
  }, [searchParams]);

  // Listen for instant filter changes from Header or back/forward
  useEffect(() => {
    const handleFilterEvent = (e: any) => {
      if (e.detail) {
        if (e.detail.category !== undefined) setActiveCategory(e.detail.category || 'all');
        if (e.detail.gender !== undefined) setActiveGender(e.detail.gender || 'all');
      }
    };
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      setActiveCategory(sp.get('category') || 'all');
      setActiveGender(sp.get('gender') || 'all');
    };
    window.addEventListener('collections-filter-change', handleFilterEvent);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('collections-filter-change', handleFilterEvent);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [prodsData, catsData] = await Promise.all([getProducts(), getCategories()]);
        if (isMounted) {
          setProducts(prodsData);
          setCategories(catsData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching collections data', err);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateFilters = (newCategory: string, newGender: string) => {
    const nextCat = newCategory || 'all';
    const nextGender = newGender || 'all';
    // 0ms instant UI update
    setActiveCategory(nextCat);
    setActiveGender(nextGender);

    const params = new URLSearchParams();
    if (nextCat !== 'all') {
      params.set('category', nextCat);
    }
    if (nextGender !== 'all') {
      params.set('gender', nextGender);
    }
    const query = params.toString();
    const newUrl = query ? `/collections?${query}` : '/collections';
    // Instant URL update without slow RSC server roundtrips
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCategory =
      activeCategory === 'all' || (p.category_slug || '').toLowerCase() === activeCategory.toLowerCase();
    const matchesGender =
      activeGender === 'all' || (p.gender || 'unisex').toLowerCase() === activeGender.toLowerCase();
    return matchesCategory && matchesGender;
  });

  const sortedProducts = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'featured') return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    return 0;
  });

  return (
    <div>
      {/* ================= 03. COLLECTIONS HERO BANNER ================= */}
      <section className="col-hero-section">
        <img
          src="/assets/col_hero_banner.png"
          alt="Every Bead Tells a Story - Beadizo Collections"
          className="col-hero-bg-img"
          loading="lazy"
        />
        <div className="col-hero-overlay" />

        <div className="container" style={{ width: '100%' }}>
          <div className="col-hero-content">
            <span className="section-eyebrow">OUR COLLECTIONS</span>
            <h1>
              Every Bead
              <br />
              Tells a Story
            </h1>
            <p>
              Explore our handcrafted collections, designed to add a little more love to your everyday.
            </p>
            <a href="#products-catalog" className="btn-blush">
              SHOP ALL COLLECTIONS →
            </a>
          </div>
        </div>

        <div className="col-hero-watermark">
          <span>
            Little
            <br />
            Beads
            <br />
            Big Stories
          </span>
        </div>
      </section>

      {/* ================= 04. PRIMARY CATEGORY CIRCLES FILTER ================= */}
      <section className="category-circles-section">
        <div className="container">
          <div className="category-circles-grid">
            {categories.map((cat) => {
              const count = products.filter((p) => (p.category_slug || '').toLowerCase() === cat.slug.toLowerCase()).length;
              const isSelected = activeCategory.toLowerCase() === cat.slug.toLowerCase();
              return (
                <button
                  key={cat.id || cat.slug}
                  onClick={() => updateFilters(isSelected ? 'all' : cat.slug, activeGender)}
                  className={`category-circle-item ${isSelected ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                  title={isSelected ? `Deselect ${cat.name}` : `Filter by ${cat.name}`}
                >
                  <div className="circle-img-wrap">
                    <img src={cat.image_url || '/assets/product_bracelet.jpg'} alt={cat.name} loading="lazy" />
                  </div>
                  <span className="circle-title">{cat.name}</span>
                  <span className="circle-count">
                    {loading ? '...' : `(${count} Designs)`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 05. AUDIENCE FILTER & PRODUCT CATALOG ================= */}
      <section id="products-catalog" style={{ paddingBottom: '60px' }}>
        <div className="container">
          <div className="filter-sort-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', paddingTop: '16px' }}>
            {/* Left: Audience / Gender Segmented Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginRight: '4px',
                }}
              >
                Shop By:
              </span>
              {[
                { id: 'all', label: 'All' },
                { id: 'women', label: 'Women' },
                { id: 'men', label: 'Men' },
                { id: 'unisex', label: 'Unisex' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => updateFilters(activeCategory, g.id)}
                  className={`filter-btn-pill ${activeGender === g.id ? 'active filter-btn-primary' : ''}`}
                  style={{
                    fontSize: '0.82rem',
                    padding: '7px 16px',
                  }}
                >
                  {g.label}
                </button>
              ))}

              {(activeCategory !== 'all' || activeGender !== 'all') && (
                <button
                  type="button"
                  onClick={() => updateFilters('all', 'all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#72727D',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    marginLeft: '4px',
                  }}
                >
                  <RotateCcw size={12} /> Reset filters
                </button>
              )}
            </div>

            {/* Right: Sort Dropdown & Product Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-low' | 'price-high')}
                className="filter-btn-pill"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <span className="filter-right-count">
                Showing {sortedProducts.length} of {products.length} designs
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#7E7E8F', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={20} className="lucide-spin" />
              <span>Loading jewellery designs...</span>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1rem', color: '#EDEDED', marginBottom: '8px' }}>
                No jewellery pieces found matching your selected filters.
              </p>
              <p style={{ fontSize: '0.85rem', color: '#7E7E8F', marginBottom: '18px' }}>
                Try choosing another category or audience, or reset all filters.
              </p>
              <button
                type="button"
                onClick={() => updateFilters('all', 'all')}
                className="btn-blush btn-blush-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} /> View All Collections
              </button>
            </div>
          ) : (
            <div className="bestsellers-products-grid">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= 06. MID-PAGE HANDCRAFTED BANNER ================= */}
      <section className="container">
        <div className="mid-crafted-banner">
          <div className="mid-crafted-grid">
            <img
              src="/assets/col_banner_left.jpg"
              alt="Handcrafted with hand - Beadizo"
              className="mid-banner-img"
            />

            <div className="mid-crafted-content">
              <h3>
                Handcrafted
                <br />
                With Love
              </h3>
              <p>Because you deserve something special.</p>
              <Link href="/about" className="btn-blush btn-blush-sm">
                EXPLORE NOW →
              </Link>
            </div>

            <div className="mid-crafted-features">
              <div className="mid-feature-row">
                <Gem size={18} />
                <span>Premium Quality</span>
              </div>
              <div className="mid-feature-row">
                <Heart size={18} />
                <span>Skin Friendly</span>
              </div>
              <div className="mid-feature-row">
                <Sparkles size={18} />
                <span>Unique Designs</span>
              </div>
              <div className="mid-feature-row">
                <Gift size={18} />
                <span>Perfect for Gifting</span>
              </div>
            </div>

            <div className="mid-banner-visual-right">
              <img
                src="/assets/col_banner_right.jpg"
                alt="More than jewellery - Beadizo"
                className="mid-banner-img"
              />
              <span className="handwritten-watermark">
                More
                <br />
                than
                <br />
                Jewellery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 07. NEWSLETTER BANNER ================= */}
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

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading collections...</div>}>
      <CollectionsContent />
    </Suspense>
  );
}
