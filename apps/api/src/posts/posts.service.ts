import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import sanitizeHtml from 'sanitize-html';

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
  type: true,
  authorId: true,
  isPinned: true,
  isHidden: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, name: true, avatarUrl: true, role: true },
  },
  categories: {
    select: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } },
  },
  poll: { select: pollSelect },
  _count: {
    select: { comments: true, reactions: true },
  },
};

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(page = 1, limit = 20, userId?: string, type?: string, prioritize?: string) {
    limit = Math.max(1, Math.min(limit, 100));
    page = Math.max(1, page);
    const skip = (page - 1) * limit;
    const where: any = { isHidden: false };
    if (type) where.type = type;

    const selectWithUser = {
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
    };

    // When prioritizing by user interests, fetch user's interest category IDs
    // and sort matching posts first, then the rest by date
    if (prioritize === 'interests' && userId) {
      const userInterests = await this.prisma.userInterest.findMany({
        where: { userId },
        select: { categoryId: true },
      });
      const interestCategoryIds = userInterests.map((i) => i.categoryId);

      if (interestCategoryIds.length > 0) {
        // Fetch all posts (both matching and non-matching) in a single query,
        // then sort in-memory: pinned first, then interest-matching by date, then rest by date
        const [allData, total] = await Promise.all([
          this.prisma.post.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            select: selectWithUser,
          }),
          this.prisma.post.count({ where }),
        ]);

        // Sort: pinned first, then posts matching user interests, then the rest
        const interestSet = new Set(interestCategoryIds);
        const sorted = allData.sort((a: any, b: any) => {
          // Pinned posts always stay on top
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

          const aMatches = a.categories?.some((pc: any) => interestSet.has(pc.category?.id ?? pc.categoryId));
          const bMatches = b.categories?.some((pc: any) => interestSet.has(pc.category?.id ?? pc.categoryId));

          if (aMatches && !bMatches) return -1;
          if (!aMatches && bMatches) return 1;

          // Same priority group — sort by date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return {
          data: sorted,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        select: selectWithUser,
      }),
      this.prisma.post.count({ where }),
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
    const sanitized = sanitizeHtml(dto.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h2', 'h3', 'img', 'figure', 'figcaption', 'span', 'del', 'ins', 'sup', 'sub']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height'],
        a: ['href', 'target', 'rel', 'class'],
        span: ['class'],
        '*': ['style'],
      },
      allowedStyles: {
        '*': {
          color: [/^#(0x)?[0-9a-fA-F]+$/i, /^rgb\(/],
          'background-color': [/^#(0x)?[0-9a-fA-F]+$/i, /^rgb\(/],
          'text-align': [/^left$/, /^right$/, /^center$/],
          'font-size': [/^\d+(?:px|em|%)$/],
        },
      },
      disallowedTagsMode: 'discard',
    });
    const post = await this.prisma.post.create({
      data: {
        content: sanitized,
        type: (dto.type as any) || 'DISCUSSION',
        authorId,
        ...(dto.categoryIds?.length && {
          categories: {
            create: dto.categoryIds.map((categoryId) => ({ categoryId })),
          },
        }),
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

    if (dto.type === 'INTRODUCTION') {
      await this.prisma.user.update({
        where: { id: authorId },
        data: { hasIntroduced: true },
      });
    }

    return post;
  }

  async update(id: string, content: string, userId: string, userRole: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Cannot edit this post');
    }
    if (post.isHidden && userRole !== 'ADMIN') {
      throw new ForbiddenException('Post is not available');
    }

    const sanitized = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h2', 'h3', 'img', 'figure', 'figcaption', 'span', 'del', 'ins', 'sup', 'sub']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height'],
        a: ['href', 'target', 'rel', 'class'],
        span: ['class'],
        '*': ['style'],
      },
      allowedStyles: {
        '*': {
          color: [/^#(0x)?[0-9a-fA-F]+$/i, /^rgb\(/],
          'background-color': [/^#(0x)?[0-9a-fA-F]+$/i, /^rgb\(/],
          'text-align': [/^left$/, /^right$/, /^center$/],
          'font-size': [/^\d+(?:px|em|%)$/],
        },
      },
      disallowedTagsMode: 'discard',
    });
    return this.prisma.post.update({
      where: { id },
      data: { content: sanitized },
      select: postSelect,
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Cannot delete this post');
    }
    if (post.isHidden && userRole !== 'ADMIN') {
      throw new ForbiddenException('Post is not available');
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted' };
  }

  async addComment(postId: string, dto: CreateCommentDto, authorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId, isHidden: false } });
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

    this.notifications.create(post.authorId, authorId, 'COMMENT', postId, 'post').catch((err) => this.logger.error('Failed to create comment notification', err));

    return comment;
  }

  async toggleReaction(postId: string, type: string, userId: string) {
    const VALID_TYPES = ['LIKE', 'HEART', 'CELEBRATE', 'INSIGHTFUL'];
    if (!VALID_TYPES.includes(type)) {
      throw new BadRequestException(`Invalid reaction type. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    const post = await this.prisma.post.findUnique({ where: { id: postId, isHidden: false } });
    if (!post) throw new NotFoundException('Post not found');

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.reaction.findUnique({
          where: { postId_userId_type: { postId, userId, type: type as any } },
        });

        if (existing) {
          await tx.reaction.delete({ where: { id: existing.id } });
          return { removed: true, type };
        }

        const reaction = await tx.reaction.create({
          data: { postId, userId, type: type as any },
          select: { id: true, type: true, userId: true },
        });

        return { added: true, reaction };
      });

      if ((result as any).added) {
        this.notifications.create(post.authorId, userId, 'REACTION', postId, 'post').catch((err) => this.logger.error('Failed to create reaction notification', err));
      }

      return result;
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('Reaction already exists');
      throw err;
    }
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
