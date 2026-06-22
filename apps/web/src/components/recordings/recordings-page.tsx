'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Calendar, Clock, ExternalLink, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';

interface Recording {
  id: string;
  title: string;
  description?: string;
  url: string;
  duration?: number;
  thumbnailUrl?: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startsAt: string;
    isVirtual: boolean;
  };
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RecordingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recordings', page],
    queryFn: () =>
      apiClient.get('/events/recordings/all', { params: { page, limit: 12 } }).then((r) => r.data),
  });

  const recordings: Recording[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const filtered = search
    ? recordings.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.event.title.toLowerCase().includes(search.toLowerCase()),
      )
    : recordings;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
            Recordings
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Watch recordings from past events and meetings.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--theme-text-muted)' }}
          />
          <Input
            placeholder="Search recordings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--theme-primary)' }} />
        </div>
      )}

      {isError && (
        <div
          className="text-center py-12 rounded-xl"
          style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
        >
          <p style={{ color: 'var(--theme-text-muted)' }}>Failed to load recordings.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setPage(1)}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div
          className="text-center py-16 rounded-xl"
          style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}
        >
          <Play size={40} className="mx-auto mb-4" style={{ color: 'var(--theme-text-muted)', opacity: 0.4 }} />
          <p className="font-medium" style={{ color: 'var(--theme-text)' }}>
            {search ? 'No recordings match your search' : 'No recordings yet'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            {search ? 'Try a different search term.' : 'Recordings from past events will appear here.'}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recording) => (
            <a
              key={recording.id}
              href={recording.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
              style={{
                background: 'var(--theme-card)',
                border: '1px solid var(--theme-border)',
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-video flex items-center justify-center"
                style={{
                  background: recording.thumbnailUrl
                    ? `url(${recording.thumbnailUrl}) center/cover`
                    : 'linear-gradient(135deg, rgba(197,168,128,0.1), rgba(99,102,241,0.1))',
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <Play size={20} fill="white" style={{ color: 'white', marginLeft: 2 }} />
                </div>
                {recording.duration && (
                  <span
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                  >
                    {formatDuration(recording.duration)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h3
                  className="text-sm font-semibold line-clamp-2 group-hover:underline"
                  style={{ color: 'var(--theme-text)' }}
                >
                  {recording.title}
                </h3>
                {recording.description && (
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {recording.description}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    <Calendar size={11} />
                    {recording.event.title}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    <Clock size={11} />
                    {formatDate(recording.event.startsAt)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm px-3" style={{ color: 'var(--theme-text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
