'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import type { Poll } from '@community/shared';

interface PollCardProps {
  poll: Poll;
  postId: string;
}

export function PollCard({ poll, postId }: PollCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userVotedOptionId = poll.votes?.[0]?.optionId ?? poll.options.find((o) => o.votes?.length)?.id;
  const [optimisticVote, setOptimisticVote] = useState<string | null>(userVotedOptionId ?? null);

  const hasEnded = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;
  const totalVotes = poll.options.reduce((sum, o) => sum + o._count.votes, 0);

  const vote = useMutation({
    mutationFn: async (optionId: string) => {
      if (optimisticVote === optionId) {
        await apiClient.delete(`/posts/${postId}/poll/vote`);
        return null;
      }
      const { data } = await apiClient.post(`/posts/${postId}/poll/vote`, { optionId });
      return data;
    },
    onMutate: (optionId) => {
      setOptimisticVote((prev) => (prev === optionId ? null : optionId));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const pct = (count: number) =>
    totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

  return (
    <div
      className="rounded-lg p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--theme-border)' }}
    >
      <div className="flex items-start gap-2">
        <BarChart3 size={15} style={{ color: 'var(--theme-primary)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
          {poll.question}
        </p>
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const isVoted = optimisticVote === option.id;
          const percentage = pct(option._count.votes);
          const canVote = !!user && !hasEnded;

          return (
            <button
              key={option.id}
              disabled={!canVote || vote.isPending}
              onClick={() => canVote && vote.mutate(option.id)}
              className="w-full text-left rounded-md overflow-hidden relative transition-opacity disabled:opacity-60"
              style={{ border: `1px solid ${isVoted ? 'var(--theme-primary)' : 'var(--theme-border)'}` }}
            >
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  background: isVoted
                    ? 'rgba(197,168,128,0.18)'
                    : 'rgba(255,255,255,0.04)',
                }}
              />
              <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                <span className="flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                  {isVoted && (
                    <CheckCircle2 size={13} style={{ color: 'var(--theme-primary)', flexShrink: 0 }} />
                  )}
                  {option.text}
                </span>
                <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--theme-text-muted)' }}>
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {hasEnded ? (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Poll ended
          </span>
        ) : poll.endsAt ? (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Ends {new Date(poll.endsAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>
    </div>
  );
}
