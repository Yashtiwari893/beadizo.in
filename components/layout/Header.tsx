'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { cartCount, openCart, openSearch } = useCart();

  const isCollections = pathname === '/collections';
  const currentGender = (isCollections ? searchParams.get('gender') : null)?.toLowerCase();

  const isHomeActive = pathname === '/';
  const isShopActive = isCollections && (!currentGender || currentGender === 'all');
  const isWomenActive = isCollections && currentGender === 'women';
  const isMenActive = isCollections && currentGender === 'men';
  const isAboutActive = pathname === '/about';
  const isContactActive = pathname === '/contact';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 25) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
    document.body.style.overflow = '';
  }, [pathname, searchParams]);

  const toggleMobileNav = () => {
    const nextState = !isMobileNavOpen;
    setIsMobileNavOpen(nextState);
    document.body.style.overflow = nextState ? 'hidden' : '';
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMobileNavOpen(false);
    document.body.style.overflow = '';

    if (pathname === '/collections' && href.startsWith('/collections')) {
      e.preventDefault();
      try {
        const dummyUrl = new URL(href, window.location.origin);
        const gender = dummyUrl.searchParams.get('gender') || 'all';
        const category = dummyUrl.searchParams.get('category') || 'all';
        window.history.replaceState(null, '', href);
        window.dispatchEvent(new CustomEvent('collections-filter-change', { detail: { gender, category } }));
      } catch {
        // Fallback
      }
    }
  };

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''}`} role="banner">
      <div className="container header-grid">
        {/* Mobile Toggle */}
        <button
          className={`hamburger-btn ${isMobileNavOpen ? 'active' : ''}`}
          onClick={toggleMobileNav}
          aria-label="Toggle Navigation Menu"
          aria-expanded={isMobileNavOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Left: Navigation Links */}
        <nav
          className={`header-nav ${isMobileNavOpen ? 'nav-open' : ''}`}
          role="navigation"
          aria-label="Primary Navigation"
        >
          <Link href="/" prefetch={true} onClick={(e) => handleNavClick(e, '/')} className={isHomeActive ? 'active' : ''}>
            Home
          </Link>
          <Link href="/collections" prefetch={true} onClick={(e) => handleNavClick(e, '/collections')} className={isShopActive ? 'active' : ''}>
            Shop
          </Link>
          <Link href="/collections?gender=women" prefetch={true} onClick={(e) => handleNavClick(e, '/collections?gender=women')} className={isWomenActive ? 'active' : ''}>
            Women
          </Link>
          <Link href="/collections?gender=men" prefetch={true} onClick={(e) => handleNavClick(e, '/collections?gender=men')} className={isMenActive ? 'active' : ''}>
            Men
          </Link>
          <Link href="/about" prefetch={true} onClick={(e) => handleNavClick(e, '/about')} className={isAboutActive ? 'active' : ''}>
            About
          </Link>
          <Link href="/contact" prefetch={true} onClick={(e) => handleNavClick(e, '/contact')} className={isContactActive ? 'active' : ''}>
            Contact
          </Link>
        </nav>

        {/* Center: Logo */}
        <div className="logo-center">
          <Link href="/" aria-label="Beadizo Home">
            <Image
              src="/logo.png"
              alt="BEADIZO — Crafted With Love"
              width={160}
              height={50}
              priority
              className="brand-logo-img"
              style={{ objectFit: 'contain', width: 'auto', height: '42px' }}
            />
          </Link>
        </div>

        {/* Right: Action Cluster */}
        <div className="header-actions-right">
          <button
            className="header-action-item"
            onClick={openSearch}
            aria-label="Search"
            type="button"
          >
            <Search size={19} className="lucide-icon" />
            <span>Search</span>
          </button>

          <button
            className="header-action-item"
            onClick={openCart}
            aria-label="Shopping Cart"
            type="button"
          >
            <ShoppingBag size={19} className="lucide-icon" />
            <span>Cart</span>
            <span className="cart-counter-pill">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
