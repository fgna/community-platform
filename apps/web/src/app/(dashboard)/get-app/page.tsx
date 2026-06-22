'use client';

import { Smartphone, Download, CheckCircle, Wifi, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Wifi, text: 'Offline access to your content' },
  { icon: Shield, text: 'Secure push notifications' },
  { icon: CheckCircle, text: 'Quick access to journal & feed' },
];

const downloadUrl = process.env.NEXT_PUBLIC_APK_URL || '/api/download-app';

export default function GetAppPage() {
  return (
    <div className="max-w-lg mx-auto py-12 px-4 space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(197,168,128,0.1)' }}
        >
          <Smartphone size={36} style={{ color: 'var(--theme-primary)' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Get the Mobile App
        </h1>
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Take your community on the go with our Android app.
        </p>
      </div>

      <div
        className="rounded-xl p-6 space-y-4"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
      >
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(197,168,128,0.08)' }}
            >
              <f.icon size={16} style={{ color: 'var(--theme-primary)' }} />
            </div>
            <span className="text-sm" style={{ color: 'var(--theme-text)' }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center space-y-3">
        <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
          <a href={downloadUrl} download>
            <Download size={16} />
            Download APK
          </a>
        </Button>
        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Android 8.0+ required &middot; Allow installs from unknown sources in Settings
        </p>
      </div>

      <div
        className="rounded-xl p-5 space-y-3"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
          Installation Steps
        </h2>
        <ol className="space-y-2 text-sm list-decimal list-inside" style={{ color: 'var(--theme-text-muted)' }}>
          <li>Tap <strong style={{ color: 'var(--theme-text)' }}>Download APK</strong> above</li>
          <li>Open the downloaded file</li>
          <li>If prompted, allow installs from this source</li>
          <li>Tap <strong style={{ color: 'var(--theme-text)' }}>Install</strong></li>
          <li>Open the app and sign in with your account</li>
        </ol>
      </div>
    </div>
  );
}
