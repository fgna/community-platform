import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpsertChallengeDto } from './dto/upsert-challenge.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    limit = Math.max(1, Math.min(limit, 100));
    page = Math.max(1, page);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          _count: {
            select: { posts: true, courseProgress: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: {
          select: { posts: true, courseProgress: true, eventRsvps: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        hasIntroduced: true,
        onboardingCompleted: true,
        emailDigest: true,
        calendarInvites: true,
        eventReminders: true,
        membershipTier: true,
        _count: {
          select: { posts: true, courseProgress: true, eventRsvps: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneWithFollow(id: string, requesterId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: {
          select: { posts: true, courseProgress: true, followers: true, following: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const isFollowing = requesterId !== id
      ? !!(await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: requesterId, followingId: id } },
        }))
      : false;

    return { ...user, isFollowing };
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) return { message: 'Cannot follow yourself' };

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
    return { following: true };
  }

  async unfollow(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return { following: false };
  }

  async updateCalendarInvites(userId: string, calendarInvites: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { calendarInvites },
      select: { id: true, calendarInvites: true },
    });
  }

  async updateEventReminders(userId: string, eventReminders: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { eventReminders },
      select: { id: true, eventReminders: true },
    });
  }

  async updateDigestPreference(userId: string, frequency: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailDigest: frequency as any },
      select: { id: true, emailDigest: true },
    });
  }

  async getChallenge(userId: string) {
    return this.prisma.challenge.findUnique({
      where: { userId },
    });
  }

  async upsertChallenge(userId: string, dto: UpsertChallengeDto) {
    return this.prisma.challenge.upsert({
      where: { userId },
      create: {
        userId,
        title: dto.title,
        description: dto.description,
        reflection: dto.reflection,
        status: dto.status as any,
      },
      update: {
        title: dto.title,
        description: dto.description,
        reflection: dto.reflection,
        status: dto.status as any,
      },
    });
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      select: { id: true, onboardingCompleted: true },
    });
  }

  async getInterests(userId: string) {
    const interests = await this.prisma.userInterest.findMany({
      where: { userId },
      select: {
        categoryId: true,
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return interests.map((i) => i.category);
  }

  async updateInterests(userId: string, categoryIds: string[]) {
    // Validate that all category IDs exist
    if (categoryIds.length > 0) {
      const existingCategories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingCategories.map((c) => c.id));
      const invalidIds = categoryIds.filter((id) => !existingIds.has(id));
      if (invalidIds.length > 0) {
        throw new NotFoundException(`Categories not found: ${invalidIds.join(', ')}`);
      }
    }

    // Replace all interests in a transaction
    await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({ where: { userId } }),
      ...(categoryIds.length > 0
        ? [
            this.prisma.userInterest.createMany({
              data: categoryIds.map((categoryId) => ({ userId, categoryId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return this.getInterests(userId);
  }
}
