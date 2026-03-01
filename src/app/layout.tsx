import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'okg.me - Premium URL Shortener',
  description: 'A high-performance URL shortener with a custom glass rose-eclipse theme.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="main-container">
          {children}
        </main>
      </body>
    </html>
  );
}
