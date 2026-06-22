'use client';

import { useState } from 'react';
import { Loader2, Plus, X, Calendar, ThumbsUp, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/common/page-header';
import { useAuth } from '@/hooks/use-auth';
import {
  useEventProposals,
  useCreateProposal,
  useVoteProposal,
  useRemoveVote,
  useCloseProposal,
  useDeleteProposal,
} from '@/hooks/use-event-proposals';

export function EventProposalsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data, isLoading } = useEventProposals();
  const createMutation = useCreateProposal();
  const voteMutation = useVoteProposal();
  const removeMutation = useRemoveVote();
  const closeMutation = useCloseProposal();
  const deleteMutation = useDeleteProposal();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dates, setDates] = useState<string[]>(['', '']);

  const addDate = () => setDates((d) => [...d, '']);
  const removeDate = (i: number) => setDates((d) => d.filter((_, idx) => idx !== i));
  const updateDate = (i: number, val: string) =>
    setDates((d) => d.map((v, idx) => (idx === i ? val : v)));

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDates(['', '']);
    setShowForm(false);
  };

  const handleCreate = async () => {
    const validDates = dates.filter((d) => d.trim());
    if (!title.trim() || validDates.length < 2) return;
    await createMutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      proposedDates: validDates,
    });
    resetForm();
  };

  const handleToggleVote = async (proposalId: string, hasVoted: boolean) => {
    if (hasVoted) {
      await removeMutation.mutateAsync(proposalId);
    } else {
      await voteMutation.mutateAsync({ id: proposalId });
    }
  };

  const handleDateVote = async (proposalId: string, date: string, currentVotes: string[]) => {
    const newVotes = currentVotes.includes(date)
      ? currentVotes.filter((d) => d !== date)
      : [...currentVotes, date];
    await voteMutation.mutateAsync({ id: proposalId, dateVotes: newVotes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
  }

  const proposals = data?.data || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Event Proposals" description="Vote on topics and preferred dates for upcoming events" />
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)} size="sm" variant={showForm ? 'outline' : 'default'}>
            {showForm ? 'Cancel' : <><Plus size={14} className="mr-1" /> New Proposal</>}
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          <Input placeholder="Proposal title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Proposed dates</p>
            {dates.map((d, i) => (
              <div key={i} className="flex gap-2">
                <Input type="datetime-local" value={d} onChange={(e) => updateDate(i, e.target.value)} className="flex-1" />
                {dates.length > 2 && (
                  <button type="button" onClick={() => removeDate(i)} className="p-2 hover:bg-white/5 rounded-md">
                    <X size={14} style={{ color: 'var(--theme-text-muted)' }} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDate} className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded" style={{ color: 'var(--theme-primary)' }}>
              <Plus size={12} /> Add date
            </button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={createMutation.isPending || !title.trim()}>
              {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create Proposal'}
            </Button>
          </div>
        </div>
      )}

      {/* Proposals list */}
      {proposals.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          <Calendar size={28} className="mx-auto mb-3" style={{ color: 'var(--theme-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No proposals yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal: any) => {
            const proposedDates = (proposal.proposedDates as string[]) || [];
            const myDateVotes = (proposal.myDateVotes as string[]) || [];
            const isClosed = proposal.status === 'CLOSED';

            return (
              <div
                key={proposal.id}
                className="rounded-xl p-5 space-y-4"
                style={{
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-border)',
                  opacity: isClosed ? 0.7 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{ color: 'var(--theme-text)' }}>{proposal.title}</h3>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: isClosed ? 'rgba(255,255,255,0.05)' : 'rgba(197,168,128,0.12)',
                          color: isClosed ? 'var(--theme-text-muted)' : 'var(--theme-primary)',
                        }}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    {proposal.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>{proposal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!isClosed && (
                      <Button
                        variant={proposal.hasVoted ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleVote(proposal.id, proposal.hasVoted)}
                        disabled={voteMutation.isPending || removeMutation.isPending}
                      >
                        <ThumbsUp size={12} className="mr-1" />
                        {proposal._count?.votes || 0}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Date options */}
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Preferred dates</p>
                  <div className="flex flex-wrap gap-2">
                    {proposedDates.map((date: string) => {
                      const isVoted = myDateVotes.includes(date);
                      const formatted = new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      });
                      return (
                        <button
                          key={date}
                          type="button"
                          disabled={isClosed}
                          onClick={() => handleDateVote(proposal.id, date, myDateVotes)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: isVoted ? 'rgba(197,168,128,0.15)' : 'rgba(255,255,255,0.03)',
                            color: isVoted ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                            border: isVoted ? '1px solid rgba(197,168,128,0.3)' : '1px solid var(--theme-border)',
                          }}
                        >
                          <Calendar size={10} className="inline mr-1" />
                          {formatted}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                  <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--theme-border)' }}>
                    {!isClosed && (
                      <Button variant="ghost" size="sm" onClick={() => closeMutation.mutate(proposal.id)} disabled={closeMutation.isPending}>
                        <Lock size={12} className="mr-1" /> Close
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(proposal.id)} disabled={deleteMutation.isPending} className="text-red-400 hover:text-red-300">
                      <Trash2 size={12} className="mr-1" /> Delete
                    </Button>
                  </div>
                )}

                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  by {proposal.createdBy?.name} · {new Date(proposal.createdAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
