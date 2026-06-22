'use client';

import { useTier } from '@/hooks/use-tier';
import { UpgradePrompt } from './upgrade-prompt';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const { data: tierInfo, isLoading } = useTier();

  if (isLoading) {
    return (
      <div className="animate-pulse h-32 rounded-xl" style={{ background: 'var(--theme-card)' }} />
    );
  }

  if (!tierInfo?.isPremium) {
    return <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}
