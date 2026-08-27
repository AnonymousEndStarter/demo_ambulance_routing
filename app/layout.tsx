// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Emergency Dispatch OS',
  description: 'Multi-fleet dynamic emergency dispatch platform powered by OpenStreetMap & Hungarian Optimization',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}