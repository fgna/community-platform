'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/page-header';
import { CreatePost } from '@/components/feed/create-post';
import { PostCard } from '@/components/feed/post-card';
import { PostSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { IntroductionBanner } from '@/components/feed/introduction-banner';
import { useFeed } from '@/hooks/use-feed';
import apiClient from '@/lib/api-client';

export default function FeedPage() {
  const { data, isLoading } = useFeed(1, 50);
  const [introType, setIntroType] = useState<'INTRODUCTION' | undefined>(undefined);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('intro-banner-dismissed') === '1';
    }
    return false;
  });

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/users/me').then((r) => r.data),
    staleTime: 60_000,
  });

  const showBanner = profile && !profile.hasIntroduced && !dismissed;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('intro-banner-dismissed', '1');
  };

  const handleIntroduce = () => {
    setIntroType('INTRODUCTION');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Community Feed" description="Connect and share with the community" />
      {showBanner && (
        <IntroductionBanner onIntroduce={handleIntroduce} onDismiss={handleDismiss} />
      )}
      <CreatePost key={introType ?? 'default'} initialType={introType} initialFocused={!!introType} />
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </div>
      ) : data?.data?.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No posts yet" description="Be the first to share something with the community!" />
      ) : (
        <div className="space-y-4">
          {data?.data?.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
