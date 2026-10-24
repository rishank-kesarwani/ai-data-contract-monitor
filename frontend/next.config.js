/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Deliver high-compression modern formats (AVIF then WebP)
    formats: ['image/avif', 'image/webp'],

    // Prune deviceSizes from default 8 down to 3 standard breakpoints
    // Eliminates ~62.5% of responsive variants that deplete Vercel quota
    deviceSizes: [640, 1080, 1920],

    // Prune imageSizes from default 8 down to 4 icon/thumbnail dimensions
    imageSizes: [32, 64, 128, 256],

    // Extend edge cache lifetime to 1 year (31,536,000s) instead of default 60s
    // Prevents Vercel from re-transforming unchanged cached assets
    minimumCacheTTL: 31536000,

    // Block Vercel optimizer from attempting to rasterize vector SVGs
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;
