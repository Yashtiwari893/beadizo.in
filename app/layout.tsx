import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import StorefrontShell from '@/components/layout/StorefrontShell';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beadizo.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Beadizo — Handcrafted Jewellery | Small Beads Big Stories',
    template: '%s | Beadizo',
  },
  description:
    'Discover thoughtfully crafted handmade jewellery from Beadizo. Unique beaded bracelets, necklaces, earrings, anklets and luxury gift sets made with love.',
  keywords: [
    'Beadizo',
    'beadizo.in',
    'handcrafted jewellery',
    'handmade bead bracelets',
    'beaded necklaces',
    'crystal bead jewellery',
    'evil eye bracelet',
    'custom bead jewellery India',
    'artisan jewellery Mumbai',
    'handmade gifts for her',
    'beaded anklets',
    'aesthetic jewellery india',
  ],
  authors: [{ name: 'Beadizo', url: siteUrl }],
  creator: 'Beadizo',
  publisher: 'Beadizo',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Beadizo — Handcrafted Jewellery | Small Beads Big Stories',
    description:
      'Discover thoughtfully crafted handmade jewellery from Beadizo. Unique beaded bracelets, necklaces, earrings, anklets and luxury gift sets.',
    url: siteUrl,
    siteName: 'Beadizo',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'Beadizo Handcrafted Jewellery Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beadizo — Handcrafted Jewellery',
    description: 'Small Beads, Big Stories. Thoughtfully crafted handmade jewellery.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Rich Structured Data (Schema.org) for Google Brand Knowledge Graph
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Beadizo',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      'Handcrafted artisan beaded jewellery brand based in India, specializing in bespoke bracelets, necklaces, anklets, and curated gift boxes.',
    sameAs: [
      'https://www.instagram.com/beadizo.in',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Beadizo',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/collections?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
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
