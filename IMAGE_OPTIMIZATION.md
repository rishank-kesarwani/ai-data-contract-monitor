# Vercel Image Optimization Architecture & Usage Reduction Guide

**Application**: `AI Data Contract & Schema Drift Monitor`  
**Role**: Senior Next.js Performance & Core Web Vitals Engineer  
**Objective**: Eliminate unnecessary Vercel Image Optimization transformations to protect the team's 5,000 monthly allowance while preserving visual fidelity, mobile responsiveness, accessibility, and 0 Cumulative Layout Shift (CLS).

---

## 1. Executive Summary & Audit Findings

### Context & Constraint
Vercel accounts provide an allowance of **5,000 image transformations per month**. Each unique combination of `(src, width, quality, format)` requested through Next.js's default `/_next/image` endpoint increments this counter. When the allowance is reached, newly requested variants return HTTP 402/500 errors, leading to broken images unless robust bypass and fallback mechanisms are in place.

### Audit of Repository Assets & Configuration
Before implementing optimizations, an exhaustive audit was performed:
1. **Framework & Version**: Next.js `14.2.24` (App Router) on React `18.3.1` and TypeScript `5.8.2`.
2. **Initial Image Configuration (`next.config.js`)**:
   - `images` was unconfigured, leaving Next.js defaults active:
     - 8 default `deviceSizes`: `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`
     - 8 default `imageSizes`: `[16, 32, 48, 64, 96, 128, 256, 384]`
     - `minimumCacheTTL`: 60 seconds (extreme risk: edge caches expired after 1 minute, causing Vercel to repeatedly re-transform identical images, rapidly depleting the quota).
     - Modern formats AVIF/WebP were not explicitly configured for optimal delivery.
3. **Asset Inventory**:
   - `frontend/public/icon.svg` (1.4 KB) — Scalable vector branding icon.
   - `frontend/src/app/icon.svg` (1.5 KB) — App Router favicon metadata.
   - UI icons across all 10 domain components: Rendered as inline vector components via `lucide-react` (0 bytes of external image requests, 0 transformations).
4. **Vercel Cache Headers (`vercel.json`)**:
   - Initial `max-age=86400` (24 hours) was too short, allowing edge and browser caches to expire daily.

---

## 2. Optimization Strategy & Transformations Avoided

### A. Next.js Configuration (`frontend/next.config.js`)
We pruned the default responsive matrix and locked down edge cache lifetimes:

```javascript
images: {
  // 1. Deliver high-efficiency modern formats
  formats: ['image/avif', 'image/webp'],

  // 2. Prune deviceSizes from default 8 down to 3 standard breakpoints
  // Eliminates 62.5% of responsive variants that deplete Vercel quota
  deviceSizes: [640, 1080, 1920],

  // 3. Prune imageSizes from default 8 down to 4 icon/thumbnail dimensions
  imageSizes: [32, 64, 128, 256],

  // 4. Extend edge cache lifetime to 1 year (31,536,000s) instead of default 60s
  // Prevents Vercel from re-transforming unchanged cached assets
  minimumCacheTTL: 31536000,

  // 5. Block Vercel optimizer from attempting to rasterize vector SVGs
  dangerouslyAllowSVG: false,
  contentDispositionType: 'attachment',
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}
```

#### Transformations Avoided by Design:
| Factor | Default Next.js Behavior | Optimized Behavior | Transformations Saved |
| :--- | :--- | :--- | :--- |
| **Responsive Breakpoints** | 8 device sizes | 3 device sizes (`640, 1080, 1920`) | **62.5% reduction** per responsive image |
| **Thumbnail Dimensions** | 8 image sizes | 4 sizes (`32, 64, 128, 256`) | **50.0% reduction** per thumbnail image |
| **Edge Cache Retention** | 60-second TTL | 31,536,000s (1 year) TTL | **Eliminates redundant monthly re-transformations** |
| **Vector SVGs** | Risk of rasterization | Vectors served directly as raw XML | **100% bypass (0 transformations counted)** |

