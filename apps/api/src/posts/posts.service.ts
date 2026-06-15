import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

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
  _count: {
    select: { comments: true, reactions: true },
  },
};

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.post.create({
      data: {
        content: dto.content,
        authorId,
      },
      select: postSelect,
    });
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

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });
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

    return { added: true, reaction };
  }
}
