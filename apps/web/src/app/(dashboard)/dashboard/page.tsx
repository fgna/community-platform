'use client';

import { Users, MessageCircle, BookOpen, Calendar } from 'lucide-react';
import { StatsCard } from '@/components/common/stats-card';
import { PageHeader } from '@/components/common/page-header';
import { useAuth } from '@/hooks/use-auth';
import { useFeed } from '@/hooks/use-feed';
import { useCourses } from '@/hooks/use-courses';
import { useEvents } from '@/hooks/use-events';
import { useMembers } from '@/hooks/use-members';
import { PostCard } from '@/components/feed/post-card';
import { EventCard } from '@/components/events/event-card';
import { PostSkeleton } from '@/components/common/loading-skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: feedData, isLoading: feedLoading, isError: feedError } = useFeed(1, 3);
  const { data: coursesData } = useCourses(1, 1);
  const { data: eventsData } = useEvents(1, 3);
  const { data: membersData } = useMembers(1, 1);

  const upcomingEvents = eventsData?.data?.filter(
    (e) => new Date(e.startsAt) > new Date()
  ).slice(0, 2) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Here's what's happening in your community"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Members"
          value={membersData?.total ?? '—'}
          icon={Users}
          description="Active community members"
        />
        <StatsCard
          title="Community Posts"
          value={feedData?.total ?? '—'}
          icon={MessageCircle}
          description="Conversations this month"
        />
        <StatsCard
          title="Available Courses"
          value={coursesData?.total ?? '—'}
          icon={BookOpen}
          description="Learn something new"
        />
        <StatsCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          icon={Calendar}
          description="Events this month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
            RECENT POSTS
          </h3>
          {feedLoading ? (
            <div className="space-y-4">{[1, 2].map((i) => <PostSkeleton key={i} />)}</div>
          ) : feedError ? (
            <p className="text-sm py-4" style={{ color: 'var(--theme-danger, #ef4444)' }}>
              Failed to load posts. <button className="underline" onClick={() => window.location.reload()}>Retry</button>
            </p>
          ) : (
            <div className="space-y-4">
              {feedData?.data?.slice(0, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
            UPCOMING EVENTS
          </h3>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No upcoming events</p>
          )}
        </div>
      </div>
    </div>
  );
}
