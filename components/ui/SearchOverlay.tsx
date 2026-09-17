'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { BEADIZO_PRODUCTS } from '@/data/products';

export default function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useCart();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  if (!isSearchOpen) return null;

  const filteredProducts = query.trim()
    ? BEADIZO_PRODUCTS.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div
      className="search-overlay"
      style={{ display: 'flex' }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      <div className="container-narrow" style={{ width: '100%', position: 'relative' }}>
        <button
          className="close-drawer-btn"
          onClick={closeSearch}
          aria-label="Close search"
          style={{ position: 'absolute', top: '-45px', right: '15px', color: '#fff' }}
        >
          <X size={24} />
        </button>
        <p
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#DFBDB5',
            marginBottom: '10px'
          }}
        >
          Search Beadizo
        </p>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blush bracelet, daisy necklace, anklets..."
            className="newsletter-email-input"
            style={{ width: '100%', height: '54px', fontSize: '1rem', borderRadius: '4px', paddingLeft: '44px' }}
          />
          <Search
            size={20}
            style={{ position: 'absolute', left: '16px', top: '17px', color: '#999' }}
          />
        </div>

        {/* Live Search Results */}
        {query.trim() && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              marginTop: '12px',
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            {filteredProducts.length === 0 ? (
              <p style={{ padding: '16px', textAlign: 'center', color: '#777', fontSize: '0.9rem' }}>
                No designs found matching &ldquo;{query}&rdquo;
              </p>
            ) : (
              filteredProducts.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/collections?product=${prod.id}`}
                  onClick={closeSearch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px',
                    borderBottom: '1px solid #f0f0f0',
                    color: '#1F1F24'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                    <Image src={prod.img} alt={prod.title} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', margin: 0, fontFamily: 'var(--font-serif)' }}>{prod.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#DFBDB5', margin: 0, textTransform: 'capitalize' }}>{prod.category}</p>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{prod.price}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
