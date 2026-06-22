export interface IcsEvent {
  uid: string;
  title: string;
  description: string;
  location?: string;
  url?: string;
  startsAt: Date;
  endsAt: Date;
  organizer?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateIcs(event: IcsEvent): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CommunityPlatform//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTART:${formatDate(event.startsAt)}`,
    `DTEND:${formatDate(event.endsAt)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeIcs(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push(
    `DTSTAMP:${formatDate(new Date())}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  );

  return lines.join('\r\n');
}
