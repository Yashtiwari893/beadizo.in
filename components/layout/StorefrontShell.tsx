'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '@/components/ui/CartDrawer';
import SearchOverlay from '@/components/ui/SearchOverlay';

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // If on admin routes, do not render storefront header, announcement, drawer, or footer
  if (isAdmin) {
    return <main style={{ minHeight: '100vh', background: '#0A0A0C' }}>{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <React.Suspense fallback={<div style={{ height: '86px', background: '#0A0A0C' }} />}>
        <Header />
      </React.Suspense>
      <SearchOverlay />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
    </>
  );
}
