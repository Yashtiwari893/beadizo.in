'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { getUnreadInquiriesCount } from '@/lib/supabase/data';
import AdminLoginPage from './login/page';
import {
  LayoutDashboard,
  Package,
  Layers,
  Image as ImageIcon,
  Tag,
  Settings,
  ExternalLink,
  LogOut,
  Plus,
  Menu,
  X,
  Loader2,
  MessageSquare,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';

type ThemeMode = 'dark' | 'light';

const themes = {
  dark: {
    rootBg: '#0E0E12',
    sidebarBg: '#141419',
    headerBg: '#141419',
    cardBg: 'rgba(255,255,255,0.04)',
    text: '#EDEDED',
    subtext: '#A6A6B2',
    mutedText: '#72727D',
    accent: '#DFBDB5',
    accentHover: 'rgba(223, 189, 181, 0.15)',
    accentBg: 'rgba(223, 189, 181, 0.08)',
    accentOnDark: 'rgba(223, 189, 181, 0.12)',
    border: 'rgba(255, 255, 255, 0.08)',
    navActive: '#DFBDB5',
    navActiveText: '#0A0A0C',
    navInactiveText: '#A6A6B2',
    badgeBg: '#141419',
    badgeBgInactive: '#EF4444',
    overlay: 'rgba(0,0,0,0.7)',
    logoutColor: '#F87171',
    toggleBg: 'rgba(255,255,255,0.06)',
    toggleBorder: 'rgba(255,255,255,0.1)',
  },
  light: {
    rootBg: '#F4F5F7',
    sidebarBg: '#FFFFFF',
    headerBg: '#FFFFFF',
    cardBg: 'rgba(0,0,0,0.03)',
    text: '#1A1A2E',
    subtext: '#5A5A72',
    mutedText: '#8E8E9D',
    accent: '#B07A6A',
    accentHover: 'rgba(176, 122, 106, 0.12)',
    accentBg: 'rgba(176, 122, 106, 0.08)',
    accentOnDark: 'rgba(176, 122, 106, 0.1)',
    border: 'rgba(0, 0, 0, 0.08)',
    navActive: '#B07A6A',
    navActiveText: '#FFFFFF',
    navInactiveText: '#5A5A72',
    badgeBg: '#FFFFFF',
    badgeBgInactive: '#EF4444',
    overlay: 'rgba(0,0,0,0.35)',
    logoutColor: '#DC2626',
    toggleBg: 'rgba(0,0,0,0.04)',
    toggleBorder: 'rgba(0,0,0,0.1)',
  },
};

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated, loading } = useAdminAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Load theme from localStorage on mount — default is ALWAYS light mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin-theme') as ThemeMode | null;
      if (saved === 'dark') {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    } catch { /* SSR safety */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('admin-theme', next); } catch { /* noop */ }
      return next;
    });
  }, []);



  const t = themes[theme];

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
    router.refresh();
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const count = await getUnreadInquiriesCount();
        if (mounted) setUnreadCount(count);
      } catch {
        // silent
      }
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 30_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isAuthenticated, pathname]);

  // If already on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If auth is still reading localStorage
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: t.rootBg, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <Loader2 size={20} className="lucide-spin" />
        <span style={{ fontSize: '0.9rem' }}>Loading Admin Console...</span>
      </div>
    );
  }

  // Middleware already redirects unauthenticated page requests to /admin/login,
  // so this only covers a session expiring while the tab is open.
  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare, badge: unreadCount },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Hero Banners', href: '/admin/hero', icon: ImageIcon },
    { label: 'Instagram Feed', href: '/admin/instagram', icon: InstagramIcon },
    { label: 'Popup Offers', href: '/admin/offers', icon: Tag },
    { label: 'Blog Stories', href: '/admin/blogs', icon: BookOpen },
    { label: 'Site Settings', href: '/admin/settings', icon: Settings },
  ];

  const isLight = theme === 'light';

  const responsiveCss = `
    /* ===== CSS Custom Properties for Theme ===== */
    .admin-root-container {
      --admin-bg: ${isLight ? '#F4F5F7' : '#0E0E12'};
      --admin-card: ${isLight ? '#FFFFFF' : '#141419'};
      --admin-card-hover: ${isLight ? '#F9FAFB' : '#1A1A22'};
      --admin-input: ${isLight ? '#F0F1F3' : '#1F1F26'};
      --admin-text: ${isLight ? '#1A1A2E' : '#FFFFFF'};
      --admin-text-secondary: ${isLight ? '#5A5A72' : '#A6A6B2'};
      --admin-text-muted: ${isLight ? '#8E8E9D' : '#72727D'};
      --admin-accent: ${isLight ? '#B07A6A' : '#DFBDB5'};
      --admin-border: ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};
      --admin-border-input: ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'};
      --admin-icon-bg: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'};
      --admin-overlay: ${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.65)'};
      --admin-badge-bg: ${isLight ? '#F3F4F6' : '#1F1F26'};
      --admin-shadow: ${isLight ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'};
    }

    /* ===== Global Light Mode Overrides ===== */
    /* These rules override inline-styled hardcoded dark colors in all sub-pages */

    ${isLight ? `
    /* ===== LIGHT MODE — Comprehensive & Precise Overrides ===== */

    /* ------- Main Page Container ------- */
    .admin-main-content {
      color: #1A1A2E !important;
    }

    /* ------- Headings & Descriptive Text ------- */
    .admin-main-content h1,
    .admin-main-content h2,
    .admin-main-content h3,
    .admin-main-content h4,
    .admin-main-content h5,
    .admin-main-content h6 {
      color: #1A1A2E !important;
    }
    .admin-main-content p {
      color: #5A5A72 !important;
    }

    /* ------- Targeted Text Color Conversions (White/Light → Dark) ------- */
    .admin-main-content [style*="color: #FFFFFF"],
    .admin-main-content [style*="color:#FFFFFF"],
    .admin-main-content [style*="color: #EDEDED"],
    .admin-main-content [style*="color:#EDEDED"],
    .admin-main-content [style*="color: #fff"],
    .admin-main-content [style*="color:#fff"],
    .admin-main-content [style*="color: rgb(255, 255, 255)"],
    .admin-main-content [style*="color: rgb(237, 237, 237)"] {
      color: #1A1A2E !important;
    }

    /* ------- Secondary Text Conversions (#A6A6B2, #7E7E8F, #8E8E9F → #5A5A72) ------- */
    .admin-main-content [style*="color: #A6A6B2"],
    .admin-main-content [style*="color:#A6A6B2"],
    .admin-main-content [style*="color: #7E7E8F"],
    .admin-main-content [style*="color:#7E7E8F"],
    .admin-main-content [style*="color: #8E8E9F"],
    .admin-main-content [style*="color:#8E8E9F"],
    .admin-main-content [style*="color: rgb(166, 166, 178)"],
    .admin-main-content [style*="color: rgb(126, 126, 143)"],
    .admin-main-content [style*="color: rgb(142, 142, 159)"] {
      color: #5A5A72 !important;
    }

    /* ------- Muted Text Conversions (#72727D → #8E8E9D) ------- */
    .admin-main-content [style*="color: #72727D"],
    .admin-main-content [style*="color:#72727D"],
    .admin-main-content [style*="color: rgb(114, 114, 125)"] {
      color: #8E8E9D !important;
    }

    /* ------- Accent Color in Headers/Labels on Light Background (#DFBDB5 → #B07A6A) ------- */
    .admin-main-content [style*="color: #DFBDB5"]:not([style*="background: #DFBDB5"]):not([style*="background:#DFBDB5"]),
    .admin-main-content [style*="color:#DFBDB5"]:not([style*="background: #DFBDB5"]):not([style*="background:#DFBDB5"]),
    .admin-main-content [style*="color: rgb(223, 189, 181)"]:not([style*="background: #DFBDB5"]):not([style*="background:#DFBDB5"]) {
      color: #B07A6A !important;
    }

    /* ------- Card & Panel Backgrounds (Dark #141419 → White #FFFFFF) ------- */
    .admin-main-content [style*="background: #141419"],
    .admin-main-content [style*="background:#141419"],
    .admin-main-content [style*="background: #0E0E12"],
    .admin-main-content [style*="background:#0E0E12"],
    .admin-main-content [style*="background: #0A0A0C"],
    .admin-main-content [style*="background:#0A0A0C"],
    .admin-main-content [style*="background: rgb(20, 20, 25)"],
    .admin-main-content [style*="background-color: rgb(20, 20, 25)"],
    .admin-main-content [style*="background: rgb(14, 14, 18)"],
    .admin-main-content [style*="background-color: rgb(14, 14, 18)"],
    .admin-main-content [style*="background: rgb(10, 10, 12)"],
    .admin-main-content [style*="background-color: rgb(10, 10, 12)"] {
      background: #FFFFFF !important;
      background-color: #FFFFFF !important;
      border-color: rgba(0, 0, 0, 0.08) !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
    }

    /* Structural card fallback for cards, stat boxes, grids, and dialogs */
    .admin-main-content > div > div[style*="border"],
    .admin-main-content > div > div[style*="display: grid"] > a,
    .admin-main-content > div > div[style*="display: grid"] > div,
    .admin-main-content > div > div[style*="display:grid"] > a,
    .admin-main-content > div > div[style*="display:grid"] > div,
    .admin-main-content form > div[style*="border"],
    .admin-main-content [role="dialog"] > div[style*="border"] {
      background: #FFFFFF !important;
      background-color: #FFFFFF !important;
      border-color: rgba(0, 0, 0, 0.08) !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
    }

    /* ------- Sub-boxes, Secondary Card Backgrounds, Inputs (#1F1F26, #1B1B22, #101014 → #F0F1F3) ------- */
    .admin-main-content [style*="background: #1F1F26"],
    .admin-main-content [style*="background:#1F1F26"],
    .admin-main-content [style*="background: #1B1B22"],
    .admin-main-content [style*="background:#1B1B22"],
    .admin-main-content [style*="background: #101014"],
    .admin-main-content [style*="background:#101014"],
    .admin-main-content [style*="background: rgb(31, 31, 38)"],
    .admin-main-content [style*="background-color: rgb(31, 31, 38)"],
    .admin-main-content [style*="background: rgb(27, 27, 34)"],
    .admin-main-content [style*="background-color: rgb(27, 27, 34)"] {
      background: #F0F1F3 !important;
      background-color: #F0F1F3 !important;
      border-color: rgba(0, 0, 0, 0.12) !important;
      color: #1A1A2E !important;
    }

    /* Form controls in light mode */
    .admin-main-content input:not([type="checkbox"]):not([type="radio"]),
    .admin-main-content textarea,
    .admin-main-content select {
      background: #F4F5F7 !important;
      color: #1A1A2E !important;
      border-color: rgba(0, 0, 0, 0.12) !important;
    }
    .admin-main-content input::placeholder,
    .admin-main-content textarea::placeholder {
      color: #8E8E9D !important;
    }

    /* ------- Preserve Rose-Gold Primary CTA Buttons ------- */
    .admin-main-content [style*="background: #DFBDB5"],
    .admin-main-content [style*="background:#DFBDB5"],
    .admin-main-content [style*="background: rgb(223, 189, 181)"],
    .admin-main-content [style*="background-color: rgb(223, 189, 181)"] {
      background: #DFBDB5 !important;
      background-color: #DFBDB5 !important;
      color: #0A0A0C !important;
    }
    .admin-main-content [style*="background: #DFBDB5"] *,
    .admin-main-content [style*="background:#DFBDB5"] *,
    .admin-main-content [style*="background: rgb(223, 189, 181)"] * {
      color: #0A0A0C !important;
    }

    /* ------- Subtle Border Overrides ------- */
    .admin-main-content [style*="rgba(255, 255, 255, 0.08)"],
    .admin-main-content [style*="rgba(255,255,255,0.08)"],
    .admin-main-content [style*="rgba(255, 255, 255, 0.1)"],
    .admin-main-content [style*="rgba(255,255,255,0.1)"],
    .admin-main-content [style*="rgba(255, 255, 255, 0.06)"],
    .admin-main-content [style*="rgba(255,255,255,0.06)"],
    .admin-main-content [style*="rgba(255, 255, 255, 0.04)"],
    .admin-main-content [style*="rgba(255,255,255,0.04)"] {
      border-color: rgba(0, 0, 0, 0.08) !important;
    }

    /* ------- Form Inputs, Selects, Textareas ------- */
    .admin-main-content input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="color"]),
    .admin-main-content select,
    .admin-main-content textarea {
      background: #FFFFFF !important;
      color: #1A1A2E !important;
      border: 1px solid rgba(0, 0, 0, 0.15) !important;
    }
    .admin-main-content input::placeholder,
    .admin-main-content textarea::placeholder {
      color: #8E8E9D !important;
    }
    .admin-main-content input:focus,
    .admin-main-content select:focus,
    .admin-main-content textarea:focus {
      border-color: #B07A6A !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(176, 122, 106, 0.18) !important;
    }
    .admin-main-content select option {
      background: #FFFFFF !important;
      color: #1A1A2E !important;
    }
    .admin-main-content input[type="checkbox"] {
      accent-color: #B07A6A !important;
    }
    .admin-main-content label {
      color: #3A3A52 !important;
    }

    /* ------- Tables ------- */
    .admin-main-content table {
      border-color: rgba(0, 0, 0, 0.06) !important;
    }
    .admin-main-content th {
      background: #F4F5F7 !important;
      color: #5A5A72 !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
    }
    .admin-main-content td {
      border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
      color: #1A1A2E !important;
    }
    .admin-main-content tr:hover td {
      background: rgba(0, 0, 0, 0.02) !important;
    }

    /* Neutral category badges in table cells */
    .admin-main-content td span[style*="rgba(255,255,255,0.05)"],
    .admin-main-content td span[style*="rgba(255, 255, 255, 0.05)"] {
      background: rgba(0, 0, 0, 0.06) !important;
      color: #3A3A52 !important;
    }

    /* Icon container circles/boxes in stat cards */
    .admin-main-content div[style*="rgba(255,255,255,0.06)"],
    .admin-main-content div[style*="rgba(255, 255, 255, 0.06)"] {
      background: rgba(0, 0, 0, 0.05) !important;
    }
    ` : ''}


    /* ===== Admin Panel Responsive Styles ===== */
    .admin-sidebar {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .admin-mobile-toggle {
      display: none !important;
    }

    /* Tablet */
    @media (max-width: 1024px) {
      .admin-main-wrapper {
        margin-left: 220px !important;
      }
      .admin-sidebar {
        width: 220px !important;
      }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .admin-sidebar {
        transform: ${isMobileOpen ? 'translateX(0) !important' : 'translateX(-100%) !important'};
        width: 280px !important;
      }
      .admin-main-wrapper {
        margin-left: 0 !important;
      }
      .admin-mobile-toggle {
        display: inline-flex !important;
      }
      .admin-header-title {
        display: none !important;
      }
      .admin-main-content {
        padding: 20px 16px !important;
      }
      .admin-header-bar {
        padding: 0 16px !important;
      }
    }

    /* Small Mobile */
    @media (max-width: 480px) {
      .admin-sidebar {
        width: 100% !important;
      }
      .admin-main-content {
        padding: 16px 12px !important;
      }
    }

    /* Theme toggle animation */
    .theme-toggle-btn {
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .theme-toggle-btn:hover {
      transform: scale(1.08);
    }
    .theme-toggle-btn:active {
      transform: scale(0.95);
    }

    /* Lucide spinner */
    @keyframes lucide-spin { to { transform: rotate(360deg); } }
    .lucide-spin { animation: lucide-spin 1s linear infinite; }

    /* Nav hover effect */
    .admin-nav-link:hover {
      background: ${t.accentHover} !important;
    }

    /* ===== Responsive Overhauls: Hero, Offers, and Settings ===== */

    /* Tablet & Medium Breakpoint (<= 1024px) */
    @media (max-width: 1024px) {
      .admin-hero-grid {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
      }
      .admin-offers-layout {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
      }
    }

    /* Intermediate Breakpoint (<= 960px) */
    @media (max-width: 960px) {
      .admin-offers-editor-grid {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
      }
      .admin-settings-section-grid {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
      }
    }

    /* Mobile Breakpoint (<= 640px) */
    @media (max-width: 640px) {
      .admin-two-col-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
      .admin-contact-grid {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
      }
      .admin-upload-row {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
      }
      .admin-upload-row input {
        width: 100% !important;
      }
      .admin-upload-btn-group {
        display: flex !important;
        width: 100% !important;
        gap: 8px !important;
      }
      .admin-upload-btn-group > * {
        flex: 1 !important;
        justify-content: center !important;
        text-align: center !important;
      }
      .admin-threshold-input {
        max-width: 100% !important;
      }
    }

    /* Small Mobile Breakpoint (<= 540px) */
    @media (max-width: 540px) {
      .admin-page-header {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 12px !important;
      }
      .admin-header-actions {
        display: flex !important;
        width: 100% !important;
        gap: 8px !important;
      }
      .admin-header-actions > button {
        flex: 1 !important;
        justify-content: center !important;
      }
      .admin-header-save-btn {
        width: 100% !important;
        justify-content: center !important;
      }
      .admin-hero-img-row {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
      }
      .admin-hero-thumb {
        width: 100% !important;
        height: 120px !important;
      }
    }
  `;

  return (
    <div className="admin-root-container" style={{ display: 'flex', minHeight: '100vh', background: t.rootBg, color: t.text, fontFamily: 'var(--font-body)' }}>
      <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />

      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: t.overlay, zIndex: 90, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          background: t.sidebarBg,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          boxShadow: theme === 'light' ? '2px 0 12px rgba(0,0,0,0.04)' : 'none',
        }}
        className="admin-sidebar"
      >
        {/* Brand Header — Dual Logo */}
        <div style={{
          padding: '16px 16px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1, minWidth: 0 }}>
            <img
              src="/assets/vektron_beadizo_logo.png"
              alt="Vektron Automation × Beadizo"
              style={{
                height: '40px',
                objectFit: 'contain',
                maxWidth: '180px',
                filter: theme === 'dark' ? 'brightness(1.1)' : 'none',
              }}
            />
          </Link>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="admin-mobile-toggle"
            style={{ display: 'none', background: 'none', border: 'none', color: t.subtext, cursor: 'pointer', padding: '4px' }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* CMS Badge */}
        <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.68rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: t.accent,
            fontWeight: 700,
            padding: '3px 8px',
            background: t.accentOnDark,
            borderRadius: '4px',
          }}>
            CMS Admin
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            const badgeCount = item.badge;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={isActive ? '' : 'admin-nav-link'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? t.navActiveText : t.navInactiveText,
                  background: isActive ? t.navActive : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {typeof badgeCount === 'number' && badgeCount > 0 && (
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: '10px',
                      background: isActive ? t.badgeBg : t.badgeBgInactive,
                      color: isActive ? t.accent : '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: t.accent,
              textDecoration: 'none',
              background: t.accentBg,
            }}
          >
            <span>View Live Storefront</span>
            <ExternalLink size={14} />
          </Link>

          <button
            onClick={handleLogout}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: t.logoutColor,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper" style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh', background: t.rootBg }}>
        {/* Top Header Bar */}
        <header
          className="admin-header-bar"
          style={{
            height: '64px',
            background: t.headerBg,
            borderBottom: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: theme === 'light' ? '0 1px 6px rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="admin-mobile-toggle"
              style={{ display: 'none', background: 'none', border: 'none', color: t.text, cursor: 'pointer', padding: '4px' }}
              aria-label="Toggle sidebar"
            >
              {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span className="admin-header-title" style={{ fontSize: '0.85rem', color: t.subtext, fontWeight: 500 }}>
              Beadizo Management Console
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: t.toggleBg,
                border: `1px solid ${t.toggleBorder}`,
                color: theme === 'dark' ? '#FCD34D' : '#6366F1',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Add Product Button */}
            <Link
              href="/admin/products/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: t.accent,
                color: theme === 'dark' ? '#0A0A0C' : '#FFFFFF',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={15} /> Add Product
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="admin-main-content" style={{ padding: '32px 28px', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
