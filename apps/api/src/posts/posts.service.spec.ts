import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  post: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  comment: {
    create: vi.fn(),
  },
  reaction: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
};

describe('PostsService', () => {
  let service: PostsService;

  const mockNotifications = {
    create: vi.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [{ id: '1', content: 'Hello' }];
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.post.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

      expect(result.data).toEqual(mockPosts);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const mockPost = { id: '1', content: 'Test post', authorId: 'user-1' };
      mockPrisma.post.create.mockResolvedValue(mockPost);

      const result = await service.create({ content: 'Test post' }, 'user-1');
      expect(result.content).toBe('Test post');
    });
  });

  describe('delete', () => {
    it('should allow author to delete their post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: '1', authorId: 'user-1' });
      mockPrisma.post.delete.mockResolvedValue({ id: '1' });

      const result = await service.delete('1', 'user-1', 'MEMBER');
      expect(result.message).toBe('Post deleted');
    });

    it('should throw ForbiddenException if user is not author and not admin', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: '1', authorId: 'user-2' });

      await expect(service.delete('1', 'user-1', 'MEMBER')).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to delete any post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: '1', authorId: 'user-2' });
      mockPrisma.post.delete.mockResolvedValue({ id: '1' });

      const result = await service.delete('1', 'admin-1', 'ADMIN');
      expect(result.message).toBe('Post deleted');
    });
  });
});
