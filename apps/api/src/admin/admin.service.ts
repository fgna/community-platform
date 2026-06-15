import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [users, posts, courses, events, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.course.count(),
      this.prisma.event.count(),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return { users, posts, courses, events, activeUsers };
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async toggleUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, name: true, isActive: true },
    });
  }

  async hidePost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.post.update({
      where: { id: postId },
      data: { isHidden: !post.isHidden },
    });
  }

  async pinPost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.post.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });
  }

  async getModerationQueue() {
    return this.prisma.post.findMany({
      where: { isHidden: true },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAuditLog(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
