'use client';

import { useTier } from '@/hooks/use-tier';
import { UpgradePrompt } from './upgrade-prompt';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const { data: tierInfo, isLoading } = useTier();

  // When billing is not enabled, all content is accessible
  if (process.env.NEXT_PUBLIC_ENABLE_BILLING !== 'true') {
    return <>{children}</>;
  }

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
