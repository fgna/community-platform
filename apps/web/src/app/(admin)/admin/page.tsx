'use client';

import { Users, MessageCircle, BookOpen, Calendar, TrendingUp, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { StatsCard } from '@/components/common/stats-card';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiClient.get('/admin/stats').then((r) => r.data),
  });
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview and management"
        icon={Shield}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatsCard title="Total Users" value={stats?.users ?? 0} icon={Users} description="Registered members" />
            <StatsCard title="Total Posts" value={stats?.posts ?? 0} icon={MessageCircle} description="Community posts" />
            <StatsCard title="Courses" value={stats?.courses ?? 0} icon={BookOpen} description="Published courses" />
            <StatsCard title="Events" value={stats?.events ?? 0} icon={Calendar} description="All events" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--theme-text-muted)' }}>
              <TrendingUp size={14} /> PLATFORM HEALTH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'API', status: 'Operational' },
              { label: 'Database', status: 'Operational' },
              { label: 'Auth Service', status: 'Operational' },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--theme-text)' }}>{label}</span>
                <Badge className="bg-green-500/15 text-green-400 border-green-500/20">{status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
              QUICK ACTIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Manage Users', href: '/admin/users' },
              { label: 'Review Content', href: '/admin/moderation' },
              { label: 'Publish Course', href: '/admin/courses' },
              { label: 'Create Event', href: '/admin/events' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="block px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--theme-primary)', background: 'rgba(197,168,128,0.05)' }}
              >
                {label} →
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
