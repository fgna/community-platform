'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'community-cookie-consent';

type ConsentValue = 'accepted' | 'declined' | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue;
    if (stored === 'accepted' || stored === 'declined') {
      setConsent(stored);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setConsent('accepted');
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setConsent('declined');
  };

  if (!mounted || consent !== null) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl p-5 shadow-2xl"
      style={{
        background: 'var(--theme-surface)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--theme-border)',
      }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(197,168,128,0.15)' }}
        >
          <Cookie size={20} style={{ color: 'var(--theme-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
            Cookie Preferences
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
            We use essential cookies to keep you signed in and remember your preferences. We do not
            track you for advertising purposes. By continuing you accept our use of cookies.{' '}
            <a
              href="/privacy"
              className="underline"
              style={{ color: 'var(--theme-primary)' }}
            >
              Privacy Policy
            </a>
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAccept}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
                background: 'transparent',
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
