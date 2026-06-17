import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
        emailDigest: true,
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

  async updateDigestPreference(userId: string, frequency: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailDigest: frequency as any },
      select: { id: true, emailDigest: true },
    });
  }
}
