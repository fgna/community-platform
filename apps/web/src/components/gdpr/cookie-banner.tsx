'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem('cookie-consent')) return;
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = async (analytics: boolean, marketing: boolean) => {
    const sessionId = Math.random().toString(36).substring(2);
    localStorage.setItem('cookie-consent', JSON.stringify({ analytics, marketing, sessionId }));

    try {
      if (isAuthenticated) {
        await apiClient.post('/gdpr/consent', { analytics, marketing });
      } else {
        await apiClient.post('/gdpr/consent/anonymous', { sessionId, analytics, marketing });
      }
    } catch {
      // Non-critical
    }

    setShow(false);
  };

  if (!mounted) return null;  // suppress hydration flash
  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 rounded-xl p-4 shadow-2xl animate-fade-in"
      style={{
        background: 'var(--theme-surface)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
          Cookie Preferences
        </p>
        <button onClick={() => handleAccept(false, false)} className="flex-shrink-0">
          <X size={16} style={{ color: 'var(--theme-text-muted)' }} />
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--theme-text-muted)' }}>
        We use cookies to improve your experience. You can choose which types to accept. Essential cookies are always active.
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          onClick={() => handleAccept(false, false)}
        >
          Essential only
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs"
          onClick={() => handleAccept(true, true)}
        >
          Accept all
        </Button>
      </div>
    </div>
  );
}
