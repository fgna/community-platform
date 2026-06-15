'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Video } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@community/shared';
import type { CommunityEvent } from '@community/shared';

function useAdminEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => apiClient.get('/events', { params: { limit: 100 } }).then((r) => r.data),
  });
}

function CreateEventDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [maxRsvps, setMaxRsvps] = useState('');

  const create = useMutation({
    mutationFn: () =>
      apiClient.post('/events', {
        title,
        description,
        startsAt,
        endsAt,
        location: location || undefined,
        isVirtual,
        meetingUrl: meetingUrl || undefined,
        maxRsvps: maxRsvps ? Number(maxRsvps) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      setTitle(''); setDescription(''); setStartsAt(''); setEndsAt('');
      setLocation(''); setIsVirtual(false); setMeetingUrl(''); setMaxRsvps('');
      onClose();
    },
  });

  const valid = title.trim() && description.trim() && startsAt && endsAt;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="e-title">Title</Label>
            <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q3 Kickoff Meeting" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-desc">Description</Label>
            <Textarea id="e-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's this event about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-start">Starts at</Label>
              <Input id="e-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-end">Ends at</Label>
              <Input id="e-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-loc">Location (optional)</Label>
            <Input id="e-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Conference Room A" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>Virtual event</p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Include a meeting URL</p>
            </div>
            <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
          </div>
          {isVirtual && (
            <div className="space-y-1.5">
              <Label htmlFor="e-url">Meeting URL</Label>
              <Input id="e-url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.example.com/..." />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="e-max">Max RSVPs (optional)</Label>
            <Input id="e-max" type="number" min={1} value={maxRsvps} onChange={(e) => setMaxRsvps(e.target.value)} placeholder="Leave blank for unlimited" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => create.mutate()}
            disabled={!valid || create.isPending}
            style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          >
            {create.isPending ? 'Creating…' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminEvents();
  const [createOpen, setCreateOpen] = useState(false);

  const deleteEvent = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'events'] }),
  });

  const events: CommunityEvent[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <CreateEventDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <div className="flex items-start justify-between">
        <PageHeader title="Event Management" description={`${data?.total ?? 0} events`} icon={Calendar} />
        <Button
          size="sm"
          style={{ background: 'var(--theme-primary)', color: 'var(--theme-background)' }}
          onClick={() => setCreateOpen(true)}
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
