import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.cookieConsent.create({
      data: { userId, analytics, marketing },
    });
  }

  async saveAnonymousConsent(sessionId: string, analytics: boolean, marketing: boolean) {
    return this.prisma.cookieConsent.create({
      data: { sessionId, analytics, marketing },
    });
  }

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: { include: { comments: true, reactions: true } },
        comments: true,
        reactions: true,
        courseProgress: { include: { course: true } },
        eventRsvps: { include: { event: true } },
        cookieConsents: true,
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
