'use client';

import { useState, useCallback } from 'react';
import { Send, Loader2, BarChart3, Plus, X, Type, PenLine, HelpCircle, Megaphone, Hand, MessageSquare, Tag, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useCreatePost } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getInitials } from '@community/shared';
import { RichTextEditor } from './rich-text-editor';

type PostType = 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'INTRODUCTION' | 'SUCCESS_STORY';

const POST_TYPES: { value: PostType; label: string; icon: React.ElementType }[] = [
  { value: 'DISCUSSION', label: 'Discussion', icon: MessageSquare },
  { value: 'QUESTION', label: 'Question', icon: HelpCircle },
  { value: 'ANNOUNCEMENT', label: 'Announcement', icon: Megaphone },
  { value: 'INTRODUCTION', label: 'Introduction', icon: Hand },
  { value: 'SUCCESS_STORY', label: 'Success Story', icon: Trophy },
];

interface PollDraft {
  question: string;
  options: string[];
}

type EditorMode = 'plain' | 'rich';

interface CreatePostProps {
  initialType?: PostType;
  initialFocused?: boolean;
}

export function CreatePost({ initialType, initialFocused }: CreatePostProps = {}) {
  const [content, setContent] = useState('');
  const [richContent, setRichContent] = useState('');
  const [focused, setFocused] = useState(initialFocused ?? false);
  const [editorMode, setEditorMode] = useState<EditorMode>('rich');
  const [postType, setPostType] = useState<PostType>(initialType ?? 'DISCUSSION');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [poll, setPoll] = useState<PollDraft>({ question: '', options: ['', ''] });
  const { user } = useAuth();
  const createPost = useCreatePost();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories').then((r) => r.data),
    staleTime: 60_000,
  });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const resetForm = () => {
    setContent('');
    setRichContent('');
    setFocused(false);
    setPostType('DISCUSSION');
    setSelectedCategories([]);
    setShowCategories(false);
    setShowPoll(false);
    setPoll({ question: '', options: ['', ''] });
  };

  const getSubmitContent = () => {
    if (editorMode === 'rich') {
      const stripped = richContent.replace(/<[^>]*>/g, '').trim();
      return stripped ? richContent : '';
    }
    return content.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitContent = getSubmitContent();
    if (!submitContent) return;

    const pollPayload =
      showPoll && poll.question.trim() && poll.options.filter((o) => o.trim()).length >= 2
        ? {
            question: poll.question.trim(),
            options: poll.options.filter((o) => o.trim()),
          }
        : undefined;

    try {
      await createPost.mutateAsync({
        content: submitContent,
        type: postType,
        categoryIds: selectedCategories.length ? selectedCategories : undefined,
        poll: pollPayload,
      });
      resetForm();
    } catch {
      // mutation error — feed will refetch via onSettled
    }
  };

  const handleRichChange = useCallback((html: string) => {
    setRichContent(html);
  }, []);

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

  const hasContent = editorMode === 'rich'
    ? richContent.replace(/<[^>]*>/g, '').trim().length > 0
    : content.trim().length > 0;

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
          {editorMode === 'rich' ? (
            <div onClick={() => setFocused(true)}>
              <RichTextEditor
                content={richContent}
                onChange={handleRichChange}
                placeholder="Share something with the community..."
                compact={!focused}
              />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Share something with the community..."
              rows={focused ? 4 : 2}
              className="transition-all duration-200"
            />
          )}

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
            <>
            {/* Post type selector */}
            <div className="flex gap-1 overflow-x-auto">
              {POST_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPostType(value)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: postType === value ? 'rgba(197,168,128,0.12)' : 'transparent',
                    color: postType === value ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                    border: postType === value ? '1px solid rgba(197,168,128,0.2)' : '1px solid transparent',
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            {/* Category tags */}
            {showCategories && categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: selectedCategories.includes(cat.id) ? (cat.color || 'var(--theme-primary)') + '20' : 'rgba(255,255,255,0.05)',
                      color: selectedCategories.includes(cat.id) ? (cat.color || 'var(--theme-primary)') : 'var(--theme-text-muted)',
                      border: selectedCategories.includes(cat.id) ? `1px solid ${(cat.color || 'var(--theme-primary)')}40` : '1px solid transparent',
                    }}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditorMode(editorMode === 'rich' ? 'plain' : 'rich')}
                  className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--theme-text-muted)' }}
                  title={editorMode === 'rich' ? 'Switch to plain text' : 'Switch to rich editor'}
                >
                  {editorMode === 'rich' ? <Type size={13} /> : <PenLine size={13} />}
                  {editorMode === 'rich' ? 'Plain' : 'Rich'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPoll((v) => !v)}
                  className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md hover:bg-white/5 transition-colors"
                  style={{ color: showPoll ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}
                >
                  <BarChart3 size={13} />
                  Poll
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategories((v) => !v)}
                  className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md hover:bg-white/5 transition-colors"
                  style={{ color: showCategories ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}
                >
                  <Tag size={13} />
                  Tags{selectedCategories.length > 0 && ` (${selectedCategories.length})`}
                </button>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!hasContent || createPost.isPending}>
                  {createPost.isPending ? (
                    <><Loader2 size={14} className="mr-1.5 animate-spin" />Posting...</>
                  ) : (
                    <><Send size={14} className="mr-1.5" />Post</>
                  )}
                </Button>
              </div>
            </div>
          </>
          )}
        </form>
      </div>
    </div>
  );
}
