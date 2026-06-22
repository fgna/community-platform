'use client';

import { useTier } from '@/hooks/use-tier';
import { useBillingCheckout, useBillingPortal } from '@/hooks/use-billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Loader2 } from 'lucide-react';

const FREE_FEATURES = [
  'Community feed (limited posts)',
  'Browse courses',
  'View events',
  'Member directory',
  'Basic profile',
];

const PREMIUM_FEATURES = [
  'Unlimited posts & comments',
  'All courses & lessons',
  'Event RSVPs & calendar invites',
  'Private messaging',
  'Learning groups',
  'Journal & assessments',
  'File uploads',
  'Interest-based feed',
  'Priority support',
];

export default function PricingPage() {
  const { data: tier } = useTier();
  const checkout = useBillingCheckout();
  const portal = useBillingPortal();
  const isPremium = tier?.isPremium;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Choose Your Plan
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--theme-text-muted)' }}>
          Unlock the full potential of the community with Premium.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free</CardTitle>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--theme-text)' }}>
              $0<span className="text-sm font-normal" style={{ color: 'var(--theme-text-muted)' }}>/month</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                <Check size={14} className="flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }} />
                {f}
              </div>
            ))}
            {!isPremium && (
              <div className="pt-3">
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={{ border: '2px solid var(--theme-primary)' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Premium</CardTitle>
              <Star size={16} style={{ color: 'var(--theme-primary)', fill: 'var(--theme-primary)' }} />
            </div>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--theme-text)' }}>
              Contact admin
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {PREMIUM_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--theme-text)' }}>
                <Check size={14} className="flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                {f}
              </div>
            ))}
            <div className="pt-3">
              {isPremium ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => portal.mutate()}
                  disabled={portal.isPending}
                >
                  {portal.isPending ? (
                    <><Loader2 size={14} className="animate-spin mr-2" />Loading...</>
                  ) : 'Manage Subscription'}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? (
                    <><Loader2 size={14} className="animate-spin mr-2" />Redirecting...</>
                  ) : 'Upgrade to Premium'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
