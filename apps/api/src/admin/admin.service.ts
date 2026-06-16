import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
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

  async updateUserRole(userId: string, role: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, email: true, name: true, role: true },
    });

    await this.prisma.auditLog.create({
      data: { action: 'UPDATE_USER_ROLE', resource: `User:${userId}`, metadata: { role }, userId: actorId },
    });

    return updated;
  }

  async toggleUserActive(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, name: true, isActive: true },
    });

    await this.prisma.auditLog.create({
      data: { action: 'TOGGLE_USER_ACTIVE', resource: `User:${userId}`, metadata: { isActive: updated.isActive }, userId: actorId },
    });

    return updated;
  }

  async hidePost(postId: string, actorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { isHidden: !post.isHidden },
    });

    await this.prisma.auditLog.create({
      data: { action: 'HIDE_POST', resource: `Post:${postId}`, metadata: { isHidden: updated.isHidden }, userId: actorId },
    });

    return updated;
  }

  async pinPost(postId: string, actorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });

    await this.prisma.auditLog.create({
      data: { action: 'PIN_POST', resource: `Post:${postId}`, metadata: { isPinned: updated.isPinned }, userId: actorId },
    });

    return updated;
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

  async getAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsersLast30d,
      newUsersLast7d,
      totalPosts,
      postsLast30d,
      postsLast7d,
      totalComments,
      totalReactions,
      totalCourses,
      publishedCourses,
      totalEvents,
      upcomingEvents,
      totalRsvps,
      totalMessages,
      totalConversations,
      topPostAuthors,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.post.count({ where: { isHidden: false } }),
      this.prisma.post.count({ where: { isHidden: false, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.post.count({ where: { isHidden: false, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.comment.count(),
      this.prisma.reaction.count(),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.event.count(),
      this.prisma.event.count({ where: { startsAt: { gte: now } } }),
      this.prisma.eventRsvp.count({ where: { status: 'GOING' } }),
      this.prisma.message.count(),
      this.prisma.conversation.count(),
      this.prisma.post.groupBy({
        by: ['authorId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const topAuthors = await this.prisma.user.findMany({
      where: { id: { in: topPostAuthors.map(a => a.authorId) } },
      select: { id: true, name: true, avatarUrl: true },
    });

    return {
      users: { total: totalUsers, active: activeUsers, newLast30d: newUsersLast30d, newLast7d: newUsersLast7d },
      content: { posts: totalPosts, postsLast30d, postsLast7d, comments: totalComments, reactions: totalReactions },
      courses: { total: totalCourses, published: publishedCourses },
      events: { total: totalEvents, upcoming: upcomingEvents, totalRsvps },
      messages: { total: totalMessages, conversations: totalConversations },
      topPostAuthors: topPostAuthors.map(a => ({
        ...topAuthors.find(u => u.id === a.authorId),
        postCount: a._count.id,
      })),
    };
  }

  async getPlatformSettings() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    if (settings) return settings;
    return this.prisma.platformSettings.create({
      data: { id: 'default', updatedAt: new Date() },
    });
  }

  async updatePlatformSettings(dto: UpdatePlatformSettingsDto) {
    return this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...dto, updatedAt: new Date() },
      update: { ...dto, updatedAt: new Date() },
    });
  }
}
