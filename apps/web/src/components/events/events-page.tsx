'use client';

import { useEvents, useRsvp, useCancelRsvp } from '@/hooks/use-events';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Users, Video, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { CommunityEvent } from '@community/shared';

function EventCard({ event }: { event: CommunityEvent }) {
  const { user } = useAuth();
  const rsvp = useRsvp(event.id);
  const cancelRsvp = useCancelRsvp(event.id);

  const userRsvp = event.attendees?.find((a) => a.userId === user?.id);
  const attendeeCount = event.attendees?.length ?? 0;

  const handleRsvp = () => {
    if (userRsvp) {
      cancelRsvp.mutate();
    } else {
      rsvp.mutate('attending');
    }
  };

  const isPending = rsvp.isPending || cancelRsvp.isPending;
  const startDate = new Date(event.startDate);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Date strip */}
        <div
          className="flex items-center gap-4 px-5 py-3"
          style={{ borderBottom: '1px solid var(--theme-border)' }}
        >
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
            style={{ background: 'rgba(197,168,128,0.12)' }}
          >
            <span className="text-lg font-bold leading-none" style={{ color: 'var(--theme-primary)' }}>
              {format(startDate, 'd')}
            </span>
            <span className="text-xs font-medium uppercase" style={{ color: 'var(--theme-text-muted)' }}>
              {format(startDate, 'MMM')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-tight" style={{ color: 'var(--theme-text)' }}>
                {event.title}
              </h3>
              <div className="flex gap-1.5 flex-shrink-0">
                {event.isOnline && (
                  <Badge style={{ background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}>
                    <Video size={10} className="mr-1" />
                    Online
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {format(startDate, 'EEEE, MMMM d · h:mm a')}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {event.description && (
            <p className="text-sm line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={12} />
              {attendeeCount} attending
            </span>
            {event.maxAttendees && (
              <span className="flex items-center gap-1">
                <span>{event.maxAttendees - attendeeCount} spots left</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex -space-x-2">
              {event.attendees?.slice(0, 5).map((attendee) => (
                <div
                  key={attendee.userId}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
                  style={{
                    background: 'var(--theme-primary)',
                    color: 'var(--theme-background)',
                    borderColor: 'var(--theme-card)',
                  }}
                  title={attendee.user?.name}
                >
                  {attendee.user?.name?.[0] ?? '?'}
                </div>
              ))}
            </div>

            <Button
              size="sm"
              variant={userRsvp ? 'outline' : 'default'}
              onClick={handleRsvp}
              disabled={isPending}
              style={
                userRsvp
                  ? {
                      borderColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary)',
                      background: 'transparent',
                    }
                  : undefined
              }
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : userRsvp ? (
                'Cancel RSVP'
              ) : (
                'RSVP'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventsPage() {
  const { data, isLoading, error } = useEvents();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Events
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Connect with your community at upcoming events.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p style={{ color: 'var(--theme-danger)' }}>Failed to load events.</p>
          </CardContent>
        </Card>
      ) : !data?.events?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar size={40} className="mx-auto mb-3" style={{ color: 'var(--theme-text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--theme-text)' }}>No upcoming events</p>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Check back soon for new events.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
