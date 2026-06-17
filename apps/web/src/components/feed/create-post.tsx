'use client';

import { useState } from 'react';
import { Send, Loader2, BarChart3, Plus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@community/shared';

interface PollDraft {
  question: string;
  options: string[];
}

export function CreatePost() {
  const [content, setContent] = useState('');
  const [focused, setFocused] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [poll, setPoll] = useState<PollDraft>({ question: '', options: ['', ''] });
  const { user } = useAuth();
  const createPost = useCreatePost();

  const resetForm = () => {
    setContent('');
    setFocused(false);
    setShowPoll(false);
    setPoll({ question: '', options: ['', ''] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const pollPayload =
      showPoll && poll.question.trim() && poll.options.filter((o) => o.trim()).length >= 2
        ? {
            question: poll.question.trim(),
            options: poll.options.filter((o) => o.trim()),
          }
        : undefined;

    try {
      await createPost.mutateAsync({ content: content.trim(), poll: pollPayload });
      resetForm();
    } catch {
      // mutation error — feed will refetch via onSettled
    }
  };

  const addPollOption = () => {
    if (poll.options.length < 10) {
      setPoll((p) => ({ ...p, options: [...p.options, ''] }));
    }
  };

  const removePollOption = (index: number) => {
    if (poll.options.length > 2) {
      setPoll((p) => ({ ...p, options: p.options.filter((_, i) => i !== index) }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setPoll((p) => {
      const options = [...p.options];
      options[index] = value;
      return { ...p, options };
    });
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

          {focused && showPoll && (
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)' }}
            >
              <Input
                placeholder="Poll question..."
                value={poll.question}
                onChange={(e) => setPoll((p) => ({ ...p, question: e.target.value }))}
              />
              {poll.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1"
                  />
                  {poll.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePollOption(i)}
                      className="p-2 rounded-md hover:bg-white/5"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {poll.options.length < 10 && (
                <button
                  type="button"
                  onClick={addPollOption}
                  className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  <Plus size={12} />
                  Add option
                </button>
              )}
            </div>
          )}

          {focused && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPoll((v) => !v)}
                className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md hover:bg-white/5 transition-colors"
                style={{ color: showPoll ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}
              >
                <BarChart3 size={13} />
                Poll
              </button>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
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
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
