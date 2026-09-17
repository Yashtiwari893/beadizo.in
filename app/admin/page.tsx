'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Layers,
  Image as ImageIcon,
  Tag,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { getProducts, getCategories, getHeroSlides, getPopupOffers, getSiteSettings, getContactSubmissions } from '@/lib/supabase/data';
import { DbProduct, DbCategory, DbHeroSlide, DbPopupOffer, DbSiteSettings, DbContactSubmission } from '@/lib/supabase/types';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [heroSlides, setHeroSlides] = useState<DbHeroSlide[]>([]);
  const [offers, setOffers] = useState<DbPopupOffer[]>([]);
  const [settings, setSettings] = useState<DbSiteSettings | null>(null);
  const [inquiries, setInquiries] = useState<DbContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prods, cats, slides, popups, sett, inqs] = await Promise.all([
          getProducts(),
          getCategories(),
          getHeroSlides(),
          getPopupOffers(),
          getSiteSettings(),
          getContactSubmissions().catch(() => []),
        ]);
        setProducts(prods);
        setCategories(cats);
        setHeroSlides(slides);
        setOffers(popups);
        setSettings(sett);
        setInquiries(inqs);
      } catch (err) {
        console.error('Failed loading dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const inStockCount = products.filter((p) => p.is_available).length;
  const featuredCount = products.filter((p) => p.is_featured).length;
  const activeOffer = offers.find((o) => o.is_active);
  const unreadCount = inquiries.filter((i) => !i.is_read).length;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#DFBDB5' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const statCards = [
    {
      title: 'Customer Inquiries',
      value: inquiries.length,
      sub: unreadCount > 0 ? `${unreadCount} Unread • Action required` : 'All inquiries answered',
      icon: MessageSquare,
      link: '/admin/inquiries',
      color: unreadCount > 0 ? '#F87171' : '#4ADE80',
    },
    {
      title: 'Total Products',
      value: products.length,
      sub: `${inStockCount} In Stock • ${featuredCount} Featured`,
      icon: Package,
      link: '/admin/products',
      color: '#DFBDB5',
    },
    {
      title: 'Active Categories',
      value: categories.length,
      sub: 'Organized by jewelry type',
      icon: Layers,
      link: '/admin/categories',
      color: '#93C5FD',
    },
    {
      title: 'Hero Banners',
      value: heroSlides.length,
      sub: `${heroSlides.filter((h) => h.is_active).length} Active on Homepage`,
      icon: ImageIcon,
      link: '/admin/hero',
      color: '#FDE047',
    },
    {
      title: 'Promotional Popups',
      value: activeOffer ? 'Active' : 'Disabled',
      sub: activeOffer ? activeOffer.title : 'No active popup offer',
      icon: Tag,
      link: '/admin/offers',
      color: '#86EFAC',
    },
  ];

  return (
    <div>
      {/* Top Welcome Title */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#FFFFFF', margin: '0 0 6px' }}>
            Store Overview
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#A6A6B2' }}>
            Welcome to the Beadizo Commerce Control Center. Manage products, live banners, and customer settings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/admin/products/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#DFBDB5',
              color: '#0A0A0C',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.84rem',
              textDecoration: 'none',
            }}
          >
            <Plus size={16} /> Add Product
          </Link>
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#1F1F26',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.84rem',
              textDecoration: 'none',
            }}
          >
            Live Site <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              href={stat.link}
              style={{
                background: '#141419',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '20px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#A6A6B2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.title}
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#72727D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{stat.sub}</span>
                <ArrowUpRight size={13} style={{ marginLeft: 'auto' }} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Status Bar */}
      {settings && (
        <div
          style={{
            background: '#141419',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#DFBDB5', fontWeight: 600 }}>WhatsApp Orders Desk:</span>
            <span style={{ color: '#EDEDED' }}>+{settings.whatsapp_phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#DFBDB5', fontWeight: 600 }}>Free Shipping Threshold:</span>
            <span style={{ color: '#EDEDED' }}>₹{settings.free_shipping_threshold}</span>
          </div>
          <div>
            <Link href="/admin/settings" style={{ color: '#DFBDB5', textDecoration: 'underline' }}>
              Edit Settings →
            </Link>
          </div>
        </div>
      )}

      {/* Recent Products Snapshot */}
      <div style={{ background: '#141419', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', margin: '0 0 2px', color: '#FFFFFF', fontFamily: 'var(--font-serif)' }}>
              Catalog Preview
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#A6A6B2' }}>
              Latest handcrafted items available on your storefront
            </p>
          </div>
          <Link href="/admin/products" style={{ fontSize: '0.82rem', color: '#DFBDB5', textDecoration: 'none', fontWeight: 600 }}>
            Manage All Products ({products.length}) →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', color: '#A6A6B2', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Product</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Selling Price</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Original Price</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Availability</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 6).map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={prod.images[0] || '/assets/product_bracelet.jpg'}
                        alt={prod.title}
                        style={{ width: '42px', height: '42px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{prod.title}</div>
                        {prod.badge && (
                          <span style={{ fontSize: '0.68rem', background: 'rgba(223, 189, 181, 0.2)', color: '#DFBDB5', padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                            {prod.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#A6A6B2', textTransform: 'capitalize' }}>
                    {prod.category_slug}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#FFFFFF' }}>
                    ₹{prod.price.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#72727D' }}>
                    {prod.original_price ? `₹${prod.original_price.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {prod.is_available ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4ADE80', fontSize: '0.78rem' }}>
                        <CheckCircle2 size={13} /> In Stock
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#F87171', fontSize: '0.78rem' }}>
                        <AlertCircle size={13} /> Out of Stock
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <Link
                      href={`/admin/products/${prod.id}`}
                      style={{
                        padding: '5px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#EDEDED',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
