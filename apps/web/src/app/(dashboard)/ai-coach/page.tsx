'use client';

import { useState, useRef, useEffect } from 'react';
import { useAiCoachStatus, useAiCoachChat } from '@/hooks/use-ai-coach';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'How can I improve my leadership skills?',
  'I struggle with work-life balance. Any tips?',
  'Help me build better daily habits.',
  'How do I handle difficult conversations with my team?',
];

export default function AiCoachPage() {
  const { data: status, isLoading: statusLoading } = useAiCoachStatus();
  const chatMutation = useAiCoachChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await chatMutation.mutateAsync({
        message: text.trim(),
        history: messages.slice(-10),
      });
      setMessages([...newMessages, { role: 'assistant', content: response.message }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
  }

  if (!status?.available) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'rgba(197,168,128,0.1)' }}>
          <Bot size={28} style={{ color: 'var(--theme-primary)' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>AI Coach Coming Soon</h2>
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          The AI Coach feature is not yet configured on this platform. Contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(197,168,128,0.15)' }}>
          <Sparkles size={20} style={{ color: 'var(--theme-primary)' }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Coach</h2>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Your virtual leadership development coach</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Ask me anything about leadership, personal development, or your GROWTH assessment results.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs p-3 rounded-lg transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(197,168,128,0.15)' }}>
                <Bot size={16} style={{ color: 'var(--theme-primary)' }} />
              </div>
            )}
            <div
              className="max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap"
              style={{
                background: msg.role === 'user' ? 'var(--theme-primary)' : 'var(--theme-card)',
                color: msg.role === 'user' ? 'var(--theme-background)' : 'var(--theme-text)',
                border: msg.role === 'assistant' ? '1px solid var(--theme-border)' : 'none',
              }}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <User size={16} style={{ color: 'var(--theme-text-muted)' }} />
              </div>
            )}
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(197,168,128,0.15)' }}>
              <Bot size={16} style={{ color: 'var(--theme-primary)' }} />
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--theme-text-muted)' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background: 'var(--theme-card)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || chatMutation.isPending}
            className="self-end"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
