'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '@/data/products';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
  img: string;
}

export const MAX_QTY_PER_ITEM = 20;

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product | { id: string; title: string; price: number; img?: string }, qty?: number, openDrawer?: boolean) => void;
  removeFromCart: (index: number) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  cartWarning: string | null;
  clearCartWarning: () => void;
  maxQtyPerItem: number;
  /** Overwrites a line's price/title with server-verified values. */
  syncItemPrice: (id: string, price: number, title?: string) => void;
}

const STORAGE_KEY = 'beadizo_cart_v4';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartWarning, setCartWarning] = useState<string | null>(null);

  const showWarning = (msg: string) => {
    setCartWarning(msg);
    setTimeout(() => {
      setCartWarning((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const clearCartWarning = () => setCartWarning(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // localStorage is user-editable, so the restored value is treated as
        // untrusted input: anything malformed is discarded rather than
        // rendered. Prices here are display-only and are re-verified by
        // /api/cart/validate before an order is ever sent.
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(
            parsed
              .filter(
                (item: any) =>
                  item &&
                  typeof item.id === 'string' &&
                  item.id.length > 0 &&
                  item.id.length <= 80 &&
                  typeof item.title === 'string'
              )
              .slice(0, 50)
              .map((item: any) => ({
                id: item.id,
                title: String(item.title).slice(0, 160),
                price: Math.max(0, Number(item.price) || 0),
                qty: Math.min(Math.max(1, Math.floor(Number(item.qty) || 1)), MAX_QTY_PER_ITEM),
                img: typeof item.img === 'string' && /^(https:\/\/|\/)/.test(item.img)
                  ? item.img
                  : '/assets/product_bracelet.jpg',
              }))
          );
        }
      }
    } catch {
      // Corrupt payload — start with an empty bag rather than crashing.
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      } catch {
        // LocalStorage write error handled safely
      }
    }
  }, [cart, isMounted]);

  const addToCart = (product: Product | { id: string; title: string; price: number; img?: string }, qty = 1, openDrawer = true) => {
    const validQty = Math.max(1, Number(qty) || 1);
    let warningMsg = '';

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const potentialQty = existing.qty + validQty;
        if (potentialQty > MAX_QTY_PER_ITEM) {
          const added = Math.max(0, MAX_QTY_PER_ITEM - existing.qty);
          warningMsg = added > 0
            ? `Only ${added} more added. Maximum limit is ${MAX_QTY_PER_ITEM} units per item.`
            : `Maximum quantity limit (${MAX_QTY_PER_ITEM} units) reached for "${product.title}".`;
          return prev.map((item) =>
            item.id === product.id ? { ...item, qty: MAX_QTY_PER_ITEM } : item
          );
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: potentialQty } : item
        );
      }

      const initialQty = Math.min(validQty, MAX_QTY_PER_ITEM);
      if (validQty > MAX_QTY_PER_ITEM) {
        warningMsg = `Quantity capped at maximum limit of ${MAX_QTY_PER_ITEM} units.`;
      }

      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: Number(product.price),
          qty: initialQty,
          img: product.img || '/assets/product_bracelet.jpg'
        }
      ];
    });

    if (warningMsg) {
      showWarning(warningMsg);
    }

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    if (qty > MAX_QTY_PER_ITEM) {
      showWarning(`Maximum quantity limit is ${MAX_QTY_PER_ITEM} units per item.`);
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: MAX_QTY_PER_ITEM } : item))
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  /**
   * Applies authoritative pricing returned by /api/cart/validate, so the
   * drawer reflects the real catalogue price if it changed after the item
   * was added.
   */
  const syncItemPrice = (id: string, price: number, title?: string) => {
    const safePrice = Math.max(0, Number(price) || 0);
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, price: safePrice, title: title || item.title } : item
      )
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        subtotal,
        isCartOpen,
        openCart,
        closeCart,
        isSearchOpen,
        openSearch,
        closeSearch,
        cartWarning,
        clearCartWarning,
        maxQtyPerItem: MAX_QTY_PER_ITEM,
        syncItemPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
