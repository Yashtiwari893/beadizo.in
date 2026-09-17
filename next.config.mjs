/** @type {import('next').NextConfig} */

// Trigger route reload
const isProd = process.env.NODE_ENV === 'production';

/**
 * Pin the image host to THIS project rather than `*.supabase.co`.
 * The wildcard let anyone request `/_next/image?url=https://<any>.supabase.co/...`
 * and use our image optimiser as an open proxy at our expense.
 */
let supabaseHostname = null;
try {
  supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
} catch {
  // Not configured at build time — the remotePatterns entry is simply omitted.
}

const connectSrc = ["'self'"];
if (supabaseHostname) {
  connectSrc.push(`https://${supabaseHostname}`, `wss://${supabaseHostname}`);
}

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' is required by the Next.js dev overlay only; it is dropped in
  // production builds. 'unsafe-inline' remains for React's injected styles and
  // Next's bootstrap script.
  isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `img-src 'self' blob: data:${supabaseHostname ? ` https://${supabaseHostname}` : ''} https://images.unsplash.com`,
  "font-src 'self' https://fonts.gstatic.com data:",
  `connect-src ${connectSrc.join(' ')}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  'upgrade-insecure-requests',
];

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
];

if (isProd) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

const nextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework version to scanners.
  poweredByHeader: false,
  compiler: {
    // Strip console.log/info/debug from production bundles; keep errors/warnings.
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      ...(supabaseHostname
        ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
    formats: ['image/avif', 'image/webp'],
    // SVG can carry script and is never a legitimate product photo.
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        // Admin pages and APIs must never be cached by a proxy or the browser.
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
