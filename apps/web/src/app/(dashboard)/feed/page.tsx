'use client';

import { MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { CreatePost } from '@/components/feed/create-post';
import { PostCard } from '@/components/feed/post-card';
import { PostSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { useFeed } from '@/hooks/use-feed';

export default function FeedPage() {
  const { data, isLoading } = useFeed(1, 50);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Community Feed" description="Connect and share with the community" />
      <CreatePost />
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
