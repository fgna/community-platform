import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { generateIcs } from '../email/ics.util';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async findAll(page = 1, limit = 20, userId?: string) {
    limit = Math.max(1, Math.min(limit, 100));
    page = Math.max(1, page);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        take: limit,
        orderBy: { startsAt: 'asc' },
        include: {
          _count: { select: { rsvps: true } },
          rsvps: {
            take: 5,
            select: { id: true, status: true, userId: true, user: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      }),
      this.prisma.event.count(),
    ]);

    const events = data.map((event) => ({
      ...event,
      userRsvp: userId
        ? ((event.rsvps as any[])?.find((r) => r.userId === userId) ?? null)
        : null,
    }));

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        rsvps: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { rsvps: true } },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const userRsvp = userId
      ? event.rsvps.find((r) => r.userId === userId) || null
      : null;

    return { ...event, userRsvp };
  }

  async create(dto: CreateEventDto) {
    if (new Date(dto.startsAt) >= new Date(dto.endsAt)) {
      throw new BadRequestException('startsAt must be before endsAt');
    }
    return this.prisma.event.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateEventDto>) {
    if (dto.startsAt && dto.endsAt && new Date(dto.startsAt) >= new Date(dto.endsAt)) {
      throw new BadRequestException('startsAt must be before endsAt');
    }
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return this.prisma.event.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    await this.prisma.event.delete({ where: { id } });
    return { message: 'Event deleted' };
  }

  async rsvp(eventId: string, userId: string, status: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { rsvps: { where: { status: 'GOING' } } } } },
      });

      if (!event) throw new NotFoundException('Event not found');

      const currentRsvp = await tx.eventRsvp.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });

      if (
        event.maxRsvps &&
        status === 'GOING' &&
        currentRsvp?.status !== 'GOING' &&
        (event._count as any).rsvps >= event.maxRsvps
      ) {
        throw new BadRequestException('Event is at capacity');
      }

      const rsvp = await tx.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId } },
        update: { status: status as any },
        create: { eventId, userId, status: status as any },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      return { rsvp, event };
    });

    if (status === 'GOING') {
      this.sendCalendarInvite(userId, result.event).catch((err) =>
        this.logger.error('Failed to send calendar invite', err),
      );
    }

    return result.rsvp;
  }

  private async sendCalendarInvite(userId: string, event: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, calendarInvites: true },
    });

    if (!user || !user.calendarInvites) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const icsContent = generateIcs({
      uid: `${event.id}@community`,
      title: event.title,
      description: event.description,
      location: event.isVirtual ? event.meetingUrl || 'Virtual' : event.location || undefined,
      url: `${appUrl}/events/${event.id}`,
      startsAt: new Date(event.startsAt),
      endsAt: new Date(event.endsAt),
    });

    const locationLine = event.isVirtual
      ? (event.meetingUrl ? `<a href="${event.meetingUrl}">Join meeting</a>` : 'Virtual event')
      : (event.location || 'TBD');

    await this.email.send({
      to: user.email,
      subject: `Calendar invite: ${event.title}`,
      html: this.buildInviteHtml(user.name, event, locationLine, appUrl),
      icalEvent: icsContent,
    });
  }

  private buildInviteHtml(userName: string, event: any, locationLine: string, appUrl: string): string {
    const start = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    const dateStr = start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#090d16;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#090d16;padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:24px 32px;background:rgba(17,24,39,0.9);border-radius:12px 12px 0 0;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:13px;color:#9ca3af;">You're going!</div>
          <div style="font-size:20px;font-weight:600;color:#f3f4f6;margin-top:4px;">${this.esc(event.title)}</div>
        </td></tr>
        <tr><td style="padding:24px 32px;background:rgba(17,24,39,0.7);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;color:#9ca3af;font-size:13px;width:80px;">When</td>
              <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">${dateStr}<br/>${timeStr}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Where</td>
              <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">${locationLine}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 24px;background:rgba(17,24,39,0.7);">
          <div style="font-size:13px;color:#9ca3af;margin-bottom:12px;">${this.esc(event.description).slice(0, 300)}</div>
          <a href="${appUrl}/events/${event.id}" style="display:inline-block;padding:10px 20px;background:#c5a880;color:#090d16;font-weight:600;font-size:14px;border-radius:8px;text-decoration:none;">View Event</a>
        </td></tr>
        <tr><td style="padding:16px 32px;background:rgba(17,24,39,0.7);border-radius:0 0 12px 12px;border-top:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:12px;color:#6b7280;">A calendar invite (.ics) is attached. <a href="${appUrl}/settings" style="color:#c5a880;text-decoration:underline;">Manage preferences</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private esc(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async cancelRsvp(eventId: string, userId: string) {
    await this.prisma.eventRsvp.deleteMany({
      where: { eventId, userId },
    });
    return { message: 'RSVP cancelled' };
  }
}
