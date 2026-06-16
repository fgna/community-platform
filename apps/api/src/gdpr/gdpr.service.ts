import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GdprService {
  constructor(private prisma: PrismaService) {}

  async getConsent(userId: string) {
    return this.prisma.cookieConsent.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateConsent(userId: string, analytics: boolean, marketing: boolean) {
    const existing = await this.prisma.cookieConsent.findFirst({ where: { userId } });
    if (existing) {
      return this.prisma.cookieConsent.update({
        where: { id: existing.id },
        data: { analytics, marketing },
      });
    }
    return this.prisma.cookieConsent.create({
      data: { userId, analytics, marketing },
    });
  }

  async saveAnonymousConsent(sessionId: string, analytics: boolean, marketing: boolean) {
    if (sessionId.length > 128) {
      throw new BadRequestException('Invalid session ID');
    }
    const existing = await this.prisma.cookieConsent.findFirst({ where: { sessionId } });
    if (existing) {
      return this.prisma.cookieConsent.update({
        where: { id: existing.id },
        data: { analytics, marketing },
      });
    }
    return this.prisma.cookieConsent.create({
      data: { sessionId, analytics, marketing },
    });
  }

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          take: 1000,
          orderBy: { createdAt: 'desc' },
          include: {
            comments: { take: 100 },
            reactions: { take: 100 },
          },
        },
        comments: { take: 1000, orderBy: { createdAt: 'desc' } },
        reactions: { take: 1000, orderBy: { createdAt: 'desc' } },
        courseProgress: { include: { course: { select: { id: true, title: true } } } },
        eventRsvps: { include: { event: { select: { id: true, title: true, startsAt: true } } } },
        cookieConsents: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, ...userData } = user;

    return {
      exportedAt: new Date().toISOString(),
      user: userData,
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Anonymize instead of hard delete to preserve data integrity
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.invalid`,
        name: 'Deleted User',
        bio: null,
        avatarUrl: null,
        isActive: false,
        passwordHash: 'DELETED',
      },
    });

    // Remove tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Account deleted successfully' };
  }

  async getPrivacySettings(userId: string) {
    const consent = await this.getConsent(userId);
    return {
      analytics: consent?.analytics ?? false,
      marketing: consent?.marketing ?? false,
    };
  }
}
