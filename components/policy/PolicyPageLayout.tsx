'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Clock, MessageCircle, Mail, FileText, RefreshCw, Truck } from 'lucide-react';

interface PolicyPageLayoutProps {
  title: string;
  subtitle: string;
  updatedAt?: string;
  content: string;
}

const POLICY_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy', icon: ShieldCheck },
  { label: 'Refund & Exchange', href: '/refund-policy', icon: RefreshCw },
  { label: 'Terms & Conditions', href: '/terms', icon: FileText },
  { label: 'Shipping Policy', href: '/shipping-policy', icon: Truck },
];

export default function PolicyPageLayout({
  title,
  subtitle,
  updatedAt,
  content,
}: PolicyPageLayoutProps) {
  const pathname = usePathname();

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'March 2026';

  return (
    <div style={{ backgroundColor: 'var(--bg-cream, #FAF7F2)', minHeight: '100vh', padding: '36px 0 80px' }}>
      <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-muted, #72727D)',
            marginBottom: '28px',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-muted, #72727D)', textDecoration: 'none' }}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-muted, #72727D)' }}>Legal &amp; Policies</span>
          <span>/</span>
          <span style={{ color: 'var(--accent-terracotta, #B07A6A)', fontWeight: 500 }}>{title}</span>
        </nav>

        {/* Header Hero */}
        <header
          style={{
            textAlign: 'center',
            marginBottom: '36px',
            padding: '24px 16px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(176, 122, 106, 0.12)',
              color: 'var(--accent-terracotta, #B07A6A)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={14} /> Official Beadizo Policy
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              color: 'var(--text-dark, #1A1A2E)',
              lineHeight: 1.2,
              margin: '0 0 14px',
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-muted, #5A5A72)',
              maxWidth: '680px',
              margin: '0 auto 16px',
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: 'var(--text-muted, #72727D)',
            }}
          >
            <Clock size={13} />
            <span>Effective / Last Updated: {formattedDate}</span>
          </div>
        </header>

        {/* Policy Tab Switcher */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          {POLICY_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? 'var(--accent-terracotta, #B07A6A)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : 'var(--text-dark, #1A1A2E)',
                  boxShadow: isActive
                    ? '0 4px 14px rgba(176, 122, 106, 0.25)'
                    : '0 1px 4px rgba(0, 0, 0, 0.04)',
                  border: isActive ? '1px solid var(--accent-terracotta, #B07A6A)' : '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <Icon size={14} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Policy Content Card */}
        <article
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            lineHeight: 1.8,
            color: 'var(--text-dark, #2D2D3A)',
          }}
        >
          {content ? (
            <div>
              {content.split('\n\n').map((block, idx) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                // H2 Heading
                if (trimmed.startsWith('## ')) {
                  const headingText = trimmed.replace(/^##\s*/, '');
                  return (
                    <h2
                      key={idx}
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)',
                        color: 'var(--text-dark, #1A1A2E)',
                        margin: idx === 0 ? '0 0 14px' : '36px 0 14px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '4px',
                          height: '20px',
                          backgroundColor: 'var(--accent-terracotta, #B07A6A)',
                          borderRadius: '2px',
                        }}
                      />
                      {headingText}
                    </h2>
                  );
                }

                // H3 Heading
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '1.2rem',
                        color: 'var(--text-dark, #1A1A2E)',
                        margin: '24px 0 10px',
                      }}
                    >
                      {trimmed.replace(/^###\s*/, '')}
                    </h3>
                  );
                }

                // Bullet Lists
                if (trimmed.startsWith('- ')) {
                  const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- '));
                  return (
                    <ul
                      key={idx}
                      style={{
                        margin: '12px 0 20px',
                        paddingLeft: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {items.map((item, itemIdx) => {
                        const clean = item.replace(/^-\s*/, '');
                        return (
                          <li
                            key={itemIdx}
                            style={{
                              fontSize: '0.96rem',
                              lineHeight: 1.7,
                              color: 'var(--text-dark, #2D2D3A)',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: renderInlineMarkdown(clean),
                            }}
                          />
                        );
                      })}
                    </ul>
                  );
                }

                // Ordered Lists (1. 2. 3.)
                if (/^\d+\.\s/.test(trimmed)) {
                  const items = trimmed.split('\n').filter((l) => /^\d+\.\s/.test(l.trim()));
                  return (
                    <ol
                      key={idx}
                      style={{
                        margin: '12px 0 20px',
                        paddingLeft: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {items.map((item, itemIdx) => {
                        const clean = item.replace(/^\d+\.\s*/, '');
                        return (
                          <li
                            key={itemIdx}
                            style={{
                              fontSize: '0.96rem',
                              lineHeight: 1.7,
                              color: 'var(--text-dark, #2D2D3A)',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: renderInlineMarkdown(clean),
                            }}
                          />
                        );
                      })}
                    </ol>
                  );
                }

                // Normal Paragraph
                return (
                  <p
                    key={idx}
                    style={{
                      fontSize: '0.96rem',
                      lineHeight: 1.8,
                      color: 'var(--text-dark, #2D2D3A)',
                      marginBottom: '18px',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: renderInlineMarkdown(trimmed),
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
              Policy text is currently being updated.
            </p>
          )}
        </article>

        {/* Contact Concierge Support Callout */}
        <section
          style={{
            marginTop: '36px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px 24px',
            border: '1px solid rgba(176, 122, 106, 0.2)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '1.2rem',
                margin: '0 0 6px',
                color: 'var(--text-dark, #1A1A2E)',
              }}
            >
              Have questions regarding our policies?
            </h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted, #72727D)' }}>
              Our customer concierge team is available to assist you with order status, returns, and care queries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/919324556148?text=Hello%20Beadizo%2C%20I%20have%20a%20question%20about%20your%20store%20policies."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={15} /> WhatsApp Support
            </a>
            <a
              href="mailto:shamairakhan712@gmail.com?subject=Beadizo%20Policy%20Inquiry"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: 'var(--text-dark, #1A1A2E)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Mail size={15} /> Email Concierge
            </a>
          </div>
        </section>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--accent-terracotta, #B07A6A)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> Back to Beadizo Home
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Basic inline markdown helper: turns **bold**, *italic*, and links into safe HTML */
function renderInlineMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(
      /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #B07A6A; text-decoration: underline;">$1</a>'
    );
}
