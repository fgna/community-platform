export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return formatDate(d);
}

export function isUpcoming(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

export function formatEventDuration(startsAt: string | Date, endsAt: string | Date): string {
  const start = typeof startsAt === 'string' ? new Date(startsAt) : startsAt;
  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;

  const sameDay =
    start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${formatDate(start, { month: 'short', day: 'numeric', year: 'numeric' })} · ${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}
