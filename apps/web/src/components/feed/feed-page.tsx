'use client';

import { useState } from 'react';
import { useFeed, useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from './post-card';
import { Loader2, Send, Eye, PenLine } from 'lucide-react';
import { getInitials } from '@community/shared';
import { renderMarkdown } from '@/lib/markdown';

export function FeedPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useFeed();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await createPost.mutateAsync(content.trim());
    setContent('');
    setPreview(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Compose */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {preview ? (
                    <div
                      className="min-h-[80px] p-3 rounded-lg text-sm leading-relaxed md-content"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--theme-border)',
                        color: 'var(--theme-text)',
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<span style="opacity:0.4">Nothing to preview</span>' }}
                    />
                  ) : (
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share something… supports **bold**, *italic*, `code`, > quotes"
                      className="min-h-[80px]"
                      maxLength={2000}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pl-12">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      color: !preview ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                      background: !preview ? 'rgba(197,168,128,0.1)' : 'transparent',
                    }}
                  >
                    <PenLine size={11} /> Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(true)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      color: preview ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                      background: preview ? 'rgba(197,168,128,0.1)' : 'transparent',
                    }}
                  >
                    <Eye size={11} /> Preview
                  </button>
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {content.length}/2000
                  </span>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || createPost.isPending}
                >
                  {createPost.isPending ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <Send size={14} className="mr-1.5" />
                  )}
                  Post
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
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
            </CardContent>
          </Card>
        ))
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p style={{ color: 'var(--theme-danger)' }}>Failed to load feed. Please try again.</p>
          </CardContent>
        </Card>
      ) : !data?.data?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
              No posts yet
            </p>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Be the first to share something with the community!
            </p>
          </CardContent>
        </Card>
      ) : (
        data.data.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
