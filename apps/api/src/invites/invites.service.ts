import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async createInvite(email: string, invitedById: string) {
    const existing = await this.prisma.invite.findFirst({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existing) throw new BadRequestException('An active invite already exists for this email');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.invite.create({
      data: { email, token, invitedById, expiresAt },
      select: { id: true, email: true, token: true, expiresAt: true, createdAt: true },
    });
  }

  async listInvites(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invite.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          token: true,
          usedAt: true,
          expiresAt: true,
          createdAt: true,
          invitedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invite.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async validateInvite(token: string) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.usedAt) throw new BadRequestException('Invite already used');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite has expired');
    return { valid: true, email: invite.email };
  }

  async consumeInvite(token: string) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) return null;
    return this.prisma.invite.update({ where: { token }, data: { usedAt: new Date() } });
  }

  async revokeInvite(id: string) {
    await this.prisma.invite.delete({ where: { id } });
    return { message: 'Invite revoked' };
  }
}
