import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OptimizedImage } from './OptimizedImage';

describe('OptimizedImage Component', () => {
  it('renders correctly with given src and alt text', () => {
    render(
      <OptimizedImage
        src="/icon.svg"
        alt="Data Contract Icon"
        width={32}
        height={32}
      />,
    );

    const img = screen.getByAltText('Data Contract Icon');
    expect(img).toBeInTheDocument();
  });

  it('automatically sets unoptimized for SVG assets to prevent Vercel transformations', () => {
    render(
      <OptimizedImage
        src="/assets/diagram.svg"
        alt="Architecture Diagram"
        width={400}
        height={300}
      />,
    );

    const img = screen.getByAltText('Architecture Diagram');
    // For unoptimized images, next/image renders src directly without /_next/image proxy
    expect(img.getAttribute('src')).toContain('/assets/diagram.svg');
    expect(img.getAttribute('src')).not.toContain('/_next/image');
  });

  it('automatically sets unoptimized for small icon dimensions (<= 64px)', () => {
    render(
      <OptimizedImage
        src="/assets/small-badge.png"
        alt="Status Badge"
        width={48}
        height={48}
      />,
    );

    const img = screen.getByAltText('Status Badge');
    expect(img.getAttribute('src')).toContain('/assets/small-badge.png');
    expect(img.getAttribute('src')).not.toContain('/_next/image');
  });

  it('renders fallback image if primary image fails to load', () => {
    render(
      <OptimizedImage
        src="/missing-image.png"
        fallbackSrc="/icon.svg"
        alt="Fallback Test"
        width={64}
        height={64}
      />,
    );

    const img = screen.getByAltText('Fallback Test');
    // Trigger error twice: first switches to bypass, second engages fallback
    fireEvent.error(img);
    fireEvent.error(img);

    const fallbackImg = screen.getByAltText('Fallback Test');
    expect(fallbackImg.getAttribute('src')).toContain('/icon.svg');
    expect(fallbackImg.getAttribute('src')).not.toContain('/_next/image');
  });

  it('renders accessible text container if all sources fail', () => {
    render(
      <OptimizedImage
        src="/broken.png"
        alt="Broken Asset Description"
        width={100}
        height={100}
        unoptimized={true}
      />,
    );

    const img = screen.getByAltText('Broken Asset Description');
    fireEvent.error(img);

    expect(screen.getByRole('img', { name: 'Broken Asset Description' })).toBeInTheDocument();
  });
});