---

### B. Vercel Edge Cache Headers (`frontend/vercel.json`)
Static images and SVGs now include immutable 1-year cache directives:

```json
{
  "source": "/(.*)\\.(svg|ico|png|jpg|jpeg|webp|avif)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
},
{
  "source": "/_next/static/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```

---

### C. Standardized `<OptimizedImage>` Component (`frontend/src/components/OptimizedImage.tsx`)
Rather than relying on developers to manually specify `unoptimized` on every instance, the `<OptimizedImage>` component implements automated heuristics:

1. **Automatic Unoptimized Detection**:
   - Any image source ending with `.svg` or starting with `data:image/svg` is automatically marked `unoptimized={true}`.
   - Small icons and thumbnails with `width <= 64` and `height <= 64` default to `unoptimized={true}`, because optimizing a sub-2KB file yields negligible compression but consumes 1 full transformation.
2. **Quota Failure Self-Healing (`onError`)**:
   - If Vercel returns HTTP 402 (Quota Exceeded) or 500 when attempting to optimize an asset, the component catches the error and **instantly switches to direct raw asset serving with `unoptimized={true}`**.
   - If the asset cannot be resolved at all, it renders an accessible fallback element with the provided `alt` text rather than displaying a broken image icon.
3. **Core Web Vitals & Zero Layout Shift (CLS = 0)**:
   - Enforces explicit `width` and `height` (or `fill` with intrinsic container aspect ratio).
   - Automatically computes responsive `sizes` (`(max-width: 768px) 100vw, 50vw`) to prevent the browser from defaulting to full-viewport widths.

---

## 3. Brand & Mobile Validation

The navigation brand header now employs `<OptimizedImage>`:
```tsx
<OptimizedImage
  src="/icon.svg"
  alt="AI Data Contract Monitor Brand Icon"
  width={26}
  height={26}
  priority
  unoptimized
/>
```
- **Tested Viewports**: 320px (iPhone SE), 375px (iPhone 13), 768px (iPad Mini), 1024px (iPad Pro), 1440px (Desktop).
- **Network Payload**: `icon.svg` is transferred as 1.4 KB compressed vector data directly from the Vercel edge cache (bypassing `/_next/image` completely).
- **Layout Stability**: 0 Cumulative Layout Shift (CLS) across all screen sizes.

---

## 4. Guidelines for Adding Future Assets

When adding new images or visual assets to the frontend, follow these rules:

1. **Icons & Glyphs**:
   - Always use inline vector icons from `lucide-react` or SVGs.
   - Never run SVGs through `next/image` without `unoptimized`.
2. **Small Thumbnails & Avatars (<= 64px)**:
   - Use `<OptimizedImage width={48} height={48} unoptimized />`.
   - The payload difference is under 1 KB, and saves 1 transformation per user session.
3. **Hero Photography & Large Banners**:
   - Use `<OptimizedImage src="/hero.webp" width={1200} height={600} priority sizes="(max-width: 768px) 100vw, 1200px" />`.
   - Allow Next.js to generate AVIF/WebP responsive variants at `640`, `1080`, and `1920` px.
4. **Pre-Optimization**:
   - Compress all PNG/JPEG assets to WebP or AVIF prior to placing them in `public/`.
   - Use tools like `cwebp` or Squoosh to ensure base assets are already optimized at rest.

---

## 5. Verification Commands & Results

| Check | Command | Result |
| :--- | :--- | :--- |
| **Unit Tests** | `npm run test:frontend` | **PASS**: 3 test suites, 12 tests passed (including `OptimizedImage.spec.tsx`). |
| **Full Test Suite** | `npm run test` | **PASS**: 8 test suites, 31 tests passed (19 backend + 12 frontend). |
| **Code Linting** | `npm run lint` | **PASS**: 0 warnings, 0 errors. |
| **Production Build** | `npm run build:frontend` | **PASS**: `next build` compiled all routes statically with 0 errors. |
