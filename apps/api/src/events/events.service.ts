import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

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
          rsvps: userId
            ? { where: { userId }, select: { id: true, status: true, userId: true } }
            : false,
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
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { rsvps: { where: { status: 'GOING' } } } } },
      });

      if (!event) throw new NotFoundException('Event not found');

      const currentRsvp = await tx.eventRsvp.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });

      // Only enforce capacity when changing TO "GOING" and user isn't already GOING
      if (
        event.maxRsvps &&
        status === 'GOING' &&
        currentRsvp?.status !== 'GOING' &&
        (event._count as any).rsvps >= event.maxRsvps
      ) {
        throw new BadRequestException('Event is at capacity');
      }

      return tx.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId } },
        update: { status: status as any },
        create: { eventId, userId, status: status as any },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
    });
  }

  async cancelRsvp(eventId: string, userId: string) {
    await this.prisma.eventRsvp.deleteMany({
      where: { eventId, userId },
    });
    return { message: 'RSVP cancelled' };
  }
}
