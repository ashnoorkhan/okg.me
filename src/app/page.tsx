'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ shortUrl: string, originalUrl: string, slug: string } | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setQrCode(null);
    setCopied(false);

    try {
      const payload: Record<string, string> = { originalUrl: url };
      if (showCustom && customSlug.trim()) {
        payload.customSlug = customSlug.trim();
      }

      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        // This happens if the server returns HTML (like a 500 error page from Next.js/Prisma crashing)
        throw new Error('Our servers are currently unreachable. Please try again later.');
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to shorten URL');
      }

      setResult(data.data);

      // Generate QR Code dynamically on the client
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(data.data.shortUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#171717',
            light: '#ffffff'
          }
        }).then((url: string) => setQrCode(url));
      });

      setUrl('');
      setCustomSlug('');
      setShowCustom(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.container}>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Shorten Your Links. <br />
          <span className={styles.highlight}>Amplify Your Reach.</span>
        </h1>
        <p className={styles.subtitle}>
          The premium URL shortener built for speed, analytics, and elegant design.
          Manage your links like a pro with okg.me.
        </p>
      </section>

      {/* Main Shortener Card */}
      <section className={styles.shortenerSection}>
        <Card glow className={styles.shortenerCard}>
          <form className={styles.formContainer} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <Input
                placeholder="Paste your long link here..."
                type="url"
                required
                className={styles.urlInput}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" size="lg" className={styles.shortenBtn} disabled={loading || !url}>
                {loading ? 'Shortening...' : 'Shorten Now'}
              </Button>
            </div>

            <div className={styles.customOptions}>
              {!showCustom ? (
                <button
                  type="button"
                  className={styles.toggleCustom}
                  onClick={() => setShowCustom(true)}
                >
                  + Options (Custom Alias)
                </button>
              ) : (
                <div className={styles.customSlugContainer} style={{ animation: 'fadeUp 0.3s ease-out' }}>
                  <Input
                    placeholder="Custom alias (optional)"
                    type="text"
                    className={styles.urlInput}
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.toggleCustom}
                    onClick={() => {
                      setShowCustom(false);
                      setCustomSlug('');
                    }}
                    style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}
                  >
                    - Remove Custom Alias
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
          </form>

          {/* Success Result Area */}
          {result && (
            <div className={styles.resultContainer}>
              <div className={styles.resultInfo}>
                <div className={styles.resultDetails}>
                  <p className={styles.originalUrl} title={result.originalUrl}>
                    {result.originalUrl}
                  </p>
                  <a href={result.shortUrl} target="_blank" rel="noreferrer" className={styles.shortUrl}>
                    {result.shortUrl}
                  </a>
                </div>
                <div className={styles.resultActions}>
                  <Button variant="secondary" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  {qrCode && (
                    <a href={qrCode} download={`qr-${result.slug}.png`} className={styles.downloadQrBtn}>
                      Download QR
                    </a>
                  )}
                </div>
              </div>
              {qrCode && (
                <div className={styles.qrCodeWrapper}>
                  <img src={qrCode} alt="QR Code" className={styles.qrCode} />
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* Basic Features preview */}
      <section className={styles.features}>
        <div className={styles.featureItem}>
          <h3>⚡ Lightning Fast</h3>
          <p>Redirects optimized with Redis for sub-100ms response times globally.</p>
        </div>
        <div className={styles.featureItem}>
          <h3>📊 Advanced Analytics</h3>
          <p>Track unique clicks, devices, and geographic data elegantly.</p>
        </div>
        <div className={styles.featureItem}>
          <h3>🔒 Enhanced Security</h3>
          <p>Links are safe, secure, and monitored to prevent malicious drops.</p>
        </div>
      </section>

    </div>
  );
}
