'use client';

import { useUpgradeTier } from '@/hooks/use-tier';

interface UpgradePromptProps {
  feature: string;
  onClose?: () => void;
}

export function UpgradePrompt({ feature, onClose }: UpgradePromptProps) {
  const upgrade = useUpgradeTier();

  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
    >
      <div
        className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
        style={{ background: 'rgba(197,168,128,0.15)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--theme-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
        Premium Feature
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
        {feature} is available for Premium members. Upgrade to unlock all features.
      </p>
      <div className="flex gap-2 justify-center">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
          >
            Maybe Later
          </button>
        )}
        <button
          onClick={() => upgrade.mutate()}
          disabled={upgrade.isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
        >
          {upgrade.isPending ? 'Upgrading...' : 'Upgrade to Premium'}
        </button>
      </div>
    </div>
  );
}
