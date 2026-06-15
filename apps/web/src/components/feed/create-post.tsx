'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@community/shared';

export function CreatePost() {
  const [content, setContent] = useState('');
  const [focused, setFocused] = useState(false);
  const { user } = useAuth();
  const createPost = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await createPost.mutateAsync(content.trim());
    setContent('');
    setFocused(false);
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--theme-card)',
        border: '1px solid var(--theme-border)',
      }}
    >
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={user?.avatarUrl || undefined} />
          <AvatarFallback className="text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
        </Avatar>
        <form onSubmit={handleSubmit} className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Share something with the community..."
            rows={focused ? 4 : 2}
            className="transition-all duration-200"
          />
          {focused && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setContent(''); setFocused(false); }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!content.trim() || createPost.isPending}>
                {createPost.isPending ? (
                  <><Loader2 size={14} className="mr-1.5 animate-spin" />Posting...</>
                ) : (
                  <><Send size={14} className="mr-1.5" />Post</>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
