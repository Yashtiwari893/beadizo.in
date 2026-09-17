'use client';

import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { getPopupOffers } from '@/lib/supabase/data';
import { DbPopupOffer } from '@/lib/supabase/types';
import Link from 'next/link';

export default function PopupOfferModal() {
  const [offer, setOffer] = useState<DbPopupOffer | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('beadizo_offer_dismissed');
    if (dismissed) return;

    async function checkOffer() {
      const offers = await getPopupOffers();
      const active = offers.find((o) => o.is_active);
      if (active) {
        setOffer(active);
        // Delay popup slightly for a smoother visitor experience
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
    checkOffer();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('beadizo_offer_dismissed', 'true');
  };

  const handleCopy = () => {
    if (!offer?.discount_code) return;
    navigator.clipboard.writeText(offer.discount_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || !offer) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          background: '#141418',
          border: '1px solid rgba(223, 189, 181, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(223, 189, 181, 0.1)',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close offer modal"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.2s ease',
          }}
        >
          <X size={16} />
        </button>

        {/* Optional Creative Image Header */}
        {offer.image_url && (
          <div style={{ width: '100%', height: '180px', position: 'relative', overflow: 'hidden', background: '#0A0A0C' }}>
            <img
              src={offer.image_url}
              alt={offer.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, #141418 0%, transparent 60%)',
              }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: offer.image_url ? '16px 28px 28px' : '36px 28px 28px', textAlign: 'center' }}>
          {offer.badge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 12px',
                background: 'rgba(223, 189, 181, 0.15)',
                color: '#DFBDB5',
                borderRadius: '100px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '14px',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={12} />
              <span>{offer.badge}</span>
            </span>
          )}

          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: '#FFFFFF',
              margin: '0 0 10px',
              letterSpacing: '0.3px',
              lineHeight: 1.3,
            }}
          >
            {offer.title}
          </h3>

          {offer.subtitle && (
            <p
              style={{
                fontSize: '0.88rem',
                color: '#A6A6B2',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              {offer.subtitle}
            </p>
          )}

          {/* Promo code coupon box */}
          {offer.discount_code && (
            <div
              style={{
                background: '#0D0D10',
                border: '1px dashed #DFBDB5',
                borderRadius: '8px',
                padding: '12px 18px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: '0.68rem', color: '#7E7E8F', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Use Coupon Code
                </span>
                <span style={{ fontSize: '1.05rem', fontFamily: 'monospace', fontWeight: 700, color: '#DFBDB5', letterSpacing: '1.5px' }}>
                  {offer.discount_code}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: copied ? 'rgba(74, 222, 128, 0.15)' : 'rgba(223, 189, 181, 0.15)',
                  color: copied ? '#4ADE80' : '#DFBDB5',
                  border: copied ? '1px solid #4ADE80' : '1px solid rgba(223, 189, 181, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          )}

          {/* Primary CTA Button */}
          <Link
            href={offer.button_link || '/collections'}
            onClick={handleClose}
            style={{
              display: 'block',
              width: '100%',
              padding: '13px 20px',
              background: '#DFBDB5',
              color: '#0A0A0C',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.8px',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'background 0.2s ease, transform 0.15s ease',
              boxShadow: '0 8px 20px rgba(223, 189, 181, 0.25)',
            }}
          >
            {offer.button_text || 'CLAIM OFFER & SHOP →'}
          </Link>
        </div>
      </div>
    </div>
  );
}
