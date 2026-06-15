import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
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
    return this.findOne(id);
  }
}
