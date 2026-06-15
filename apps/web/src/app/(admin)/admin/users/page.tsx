'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, UserX, UserCheck, ChevronDown } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, formatDate } from '@community/shared';
import type { User } from '@community/shared';

function useAdminUsers(search: string) {
  return useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () =>
      apiClient.get('/admin/users', { params: { search, limit: 50 } }).then((r) => r.data),
  });
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminUsers(search);

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiClient.patch(`/admin/users/${id}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const users: User[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description={`${data?.total ?? 0} total members`} icon={Users} />

      <div className="flex gap-3">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
        />
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
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
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--theme-border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)', fontSize: '11px' }}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--theme-text)' }}>{user.name}</p>
                          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {user.role === 'ADMIN' ? <><Shield size={10} className="mr-1" />Admin</> : 'Member'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={user.isActive ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() =>
                            changeRole.mutate({ id: user.id, role: user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN' })
                          }
                        >
                          <Shield size={12} className="mr-1" />
                          {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => toggleActive.mutate({ id: user.id, active: !user.isActive })}
                        >
                          {user.isActive ? <UserX size={12} className="mr-1" /> : <UserCheck size={12} className="mr-1" />}
                          {user.isActive ? 'Suspend' : 'Restore'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
