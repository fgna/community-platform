'use client';

import { useAuth } from '@/hooks/use-auth';
import { useFeed } from '@/hooks/use-feed';
import { useCourses } from '@/hooks/use-courses';
import { useEvents } from '@/hooks/use-events';
import { useMembers } from '@/hooks/use-members';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Users, Rss, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
  loading?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="hover:scale-[1.02] transition-transform cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                {title}
              </p>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {value}
                </p>
              )}
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(197,168,128,0.12)',
                color: 'var(--theme-primary)',
              }}
            >
              <Icon size={20} />
            </div>
          </div>
          <div
            className="flex items-center gap-1 mt-3 text-xs group-hover:gap-2 transition-all"
            style={{ color: 'var(--theme-primary)' }}
          >
            <span>View all</span>
            <ArrowRight size={12} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardOverview() {
  const { user } = useAuth();
  const { data: feedData, isLoading: feedLoading } = useFeed(1, 5);
  const { data: coursesData, isLoading: coursesLoading } = useCourses(1, 5);
  const { data: eventsData, isLoading: eventsLoading } = useEvents(1, 5);
  const { data: membersData, isLoading: membersLoading } = useMembers(1, 5);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          {greeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Here&apos;s what&apos;s happening in your community today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Posts"
          value={feedData?.total ?? 0}
          icon={Rss}
          href="/feed"
          loading={feedLoading}
        />
        <StatCard
          title="Courses"
          value={coursesData?.total ?? 0}
          icon={BookOpen}
          href="/courses"
          loading={coursesLoading}
        />
        <StatCard
          title="Events"
          value={eventsData?.total ?? 0}
          icon={Calendar}
          href="/events"
          loading={eventsLoading}
        />
        <StatCard
          title="Members"
          value={membersData?.total ?? 0}
          icon={Users}
          href="/members"
          loading={membersLoading}
        />
      </div>

      {/* Recent activity split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent posts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Recent Posts</span>
              <Link
                href="/feed"
                className="text-xs font-normal hover:underline flex items-center gap-1"
                style={{ color: 'var(--theme-primary)' }}
              >
                View all <ArrowRight size={10} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              : feedData?.posts?.slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col gap-0.5 py-1 border-b last:border-0"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    <p
                      className="text-sm line-clamp-1"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      <span>{post.author?.name}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
            {!feedLoading && !feedData?.posts?.length && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-muted)' }}>
                No posts yet. Be the first!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Upcoming Events</span>
              <Link
                href="/events"
                className="text-xs font-normal hover:underline flex items-center gap-1"
                style={{ color: 'var(--theme-primary)' }}
              >
                View all <ArrowRight size={10} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              : eventsData?.events?.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 py-1 border-b last:border-0"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex flex-col items-center justify-center text-xs font-bold"
                      style={{
                        background: 'rgba(197,168,128,0.12)',
                        color: 'var(--theme-primary)',
                      }}
                    >
                      <span className="leading-none">
                        {new Date(event.startDate).getDate()}
                      </span>
                      <span className="text-[9px] leading-none uppercase">
                        {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {event.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {event.location || 'Online'}
                      </p>
                    </div>
                    {event.isOnline && (
                      <Badge className="text-[10px] flex-shrink-0">Online</Badge>
                    )}
                  </div>
                ))}
            {!eventsLoading && !eventsData?.events?.length && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-muted)' }}>
                No upcoming events.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp size={16} style={{ color: 'var(--theme-primary)' }} />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Write a post', href: '/feed', icon: Rss },
              { label: 'Browse courses', href: '/courses', icon: BookOpen },
              { label: 'Find events', href: '/events', icon: Calendar },
              { label: 'Meet members', href: '/members', icon: Users },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-center text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text-muted)',
                }}
              >
                <Icon size={20} style={{ color: 'var(--theme-primary)' }} />
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
