'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Product } from '@/data/products';
import { DbProduct } from '@/lib/supabase/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductCardProps {
  product: Product | DbProduct | any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  // Normalize fields between DbProduct and static Product
  const imageSrc = product.images && product.images.length > 0 
    ? product.images[0] 
    : (product.img || '/assets/product_bracelet.jpg');
    
  const originalPrice = product.original_price ?? product.originalPrice ?? null;
  const reviewsCount = product.reviews_count ?? product.reviewsCount ?? 48;
  const isAvailable = product.is_available !== false;
  const badge = product.badge;

  // Normalized cart product object
  const cartItem: Product = {
    id: product.id,
    title: product.title,
    category: product.category_slug || product.category || 'all',
    price: product.price,
    originalPrice: originalPrice || product.price,
    img: imageSrc,
    rating: product.rating || 5.0,
    reviewsCount: reviewsCount,
    badge: badge,
    description: product.description || '',
  };

  return (
    <div className="bestseller-item-card">
      <div className="card-img-wrap" style={{ position: 'relative' }}>
        <Link href={`/product/${product.slug || product.id}`} prefetch={true} style={{ display: 'block', width: '100%', height: '100%' }}>
          <img
            src={imageSrc}
            alt={product.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Link>

        {/* Badge */}
        {badge && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: '#DFBDB5',
              color: '#0A0A0C',
              padding: '3px 8px',
              fontSize: '0.65rem',
              fontWeight: 700,
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              zIndex: 2,
            }}
          >
            {badge}
          </span>
        )}

        {/* Out of Stock overlay if unavailable */}
        {!isAvailable && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <span
              style={{
                background: '#0A0A0C',
                color: '#EF4444',
                padding: '4px 10px',
                fontSize: '0.7rem',
                fontWeight: 700,
                border: '1px solid #EF4444',
                borderRadius: '4px',
                letterSpacing: '1px',
              }}
            >
              SOLD OUT
            </span>
          </div>
        )}

        <button
          className={`card-wishlist-circle ${wishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(cartItem);
          }}
          aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          type="button"
        >
          <Heart
            size={15}
            fill={wishlisted ? '#E11D48' : 'none'}
            stroke={wishlisted ? '#E11D48' : 'currentColor'}
          />
        </button>
      </div>

      <div className="card-body-content">
        <Link href={`/product/${product.slug || product.id}`} prefetch={true} style={{ color: 'inherit', textDecoration: 'none' }}>
          <h3 className="card-title-text">{product.title}</h3>
        </Link>

        <div className="card-stars-row">
          <span className="stars-cluster">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                fill="#D9822B"
                stroke="#D9822B"
                style={{ display: 'inline-block', marginRight: '1px' }}
              />
            ))}
          </span>
          <span>({reviewsCount})</span>
        </div>

        <div className="card-price-text">
          ₹{product.price}
          {originalPrice && originalPrice > product.price && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '6px' }}>
              ₹{originalPrice}
            </span>
          )}
        </div>

        <button
          className="card-add-button"
          onClick={() => isAvailable && addToCart(cartItem, 1, true)}
          disabled={!isAvailable}
          type="button"
          style={{
            opacity: isAvailable ? 1 : 0.5,
            cursor: isAvailable ? 'pointer' : 'not-allowed',
          }}
        >
          {isAvailable ? 'ADD TO CART' : 'OUT OF STOCK'}
        </button>
      </div>
    </div>
  );
}
