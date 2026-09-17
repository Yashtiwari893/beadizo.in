import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import StorefrontShell from '@/components/layout/StorefrontShell';

export const metadata: Metadata = {
  title: 'BEADIZO — Handcrafted Jewellery | Small Beads Big Stories',
  description:
    'Discover thoughtfully crafted handmade jewellery from Beadizo. Unique beaded bracelets, necklaces, earrings, anklets and luxury gift sets.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <WishlistProvider>
            <StorefrontShell>{children}</StorefrontShell>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
