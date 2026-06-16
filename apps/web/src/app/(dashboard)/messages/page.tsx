'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConversations, useMessages, useSendMessage } from '@/hooks/use-messages';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getInitials, formatDate } from '@community/shared';
import type { Conversation } from '@community/shared';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

function getOtherParticipant(conv: Conversation, myId: string) {
  return conv.participants.find(p => p.userId !== myId)?.user;
}

function ConversationList({
  conversations,
  selectedId,
  myId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  myId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
          Messages
        </h2>
      </div>
      {conversations.length === 0 && (
        <p className="p-4 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          No conversations yet. Start one from a member's profile.
        </p>
      )}
      {conversations.map(conv => {
        const other = getOtherParticipant(conv, myId);
        const lastMsg = conv.messages[0];
        const isSelected = conv.id === selectedId;
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'flex items-center gap-3 p-4 w-full text-left transition-colors hover:bg-white/5',
              isSelected && 'bg-white/5',
            )}
            style={{ borderBottom: '1px solid var(--theme-border)' }}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={other?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{getInitials(other?.name ?? '?')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>
                {other?.name ?? 'Unknown'}
              </p>
              {lastMsg && (
                <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                  {lastMsg.content}
                </p>
              )}
            </div>
            {lastMsg && (
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
                {formatDate(lastMsg.createdAt, { month: 'short', day: 'numeric', year: undefined })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MessageThread({
  conversationId,
  myId,
  otherName,
  onBack,
}: {
  conversationId: string;
  myId: string;
  otherName?: string;
  onBack: () => void;
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useMessages(conversationId);
  const send = useSendMessage(conversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    send.mutate(trimmed);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header with back button on mobile */}
      <div
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--theme-border)' }}
      >
        <button
          className="md:hidden p-1.5 rounded-md hover:bg-white/5 flex-shrink-0"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} style={{ color: 'var(--theme-text-muted)' }} />
        </button>
        {otherName && (
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
            {otherName}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading…</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(data?.data ?? []).map(msg => {
            const isMine = msg.senderId === myId;
            return (
              <div key={msg.id} className={cn('flex gap-2 items-end', isMine && 'flex-row-reverse')}>
                {!isMine && (
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={msg.sender.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(msg.sender.name)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className="max-w-[75%] px-3 py-2 rounded-2xl text-sm"
                  style={{
                    background: isMine ? 'var(--theme-primary)' : 'var(--theme-card)',
                    color: isMine ? 'var(--theme-background)' : 'var(--theme-text)',
                    borderBottomRightRadius: isMine ? 4 : undefined,
                    borderBottomLeftRadius: !isMine ? 4 : undefined,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div
        className="p-3 flex items-center gap-2"
        style={{ borderTop: '1px solid var(--theme-border)' }}
      >
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || send.isPending}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

function MessagesPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('conv'));
  const { data: conversations = [] } = useConversations();

  if (!user) return null;

  const selectedConv = conversations.find(c => c.id === selectedId);
  const otherName = selectedConv ? getOtherParticipant(selectedConv, user.id)?.name : undefined;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in" style={{ height: 'calc(100vh - 9rem)' }}>
      <div
        className="rounded-2xl overflow-hidden flex h-full"
        style={{
          border: '1px solid var(--theme-border)',
          background: 'var(--theme-surface)',
        }}
      >
        {/* Conversation list — full width on mobile when no thread selected, hidden when thread open */}
        <div
          className={cn(
            'flex-shrink-0 md:w-72',
            selectedId ? 'hidden md:block' : 'w-full',
          )}
          style={{ borderRight: '1px solid var(--theme-border)' }}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            myId={user.id}
            onSelect={setSelectedId}
          />
        </div>

        {/* Thread — full width on mobile, flex-1 on desktop */}
        <div className={cn('flex-1 flex flex-col', !selectedId && 'hidden md:flex')}>
          {selectedId ? (
            <MessageThread
              conversationId={selectedId}
              myId={user.id}
              otherName={otherName}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <MessageSquare size={40} style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesPageInner />
    </Suspense>
  );
}
