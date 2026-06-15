'use client';

import { useState, useEffect } from 'react';
import { useFeed, useCreatePost, useTrendingFeed } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from './post-card';
import { Loader2, Send, Eye, PenLine, Clock, TrendingUp, X } from 'lucide-react';
import { getInitials } from '@community/shared';
import { renderMarkdown, extractHashtags } from '@/lib/markdown';

export function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'latest' | 'trending'>('latest');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Listen for hashtag clicks from PostCard
  useEffect(() => {
    const handler = (e: Event) => setActiveTag((e as CustomEvent).detail);
    window.addEventListener('feed:hashtag', handler);
    return () => window.removeEventListener('feed:hashtag', handler);
  }, []);
  const { data, isLoading, error } = useFeed();
  const { data: trendingData, isLoading: trendingLoading } = useTrendingFeed();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);

  const rawPosts = tab === 'latest' ? data?.data : trendingData?.data;
  const activePosts = activeTag
    ? rawPosts?.filter(p => extractHashtags(p.content).includes(activeTag))
    : rawPosts;
  const activeLoading = tab === 'latest' ? isLoading : trendingLoading;
  const activeError = tab === 'latest' ? error : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await createPost.mutateAsync(content.trim());
    setContent('');
    setPreview(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Feed tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
        {([['latest', 'Latest', Clock], ['trending', 'Trending', TrendingUp]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === key ? 'var(--theme-primary)' : 'transparent',
              color: tab === key ? 'var(--theme-background)' : 'var(--theme-text-muted)',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Active hashtag filter */}
      {activeTag && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Filtered by</span>
          <button
            onClick={() => setActiveTag(null)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium"
            style={{ background: 'rgba(197,168,128,0.12)', color: 'var(--theme-primary)' }}
          >
            {activeTag} <X size={11} />
          </button>
        </div>
      )}

      {/* Compose — only on Latest tab */}
      {user && tab === 'latest' && (
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
      {activeLoading ? (
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
      ) : activeError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p style={{ color: 'var(--theme-danger)' }}>Failed to load feed. Please try again.</p>
          </CardContent>
        </Card>
      ) : !activePosts?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
              {tab === 'trending' ? 'No trending posts this week' : 'No posts yet'}
            </p>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              {tab === 'trending' ? 'Check back later or switch to Latest.' : 'Be the first to share something with the community!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        activePosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
