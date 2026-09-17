'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Trash2, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { validateCartOnServer } from '@/lib/whatsapp';

export default function CartDrawer() {
  const {
    cart,
    removeFromCart,
    updateQty,
    cartCount,
    subtotal,
    isCartOpen,
    closeCart,
    cartWarning,
    clearCartWarning,
    maxQtyPerItem,
    syncItemPrice,
  } = useCart();

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setCheckoutError(null);
    }
    return () => {
      // Never leave the page permanently unscrollable if the drawer unmounts
      // while open (e.g. a route change during a transition).
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  /**
   * Prices in the drawer come from localStorage and are therefore untrusted.
   * Before opening WhatsApp we ask the server to re-price the bag from the
   * database, and we send the message the SERVER built. Editing the cart in
   * devtools can no longer produce a ₹1 order.
   */
  const handleCheckout = async () => {
    if (checkingOut || cart.length === 0) return;
    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const result = await validateCartOnServer(cart);

      if (result.removed.length > 0) {
        // Drop anything the catalogue no longer sells, and let the shopper review.
        result.removed.forEach((id) => updateQty(id, 0));
        setCheckoutError(
          'Some items are no longer available and have been removed from your bag. Please review and try again.'
        );
        return;
      }

      if (result.items.length === 0) {
        setCheckoutError('Your bag is empty.');
        return;
      }

      // Re-sync any price that drifted since the item was added.
      result.items.forEach((item) => syncItemPrice(item.id, item.price, item.title));

      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setCheckoutError(err?.message || 'We could not verify your bag. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`bag-drawer-backdrop ${isCartOpen ? 'active' : ''}`}
        onClick={closeCart}
        aria-hidden={!isCartOpen}
      />

      {/* Drawer */}
      <div
        className={`bag-drawer ${isCartOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
      >
        <div className="bag-drawer-header">
          <h3>
            Your Bag (<span>{cartCount}</span>)
          </h3>
          <button className="close-drawer-btn" onClick={closeCart} aria-label="Close bag">
            <X size={20} />
          </button>
        </div>

        {cartWarning && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              borderBottom: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '10px 16px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              lineHeight: 1.4,
            }}
          >
            <span>⚠️ {cartWarning}</span>
            <button
              type="button"
              onClick={clearCartWarning}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#991B1B',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="bag-drawer-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
                Your cart is empty.
              </p>
              <p style={{ fontSize: '0.85rem' }}>Explore our handcrafted collections.</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div className="drawer-item" key={`${item.id}-${idx}`}>
                <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden' }}>
                  <Image
                    src={item.img}
                    alt={item.title}
                    fill
                    sizes="64px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="drawer-item-title">{item.title}</h4>
                  
                  {/* Quantity adjustment with 20 limit cap */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        background: '#F9FAFB',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        style={{
                          padding: '2px 8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#374151',
                          fontWeight: 600,
                        }}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span style={{ padding: '2px 10px', fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={item.qty >= maxQtyPerItem}
                        style={{
                          padding: '2px 8px',
                          background: item.qty >= maxQtyPerItem ? '#E5E7EB' : 'transparent',
                          cursor: item.qty >= maxQtyPerItem ? 'not-allowed' : 'pointer',
                          border: 'none',
                          fontSize: '13px',
                          color: item.qty >= maxQtyPerItem ? '#9CA3AF' : '#374151',
                          fontWeight: 600,
                        }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {item.qty >= maxQtyPerItem && (
                      <span style={{ fontSize: '10px', color: '#B45309', fontWeight: 600, letterSpacing: '0.02em' }}>
                        Max (20)
                      </span>
                    )}
                  </div>

                  <p className="drawer-item-price">
                    ₹ {(item.price * item.qty).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  className="drawer-item-remove"
                  onClick={() => removeFromCart(idx)}
                  aria-label="Remove item"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="bag-drawer-footer">
          <div className="drawer-subtotal-row">
            <span className="drawer-subtotal-label">Subtotal</span>
            <span className="drawer-subtotal-val">₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Free Pan-India Delivery on orders over ₹999. Easy WhatsApp checkout.
          </p>
          {checkoutError && (
            <div
              role="alert"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#B91C1C',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                marginBottom: '12px',
              }}
            >
              {checkoutError}
            </div>
          )}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut || cart.length === 0}
            className="btn-blush"
            style={{
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: checkingOut || cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.6 : 1,
            }}
          >
            {checkingOut ? (
              <>
                <Loader2 size={16} className="lucide-spin" />
                <span>Confirming prices...</span>
              </>
            ) : (
              <span>Order via WhatsApp</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
