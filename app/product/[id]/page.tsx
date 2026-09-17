'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Star,
  Sparkles,
  Truck,
  Phone,
  Check,
  Package,
  Clock,
  Heart,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getProductByIdOrSlug, getRelatedProducts, getSiteSettings, getCachedProduct } from '@/lib/supabase/data';
import { DbProduct, DbSiteSettings } from '@/lib/supabase/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ui/ProductCard';

interface PageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  // Handle async params in newer Next.js versions cleanly
  const resolvedParams = 'then' in params ? use(params) : params;
  const productId = resolvedParams.id;

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Instant 0ms render if already cached from catalog
  const [product, setProduct] = useState<DbProduct | null>(() => getCachedProduct(productId));
  const [relatedProducts, setRelatedProducts] = useState<DbProduct[]>([]);
  const [settings, setSettings] = useState<DbSiteSettings | null>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(() => !getCachedProduct(productId));
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [foundProduct, siteSettings] = await Promise.all([
          getProductByIdOrSlug(productId),
          getSiteSettings(),
        ]);

        if (!isMounted) return;
        setSettings(siteSettings);

        if (foundProduct) {
          setProduct(foundProduct);
          setLoading(false);
          const related = await getRelatedProducts(foundProduct, 4);
          if (isMounted) setRelatedProducts(related);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('Error loading product details', e);
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center', backgroundColor: 'var(--bg-cream)', minHeight: '60vh' }}>
        <div style={{ color: '#8C594D', fontSize: '1rem', fontWeight: 600 }}>Loading handcrafted piece...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center', backgroundColor: 'var(--bg-cream)', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#1B1B22', marginBottom: '12px' }}>
          Product Not Found
        </h2>
        <p style={{ color: '#7E7E8F', marginBottom: '24px' }}>
          The jewellery piece you are looking for may have been updated or moved.
        </p>
        <Link href="/collections" className="btn-blush" style={{ display: 'inline-flex' }}>
          EXPLORE ALL COLLECTIONS →
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : ['/assets/product_bracelet.jpg'];
  const currentImg = images[selectedImgIndex] || images[0];
  const isAvailable = product.is_available !== false;
  const wishlisted = isInWishlist(product.id);

  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  // Phone comes from the database; strip everything that is not a digit so a
  // malformed settings value cannot reshape the wa.me URL.
  const phone = (settings?.whatsapp_phone || '919324556148').replace(/[^0-9]/g, '');

  // Link to the canonical product URL rather than window.location.href, which
  // would echo back any query string or fragment an attacker put in the link.
  const productUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/product/${product.slug}` : '';

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hi Beadizo! I am interested in ordering *${product.title}* (₹${product.price.toLocaleString('en-IN')}). Is this in stock? Here is the link: ${productUrl}`
  )}`;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(
      {
        id: product.id,
        title: product.title,
        category: product.category_slug,
        price: product.price,
        originalPrice: product.original_price || product.price,
        img: images[0],
        rating: product.rating || 5.0,
        reviewsCount: product.reviews_count || 48,
        badge: product.badge || undefined,
        description: product.description || undefined,
      },
      quantity,
      true
    );
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  return (
    <div style={{ padding: '40px 0 90px', backgroundColor: 'var(--bg-cream)' }}>
      <div className="container">
        {/* Breadcrumbs */}
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
          <Link href="/collections" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Collections</Link>
          <ChevronRight size={12} />
          <Link
            href={`/collections?category=${product.category_slug}`}
            style={{ color: 'var(--text-muted)', textTransform: 'capitalize', textDecoration: 'none' }}
          >
            {product.category_slug}
          </Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{product.title}</span>
        </nav>

        {/* Product Main Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '48px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Interactive Multi-Image Gallery */}
          <div>
            <div
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#FFFFFF',
                aspectRatio: '1/1',
                boxShadow: 'var(--shadow-card)',
                marginBottom: '16px',
              }}
            >
              <img
                src={currentImg}
                alt={product.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                }}
              />

              {product.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: '#DFBDB5',
                    color: '#0A0A0C',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}
                >
                  {product.badge}
                </span>
              )}

              <button
                onClick={() =>
                  toggleWishlist({
                    id: product.id,
                    title: product.title,
                    category: product.category_slug,
                    price: product.price,
                    originalPrice: product.original_price || product.price,
                    img: images[0],
                    rating: product.rating || 5.0,
                    reviewsCount: product.reviews_count || 48,
                    badge: product.badge || undefined,
                  })
                }
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                aria-label="Wishlist"
              >
                <Heart
                  size={18}
                  fill={wishlisted ? '#E11D48' : 'none'}
                  stroke={wishlisted ? '#E11D48' : '#0A0A0C'}
                />
              </button>
            </div>

            {/* Thumbnails Row (if multiple images exist) */}
            {images.length > 1 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(images.length, 5)}, 1fr)`,
                  gap: '12px',
                }}
              >
                {images.map((src, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    style={{
                      borderRadius: '8px',
                      border: selectedImgIndex === idx ? '2px solid #DFBDB5' : '1px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      aspectRatio: '1/1',
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedImgIndex === idx ? '0 0 10px rgba(223,189,181,0.5)' : 'none',
                    }}
                  >
                    <img
                      src={src}
                      alt={`${product.title} - angle ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Commerce Flow */}
          <div
            style={{
              background: '#FFFFFF',
              padding: '36px 32px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="section-eyebrow" style={{ margin: 0 }}>
                HANDCRAFTED {product.category_slug.toUpperCase()}
              </span>

              {/* Stock Status Badge */}
              {isAvailable ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(74, 222, 128, 0.15)',
                    color: '#16A34A',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                  <span>In Stock • Ready to Dispatch</span>
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#DC2626',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={12} />
                  <span>Currently Sold Out</span>
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.1rem',
                margin: '8px 0 12px',
                color: 'var(--text-dark)',
                lineHeight: 1.2,
              }}
            >
              {product.title}
            </h1>

            {/* Reviews cluster */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span className="stars-cluster">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    fill="#D9822B"
                    stroke="#D9822B"
                    style={{ display: 'inline-block', marginRight: '2px' }}
                  />
                ))}
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {product.rating?.toFixed(1) || '5.0'} ({product.reviews_count || 48} verified reviews)
              </span>
            </div>

            {/* Price Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                marginBottom: '24px',
                padding: '16px',
                background: '#F9F7F5',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>

              {product.original_price && product.original_price > product.price && (
                <>
                  <span style={{ fontSize: '1.15rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{product.original_price.toLocaleString('en-IN')}
                  </span>
                  <span
                    style={{
                      background: 'rgba(223, 189, 181, 0.4)',
                      color: '#7B4A3E',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    SAVE {discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '26px' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7E7E8F', margin: '0 0 8px' }}>
                Description & Craftsmanship
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.75, margin: 0 }}>
                {product.description ||
                  'Delicately handcrafted using premium crystal and glass beads, layered with 18k gold-plated hypoallergenic accents. Designed for durable everyday elegance.'}
              </p>
            </div>

            {/* Features & Specs List */}
            {product.features && product.features.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '28px',
                  fontSize: '0.82rem',
                  color: 'var(--text-dark)',
                  background: 'rgba(223, 189, 181, 0.08)',
                  padding: '16px',
                  borderRadius: '8px',
                }}
              >
                {product.features.map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#8C594D" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector */}
            {isAvailable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #DFBDB5', borderRadius: '6px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ padding: '8px 14px', background: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.9rem', minWidth: '40px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    disabled={quantity >= 20}
                    style={{
                      padding: '8px 14px',
                      background: quantity >= 20 ? '#F3F4F6' : '#FFF',
                      cursor: quantity >= 20 ? 'not-allowed' : 'pointer',
                      border: 'none',
                      fontWeight: 700,
                      color: quantity >= 20 ? '#9CA3AF' : '#111827',
                    }}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                {quantity >= 20 && (
                  <span style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 500 }}>
                    Maximum 20 units per item
                  </span>
                )}
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <button
                className="btn-blush"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                type="button"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '15px',
                  fontSize: '0.88rem',
                  letterSpacing: '0.5px',
                  opacity: isAvailable ? 1 : 0.5,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                }}
              >
                {addedAnimation
                  ? '✓ ADDED TO YOUR BAG'
                  : isAvailable
                  ? `ADD TO CART — ₹${(product.price * quantity).toLocaleString('en-IN')}`
                  : 'OUT OF STOCK'}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: '#25D366',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)',
                  transition: 'background 0.2s ease',
                }}
              >
                <Phone size={18} />
                <span>Instant WhatsApp Order / DM Inquiry</span>
              </a>
            </div>

            {/* Delivery & Trust Guarantees */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#555' }}>
                <Truck size={16} color="#8C594D" />
                <span>Free shipping on all orders above ₹{settings?.free_shipping_threshold || 999}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#555' }}>
                <Package size={16} color="#8C594D" />
                <span>Delivered in luxury signature gift-ready keepsake box</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#555' }}>
                <Clock size={16} color="#8C594D" />
                <span>Dispatches within 24-48 hours with live WhatsApp tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products / Recommendations Section */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <span className="section-eyebrow">COMPLETE YOUR LOOK</span>
                <h2 className="section-main-title" style={{ marginBottom: 0 }}>
                  You May Also Adore
                </h2>
              </div>
              <Link href="/collections" style={{ color: 'var(--text-dark)', fontSize: '0.85rem', fontWeight: 600 }}>
                View Full Catalog →
              </Link>
            </div>

            <div className="bestsellers-products-grid">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
