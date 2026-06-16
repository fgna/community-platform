'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, Trash2, Copy, Check, Clock, UserCheck } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@community/shared';

interface Invite {
  id: string;
  email: string;
  token: string;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; name: string } | null;
}

function useInvites(page: number) {
  return useQuery({
    queryKey: ['admin', 'invites', page],
    queryFn: () => apiClient.get('/admin/invites', { params: { page, limit: 20 } }).then((r) => r.data),
  });
}

function InviteStatusBadge({ invite }: { invite: Invite }) {
  const now = new Date();
  const expired = new Date(invite.expiresAt) < now;

  if (invite.usedAt) {
    return <Badge className="bg-green-500/15 text-green-400 border-green-500/20"><UserCheck size={10} className="mr-1" />Used</Badge>;
  }
  if (expired) {
    return <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/20"><Clock size={10} className="mr-1" />Expired</Badge>;
  }
  return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20"><Mail size={10} className="mr-1" />Pending</Badge>;
}

function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const inviteUrl = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCopy}>
      {copied ? <Check size={12} className="mr-1 text-green-400" /> : <Copy size={12} className="mr-1" />}
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  );
}

export default function AdminInvitesPage() {
  const [email, setEmail] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { data, isLoading } = useInvites(page);

  const createInvite = useMutation({
    mutationFn: (email: string) => apiClient.post('/admin/invites', { email }),
    onSuccess: () => {
      setEmail('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Failed to create invite');
    },
  });

  const revokeInvite = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/invites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] }),
  });

  const invites: Invite[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    createInvite.mutate(email.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite Management"
        description="Send and manage member invitations"
        icon={Mail}
      />

      {/* Create invite form */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
      >
        <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--theme-text)' }}>
          Send New Invite
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            type="email"
            placeholder="member@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            className="max-w-sm"
            style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
          />
          <Button
            type="submit"
            disabled={createInvite.isPending || !email.trim()}
            style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          >
            <Plus size={14} className="mr-1.5" />
            {createInvite.isPending ? 'Sending…' : 'Send Invite'}
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <p className="mt-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Invites expire after 7 days. Each email address may have only one active invite at a time.
        </p>
      </div>

      {/* Invites table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
      >
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
            All Invites {data?.total != null && <span style={{ color: 'var(--theme-text-muted)' }}>({data.total})</span>}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
              {['Email', 'Status', 'Invited By', 'Expires', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-semibold"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-28" />
                      </td>
                    ))}
                  </tr>
                ))
              : invites.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      No invites yet. Send one above.
                    </td>
                  </tr>
                )
              : invites.map((invite) => {
                  const canRevoke = !invite.usedAt;
                  return (
                    <tr
                      key={invite.id}
                      style={{ borderBottom: '1px solid var(--theme-border)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--theme-text)' }}>
                        {invite.email}
                      </td>
                      <td className="px-4 py-3">
                        <InviteStatusBadge invite={invite} />
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {invite.invitedBy?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {formatDate(invite.expiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canRevoke && <CopyButton token={invite.token} />}
                          {canRevoke && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-400 hover:text-red-300"
                              onClick={() => revokeInvite.mutate(invite.id)}
                              disabled={revokeInvite.isPending}
                            >
                              <Trash2 size={12} className="mr-1" />
                              Revoke
                            </Button>
                          )}
                          {!canRevoke && (
                            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                              {invite.usedAt ? `Used ${formatDate(invite.usedAt)}` : 'Expired'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--theme-border)' }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs"
            >
              Previous
            </Button>
            <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
