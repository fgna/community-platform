import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, userId?: string) {
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

    return {
      data,
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
      throw new BadRequestException('Event must end after it starts');
    }

    return this.prisma.event.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async update(id: string, dto: Partial<CreateEventDto>) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const updateData: any = { ...dto };
    if (dto.startsAt) updateData.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) updateData.endsAt = new Date(dto.endsAt);

    return this.prisma.event.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    await this.prisma.event.delete({ where: { id } });
    return { message: 'Event deleted' };
  }

  async rsvp(eventId: string, userId: string, status: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { rsvps: { where: { status: 'GOING' } } } } },
    });

    if (!event) throw new NotFoundException('Event not found');

    if (
      event.maxRsvps &&
      (event._count as any).rsvps >= event.maxRsvps &&
      status === 'GOING'
    ) {
      throw new BadRequestException('Event is at capacity');
    }

    return this.prisma.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { status: status as any },
      create: { eventId, userId, status: status as any },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async cancelRsvp(eventId: string, userId: string) {
    await this.prisma.eventRsvp.deleteMany({
      where: { eventId, userId },
    });
    return { message: 'RSVP cancelled' };
  }
}
