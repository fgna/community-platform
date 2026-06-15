'use client';

import { useMembers } from '@/hooks/use-members';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Crown } from 'lucide-react';
import type { AuthUser } from '@community/shared';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function roleStyle(role: string) {
  switch (role) {
    case 'admin':
      return { background: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.3)', color: '#f87171' };
    case 'moderator':
      return { background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' };
    default:
      return undefined;
  }
}

function MemberCard({ member }: { member: AuthUser }) {
  const isAdmin = member.role === 'admin';
  const isModerator = member.role === 'moderator';

  return (
    <Card className="hover:scale-[1.02] transition-all cursor-pointer">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-11 w-11">
            <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
          </Avatar>
          {isAdmin && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--theme-primary)' }}
            >
              <Crown size={10} style={{ color: 'var(--theme-background)' }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--theme-text)' }}>
            {member.name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {member.email}
          </p>
        </div>
        {(isAdmin || isModerator) && (
          <Badge style={roleStyle(member.role)} className="flex-shrink-0 capitalize">
            {member.role}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function MembersPage() {
  const { data, isLoading, error } = useMembers(1, 50);

  const members: AuthUser[] = data?.users ?? data?.members ?? [];
  const total: number = data?.total ?? members.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
            Members
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {total} {total === 1 ? 'member' : 'members'} in the community
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p style={{ color: 'var(--theme-danger)' }}>Failed to load members.</p>
          </CardContent>
        </Card>
      ) : !members.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--theme-text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--theme-text)' }}>No members yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
