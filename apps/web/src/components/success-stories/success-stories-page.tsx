'use client';

import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useFeed } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/feed/post-card';
import { CreatePost } from '@/components/feed/create-post';

export function SuccessStoriesPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useFeed(1, 50, 'SUCCESS_STORY');
  const [showCompose, setShowCompose] = useState(false);

  const posts = data?.data;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}
          >
            <Trophy size={20} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
              Success Stories
            </h1>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Celebrate wins and inspire the community
            </p>
          </div>
        </div>
        {user && (
          <Button
            size="sm"
            onClick={() => setShowCompose(!showCompose)}
            style={{ background: '#a855f7', color: '#fff' }}
          >
            <Trophy size={14} className="mr-1.5" />
            Share Your Story
          </Button>
        )}
      </div>

      {/* Compose area */}
      {showCompose && user && (
        <CreatePost initialType="SUCCESS_STORY" initialFocused />
      )}

      {/* Stories list */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </CardContent>
          </Card>
        ))
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p style={{ color: 'var(--theme-danger)' }}>Failed to load success stories. Please try again.</p>
          </CardContent>
        </Card>
      ) : !posts?.length ? (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <Trophy size={40} className="mx-auto" style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }} />
            <p className="text-lg font-medium" style={{ color: 'var(--theme-text)' }}>
              No success stories yet
            </p>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Be the first to share a win with the community!
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
