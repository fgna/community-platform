import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

const pollSelect = {
  id: true,
  question: true,
  endsAt: true,
  createdAt: true,
  options: {
    select: {
      id: true,
      text: true,
      order: true,
      _count: { select: { votes: true } },
    },
    orderBy: { order: 'asc' as const },
  },
};

const postSelect = {
  id: true,
  content: true,
  isPinned: true,
  isHidden: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, name: true, avatarUrl: true, role: true },
  },
  poll: { select: pollSelect },
  _count: {
    select: { comments: true, reactions: true },
  },
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { isHidden: false },
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        select: {
          ...postSelect,
          reactions: userId
            ? { where: { userId }, select: { id: true, type: true, userId: true } }
            : false,
          poll: {
            select: {
              ...pollSelect,
              options: {
                select: {
                  id: true,
                  text: true,
                  order: true,
                  _count: { select: { votes: true } },
                  votes: userId ? { where: { userId }, select: { id: true } } : false,
                },
                orderBy: { order: 'asc' as const },
              },
              votes: userId ? { where: { userId }, select: { optionId: true } } : false,
            },
          },
        },
      }),
      this.prisma.post.count({ where: { isHidden: false } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTrending(limit = 20, userId?: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: { isHidden: false, createdAt: { gte: sevenDaysAgo } },
      include: {
        _count: { select: { reactions: true, comments: true } },
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        reactions: userId
          ? { where: { userId }, select: { id: true, type: true, userId: true } }
          : false,
        poll: {
          select: {
            ...pollSelect,
            options: {
              select: {
                id: true,
                text: true,
                order: true,
                _count: { select: { votes: true } },
                votes: userId ? { where: { userId }, select: { id: true } } : false,
              },
              orderBy: { order: 'asc' as const },
            },
          },
        },
      },
    });

    posts.sort((a, b) => b._count.reactions - a._count.reactions);

    return {
      data: posts.slice(0, limit),
      total: posts.length,
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id, isHidden: false },
      select: {
        ...postSelect,
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: { id: true, name: true, avatarUrl: true, role: true },
            },
          },
        },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async create(dto: CreatePostDto, authorId: string) {
    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        authorId,
        ...(dto.poll && {
          poll: {
            create: {
              question: dto.poll.question,
              endsAt: dto.poll.endsAt ? new Date(dto.poll.endsAt) : undefined,
              options: {
                create: dto.poll.options.map((text, order) => ({ text, order })),
              },
            },
          },
        }),
      },
      select: postSelect,
    });

    return post;
  }

  async update(id: string, content: string, userId: string, userRole: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Cannot edit this post');
    }

    return this.prisma.post.update({
      where: { id },
      data: { content },
      select: postSelect,
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Cannot delete this post');
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted' };
  }

  async addComment(postId: string, dto: CreateCommentDto, authorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: { content: dto.content, postId, authorId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        postId: true,
        authorId: true,
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    this.notifications.create(post.authorId, authorId, 'COMMENT', postId, 'post').catch(() => {});

    return comment;
  }

  async toggleReaction(postId: string, type: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.reaction.findUnique({
      where: { postId_userId_type: { postId, userId, type: type as any } },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { removed: true, type };
    }

    const reaction = await this.prisma.reaction.create({
      data: { postId, userId, type: type as any },
      select: { id: true, type: true, userId: true },
    });

    this.notifications.create(post.authorId, userId, 'REACTION', postId, 'post').catch(() => {});

    return { added: true, reaction };
  }

  async votePoll(postId: string, optionId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { postId },
      include: { options: { select: { id: true } } },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    if (poll.endsAt && poll.endsAt < new Date()) {
      throw new BadRequestException('Poll has ended');
    }

    const validOption = poll.options.some((o) => o.id === optionId);
    if (!validOption) throw new NotFoundException('Poll option not found');

    const vote = await this.prisma.pollVote.upsert({
      where: { pollId_userId: { pollId: poll.id, userId } },
      create: { pollId: poll.id, optionId, userId },
      update: { optionId },
      select: { id: true, optionId: true, userId: true, createdAt: true },
    });

    return vote;
  }

  async unvotePoll(postId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({ where: { postId } });
    if (!poll) throw new NotFoundException('Poll not found');

    await this.prisma.pollVote.deleteMany({ where: { pollId: poll.id, userId } });
    return { message: 'Vote removed' };
  }
}
