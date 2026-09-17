'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '@/data/products';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => boolean;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
}

const STORAGE_KEY = 'beadizo_wishlist_v4';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch {
      // Local storage read error
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
      } catch {
        // Local storage write error
      }
    }
  }, [wishlist, isMounted]);

  const toggleWishlist = (product: Product): boolean => {
    const exists = wishlist.some((item) => item.id === product.id);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      return false;
    } else {
      setWishlist((prev) => [...prev, product]);
      return true;
    }
  };

  const isInWishlist = (id: string) => wishlist.some((item) => item.id === id);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
