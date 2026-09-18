'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
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
  Database,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated, loading } = useAdminAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
    router.refresh();
  };
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
      <div style={{ minHeight: '100vh', background: '#0A0A0C', color: '#DFBDB5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
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
    { label: 'Site Settings', href: '/admin/settings', icon: Settings },
  ];

  const responsiveCss = `
    @media (max-width: 768px) {
      .admin-sidebar {
        transform: ${isMobileOpen ? 'translateX(0) !important' : 'translateX(-100%) !important'};
      }
      .admin-main-wrapper {
        margin-left: 0 !important;
      }
      .admin-mobile-toggle {
        display: inline-flex !important;
      }
    }
  `;

  return (
    <div className="admin-root-container" style={{ display: 'flex', minHeight: '100vh', background: '#0E0E12', color: '#EDEDED', fontFamily: 'var(--font-body)' }}>
      <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />

      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 90 }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          background: '#141419',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transition: 'transform 0.3s ease',
        }}
        className="admin-sidebar"
      >
        {/* Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="Beadizo" style={{ height: '36px', objectFit: 'contain' }} />
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#DFBDB5', fontWeight: 700, padding: '2px 6px', background: 'rgba(223, 189, 181, 0.12)', borderRadius: '3px' }}>
              CMS
            </span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="admin-mobile-toggle"
            style={{ display: 'none', background: 'none', border: 'none', color: '#A6A6B2', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            const badgeCount = item.badge;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0A0A0C' : '#A6A6B2',
                  background: isActive ? '#DFBDB5' : 'transparent',
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
                      background: isActive ? '#141419' : '#EF4444',
                      color: isActive ? '#DFBDB5' : '#FFF',
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

        {/* Database Status Pill */}
        <div style={{ padding: '12px 16px', margin: '0 12px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isSupabaseConfigured ? '#4ADE80' : '#FBBF24' }}>
            <Database size={13} />
            <span style={{ fontWeight: 600 }}>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}</span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#72727D', fontSize: '0.7rem' }}>
            {isSupabaseConfigured ? 'Live PostgreSQL + Media Storage' : 'Configure .env.local for Cloud DB'}
          </p>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              color: '#DFBDB5',
              textDecoration: 'none',
              background: 'rgba(223, 189, 181, 0.08)',
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
              borderRadius: '6px',
              fontSize: '0.82rem',
              color: '#F87171',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper" style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh', background: '#0E0E12' }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '64px',
            background: '#141419',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="admin-mobile-toggle"
              style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontSize: '0.85rem', color: '#A6A6B2' }}>Beadizo Management Console</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/admin/products/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: '#DFBDB5',
                color: '#0A0A0C',
                borderRadius: '5px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Plus size={15} /> Add Product
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main style={{ padding: '32px 28px', flex: 1 }}>{children}</main>
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
