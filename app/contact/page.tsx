'use client';

import React, { useState } from 'react';
import { MessageSquare, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_PHONE, CONTACT_EMAIL } from '@/lib/whatsapp';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    inquiryType: 'Custom Handcrafted Jewellery',
    message: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Field caps keep input size bounded and safe
  const LIMITS = { name: 80, phone: 20, email: 120, message: 1000 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    const name = formData.name.trim().slice(0, LIMITS.name);
    const phone = formData.phone.replace(/[^0-9+\-\s]/g, '').trim().slice(0, LIMITS.phone);
    const email = formData.email.trim().slice(0, LIMITS.email);
    const message = formData.message.trim().slice(0, LIMITS.message);

    if (name.length < 2) {
      setFormError('Please enter your name (at least 2 characters).');
      return;
    }
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setFormError('Please enter a valid 10–15 digit phone number.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (message.length < 5) {
      setFormError('Please tell us a little more about what you are looking for (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: email || null,
          inquiry_type: formData.inquiryType,
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      setIsSubmitted(true);
      setFormData({
        name: '',
        phone: '',
        email: '',
        inquiryType: 'Custom Handcrafted Jewellery',
        message: '',
      });
    } catch (err: any) {
      console.error('Contact submit failed:', err);
      setFormError(err.message || 'Something went wrong. Please try again or reach out to us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '70px 0 100px', backgroundColor: 'var(--bg-cream)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="section-eyebrow">DIRECT ASSISTANCE</span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.4rem, 4vw, 3.2rem)',
              color: 'var(--text-dark)',
              margin: '8px 0 14px'
            }}
          >
            We&apos;re Here For You
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted)',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.65
            }}
          >
            Have questions about sizing, custom bead designs, bridal sets, or tracking your order? Reach out anytime.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'start' }}>
          {/* Left: Form */}
          <div
            style={{
              background: '#fff',
              padding: '40px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.6rem',
                marginBottom: '20px',
                color: 'var(--text-dark)'
              }}
            >
              Send A Note
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    marginBottom: '6px',
                    display: 'block'
                  }}
                >
                  Full Name
                </label>
                <input
                  maxLength={80}
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="newsletter-email-input"
                  placeholder="Enter your full name"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    marginBottom: '6px',
                    display: 'block'
                  }}
                >
                  WhatsApp Phone Number *
                </label>
                <input
                  maxLength={20}
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="newsletter-email-input"
                  placeholder="+91 98765 43210"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    marginBottom: '6px',
                    display: 'block'
                  }}
                >
                  Email Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  maxLength={120}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="newsletter-email-input"
                  placeholder="name@example.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    marginBottom: '6px',
                    display: 'block'
                  }}
                >
                  Inquiry Type
                </label>
                <select
                  value={formData.inquiryType}
                  onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                  className="newsletter-email-input"
                  style={{ width: '100%', background: '#fff' }}
                >
                  <option>Custom Handcrafted Jewellery</option>
                  <option>Track Existing Order</option>
                  <option>Bridesmaids &amp; Luxury Gifting</option>
                  <option>Return / Exchange Support</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    marginBottom: '6px',
                    display: 'block'
                  }}
                >
                  Your Message *
                </label>
                <textarea
                  maxLength={1000}
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="newsletter-email-input"
                  placeholder="Tell us about your requirement or order..."
                  style={{ width: '100%', height: 'auto', padding: '12px' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-blush"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'SENDING INQUIRY...' : 'SEND MESSAGE →'}
              </button>

              {formError && (
                <div
                  role="alert"
                  style={{
                    color: '#B91C1C',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    padding: '12px',
                    background: '#FEE2E2',
                    borderRadius: '4px',
                    marginTop: '10px',
                  }}
                >
                  {formError}
                </div>
              )}

              {isSubmitted && !formError && (
                <div
                  style={{
                    color: '#166534',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    textAlign: 'center',
                    padding: '12px',
                    background: '#DCFCE7',
                    borderRadius: '4px',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Thank you! Your message has been received. Our team will contact you shortly.</span>
                </div>
              )}
            </form>
          </div>

          {/* Right: Direct WhatsApp Box */}
          <div
            style={{
              background: '#1B1817',
              color: '#fff',
              borderRadius: '8px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(223, 189, 181, 0.12)',
                color: '#DFBDB5',
                marginBottom: '16px'
              }}
            >
              <MessageSquare size={26} />
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.6rem',
                marginBottom: '12px',
                color: '#fff'
              }}
            >
              Instant WhatsApp Desk
            </h3>

            <p
              style={{
                fontSize: '0.88rem',
                color: '#DDD5CF',
                marginBottom: '24px',
                lineHeight: 1.65
              }}
            >
              Need quick answers about wrist sizing, customization previews, or want to place an order via chat? Connect directly with us.
            </p>

            <a
              href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Hi Beadizo! I have an inquiry.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                background: '#25D366',
                color: '#fff',
                borderRadius: '3px',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '28px',
                textDecoration: 'none'
              }}
            >
              <Phone size={18} />
              Chat On WhatsApp
            </a>

            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.12)',
                paddingTop: '20px',
                fontSize: '0.84rem',
                color: '#DDD5CF',
                textAlign: 'left',
                lineHeight: 1.85
              }}
            >
              <p style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="#DFBDB5" style={{ flexShrink: 0 }} />
                <span>
                  <strong>WhatsApp / Contact:</strong>{' '}
                  <a
                    href={`https://wa.me/${WHATSAPP_PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#DFBDB5', fontWeight: 600, textDecoration: 'none' }}
                  >
                    +91 93245 56148
                  </a>
                </span>
              </p>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} color="#DFBDB5" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Email:</strong>{' '}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    style={{ color: '#DFBDB5', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {CONTACT_EMAIL}
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
