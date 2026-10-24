import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Data Contract & Schema Drift Monitor',
  description:
    'AI-assisted data contract monitoring that detects schema and data-quality drift, maps affected consumers, and proposes explainable migration plans with approval gates.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  authors: [{ name: 'Rishank Kesarwani' }],
  keywords: [
    'Data Contracts',
    'Schema Drift',
    'Data Quality',
    'Schema Evolution',
    'Data Governance',
    'Consumer Impact',
    'AI Migration Planner',
  ],
};

export const viewport: Viewport = {
  themeColor: '#080c15',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
