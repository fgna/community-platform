'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, EyeOff, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, timeAgo } from '@community/shared';
import type { Post } from '@community/shared';

function useAdminPosts(showHidden: boolean) {
  return useQuery({
    queryKey: ['admin', 'posts', showHidden],
    queryFn: () =>
      apiClient.get('/admin/posts', { params: { showHidden, limit: 50 } }).then((r) => r.data),
  });
}

export default function ModerationPage() {
  const [showHidden, setShowHidden] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminPosts(showHidden);

  const toggleHide = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      apiClient.patch(`/admin/posts/${id}/hide`, { hidden }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] }),
  });

  const posts: Post[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Content Moderation" description="Review and moderate community posts" icon={Flag} />

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant={showHidden ? 'default' : 'outline'}
          onClick={() => setShowHidden(!showHidden)}
          style={showHidden ? { background: 'var(--theme-primary)', color: 'var(--theme-background)' } : {}}
        >
          {showHidden ? <Eye size={14} className="mr-2" /> : <EyeOff size={14} className="mr-2" />}
          {showHidden ? 'Showing Hidden' : 'Show Hidden'}
        </Button>
        <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          {data?.total ?? 0} posts total
        </span>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--theme-text-muted)' }}>
            <Flag size={32} className="mx-auto mb-3 opacity-30" />
            <p>No posts to moderate</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl p-4 flex items-start gap-4"
              style={{
                background: post.isHidden ? 'rgba(239,68,68,0.05)' : 'var(--theme-card)',
                border: `1px solid ${post.isHidden ? 'rgba(239,68,68,0.2)' : 'var(--theme-border)'}`,
              }}
            >
              <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                <AvatarFallback style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)', fontSize: '11px' }}>
                  {getInitials(post.author?.name ?? 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                    {post.author?.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {timeAgo(post.createdAt)}
                  </span>
                  {post.isHidden && (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs">Hidden</Badge>
                  )}
                  {post.isPinned && (
                    <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs">Pinned</Badge>
                  )}
                </div>
                <p className="text-sm line-clamp-2" style={{ color: post.isHidden ? 'var(--theme-text-muted)' : 'var(--theme-text)' }}>
                  {post.content}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="flex-shrink-0"
                onClick={() => toggleHide.mutate({ id: post.id, hidden: !post.isHidden })}
              >
                {post.isHidden ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
                {post.isHidden ? 'Unhide' : 'Hide'}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
