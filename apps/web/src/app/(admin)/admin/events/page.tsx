'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Video } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@community/shared';
import type { CommunityEvent } from '@community/shared';

function useAdminEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => apiClient.get('/events', { params: { limit: 100 } }).then((r) => r.data),
  });
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminEvents();

  const deleteEvent = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
  });

  const events: CommunityEvent[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Event Management" description={`${data?.total ?? 0} events`} icon={Calendar} />
        <Button
          size="sm"
          style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          onClick={() => alert('Event creation form — add modal in next sprint')}
        >
          + New Event
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          : events.map((event) => {
              const isPast = new Date(event.startsAt) < new Date();
              return (
                <div
                  key={event.id}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', opacity: isPast ? 0.6 : 1 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-center"
                    style={{ background: 'rgba(197,168,128,0.1)', border: '1px solid var(--theme-border)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>
                      {new Date(event.startsAt).toLocaleDateString('en', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                      {new Date(event.startsAt).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{event.title}</p>
                      {isPast && <Badge variant="secondary" className="text-xs">Past</Badge>}
                      {event.isVirtual && (
                        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs">
                          <Video size={10} className="mr-1" />Virtual
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      <span>{formatDate(event.startsAt)}</span>
                      {event.location && (
                        <span className="flex items-center gap-1"><MapPin size={10} />{event.location}</span>
                      )}
                      <span>{event._count?.rsvps ?? 0} RSVPs</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (confirm(`Delete "${event.title}"?`)) deleteEvent.mutate(event.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              );
            })}
      </div>
    </div>
  );
}
