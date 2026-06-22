'use client';

import { useState } from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { CreatePost } from '@/components/feed/create-post';
import { PostCard } from '@/components/feed/post-card';
import { PostSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { useFeed } from '@/hooks/use-feed';

export function QAPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useFeed(1, 50, 'QUESTION');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Questions & Answers"
        description="Ask questions and get answers from the community"
        icon={HelpCircle}
        action={
          <Button
            size="sm"
            onClick={() => setShowCreate((v) => !v)}
            className="gap-1.5"
          >
            <Plus size={14} />
            Ask a Question
          </Button>
        }
      />

      {showCreate && (
        <div className="animate-fade-in">
          <CreatePost initialType="QUESTION" initialFocused />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No questions yet"
          description="Be the first to ask a question and get help from the community!"
          action={
            !showCreate ? (
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
                <Plus size={14} />
                Ask a Question
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {data?.data?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
