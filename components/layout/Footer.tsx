'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, ArrowRight, Heart, Lock } from 'lucide-react';
import { WHATSAPP_PHONE, CONTACT_EMAIL } from '@/lib/whatsapp';
import { getSiteSettings } from '@/lib/supabase/data';

export default function Footer() {
  const [phone, setPhone] = useState(WHATSAPP_PHONE);
  const [email, setEmail] = useState(CONTACT_EMAIL);

  useEffect(() => {
    async function load() {
      try {
        const s = await getSiteSettings();
        if (s?.whatsapp_phone) setPhone(s.whatsapp_phone);
        if (s?.contact_email) setEmail(s.contact_email);
      } catch {}
    }
    load();
  }, []);

  return (
    <footer className="site-footer-black" role="contentinfo">
      <div className="container">
        <div className="footer-columns-grid">
          {/* Col 1: Brand */}
          <div className="footer-brand-panel">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="BEADIZO — Crafted With Love"
                width={150}
                height={52}
                style={{ height: '56px', width: 'auto', marginBottom: '8px', objectFit: 'contain' }}
              />
            </Link>
            <p>Thoughtfully crafted jewellery for your everyday moments.</p>
            <div
              className="footer-contact-details"
              style={{
                margin: '12px 0 16px',
                fontSize: '0.82rem',
                color: '#A6A6B2',
                lineHeight: 1.7,
              }}
            >
              <p style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#DFBDB5" style={{ flexShrink: 0 }} />
                <span>
                  <strong>WhatsApp:</strong>{' '}
                  <a
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#DFBDB5', textDecoration: 'none' }}
                  >
                    +{phone}
                  </a>
                </span>
              </p>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#DFBDB5" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Email:</strong>{' '}
                  <a
                    href={`mailto:${email}`}
                    style={{ color: '#DFBDB5', textDecoration: 'none' }}
                  >
                    {email}
                  </a>
                </span>
              </p>
            </div>
            <div className="footer-social-icons">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <Phone size={18} />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-column-item">
            <h4>Quick Links</h4>
            <div className="footer-link-list">
              <Link href="/">Home</Link>
              <Link href="/collections">Collections</Link>
              <Link href="/collections">Shop</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>

          {/* Col 3: Customer Care */}
          <div className="footer-column-item">
            <h4>Customer Care</h4>
            <div className="footer-link-list">
              <Link href="/contact">Track Order</Link>
              <Link href="/about">Shipping Policy</Link>
              <Link href="/about">Return &amp; Exchange</Link>
              <Link href="/about">FAQs</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
          </div>

          {/* Col 4: Legal */}
          <div className="footer-column-item">
            <h4>Legal</h4>
            <div className="footer-link-list">
              <Link href="/about">Terms &amp; Conditions</Link>
              <Link href="/about">Privacy Policy</Link>
              <Link href="/about">Refund Policy</Link>
              <Link href="/admin/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                <Lock size={11} /> Admin Portal
              </Link>
            </div>
          </div>

          {/* Col 5: Stay Connected */}
          <div className="footer-column-item">
            <h4>Stay Connected</h4>
            <p style={{ fontSize: '0.82rem', color: '#A6A6B2', lineHeight: 1.5 }}>
              Be the first to know about new collections and offers.
            </p>
            <div className="footer-email-box">
              <input type="email" placeholder="Enter your email" aria-label="Email address" />
              <button type="button" aria-label="Subscribe">
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom-legal">
          <p>© 2026 Beadizo. All rights reserved.</p>
          <p>
            Made with{' '}
            <Heart
              size={12}
              fill="#E11D48"
              color="#E11D48"
              style={{ verticalAlign: 'middle', display: 'inline-block', margin: '0 3px' }}
            />{' '}
            for beautiful souls.
          </p>
        </div>
      </div>
    </footer>
  );
}
