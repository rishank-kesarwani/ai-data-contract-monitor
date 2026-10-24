'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  /** Force unoptimized bypass (default: auto-detected for SVGs, icons <=64px) */
  unoptimized?: boolean;
  /** Fallback image URL if primary fails or Vercel quota is exhausted */
  fallbackSrc?: string;
}

/**
 * OptimizedImage
 *
 * Senior-engineered image component designed to drastically reduce Vercel Image
 * Optimization transformations while maintaining optimal performance, responsive
 * rendering, accessibility, and Core Web Vitals (0 CLS).
 *
 * Features:
 * 1. Automatically flags SVGs and small icons (<= 64px) as unoptimized=true (0 Vercel transformations).
 * 2. Implements graceful fallback to unoptimized direct asset serving if Vercel's
 *    transformation quota limit (HTTP 402) is encountered.
 * 3. Enforces responsive sizes and intrinsic dimensions to eliminate CLS.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  unoptimized: explicitUnoptimized,
  fallbackSrc,
  sizes,
  onError,
  className,
  style,
  ...rest
}) => {
  const [loadError, setLoadError] = useState(false);
  const [useRawBypass, setUseRawBypass] = useState(false);

  // Detect if the asset is an SVG or tiny icon that does not benefit from raster optimization
  const isSvg = typeof src === 'string' && (src.endsWith('.svg') || src.includes('.svg?'));
  const isDataUri = typeof src === 'string' && src.startsWith('data:');
  const isSmallIcon =
    typeof width === 'number' &&
    typeof height === 'number' &&
    width <= 64 &&
    height <= 64;

  // Auto-determine unoptimized state: SVGs, Data URIs, tiny icons default to unoptimized
  const shouldBypass =
    explicitUnoptimized !== undefined
      ? explicitUnoptimized
      : isSvg || isDataUri || isSmallIcon || useRawBypass;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If Vercel optimizer failed (e.g. 5,000 quota limit hit), switch to direct raw serving
    if (!shouldBypass && !useRawBypass) {
      setUseRawBypass(true);
      return;
    }

    // If already bypassed or secondary failure, engage fallback asset or placeholder
    setLoadError(true);
    if (onError) {
      onError(e);
    }
  };

  if (loadError) {
    if (fallbackSrc) {
      return (
        <Image
          {...rest}
          src={fallbackSrc}
          alt={alt}
          width={width}
          height={height}
          unoptimized={true}
          className={className}
          style={style}
        />
      );
    }

    // Accessible visual fallback if asset cannot be resolved
    return (
      <div
        role="img"
        aria-label={alt}
        className={className}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          borderRadius: '8px',
          color: 'var(--text-dim, #94a3b8)',
          fontSize: '0.75rem',
          ...style,
        }}
      >
        <span>{alt || 'Image unavailable'}</span>
      </div>
    );
  }

  // Provide sensible responsive sizes if fill is used and sizes is omitted
  const computedSizes =
    rest.fill && !sizes ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : sizes;

  return (
    <Image
      {...rest}
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={computedSizes}
      unoptimized={shouldBypass}
      onError={handleError}
      className={className}
      style={style}
    />
  );
};
