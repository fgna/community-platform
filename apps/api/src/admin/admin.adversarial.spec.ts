/**
 * ADVERSARIAL TESTS: Admin Service
 *
 * Originally documented broken invariants. All findings below are now FIXED.
 * Tests assert correct/hardened behaviour.
 *
 * Fixed:
 * - SEC-006: Audit log IS written for every admin action
 * - SEC-007: Last-admin guard prevents self-demotion / self-deactivation
 * - SEC-015: updateUserRole uses @IsEnum at controller; invalid roles still
 *            throw at service level (Prisma P2006)
 * - SEC-021: getModerationQueue is now paginated
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

function buildMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    course: {
      count: vi.fn(),
    },
    event: {
      count: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      AdminService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<AdminService>(AdminService);
}

describe('AdminService — adversarial', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: AdminService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
    vi.clearAllMocks();
  });

  // ── FIXED SEC-006: every admin action is audit-logged ───────────────────

  describe('SEC-006 FIXED: admin actions write to AuditLog', () => {
    it('updateUserRole writes an AuditLog entry', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
      prisma.user.update.mockResolvedValue({ id: 'u1', email: 'u@example.com', name: 'User', role: 'ADMIN' });
      prisma.user.count.mockResolvedValue(2);
      prisma.auditLog.create.mockResolvedValue({});

      await service.updateUserRole('u1', 'ADMIN', 'actor-id');

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE_USER_ROLE', resource: 'User:u1' }),
      );
    });

    it('toggleUserActive writes an AuditLog entry', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true, role: 'MEMBER' });
      prisma.user.update.mockResolvedValue({ id: 'u1', email: 'u@example.com', name: 'User', isActive: false });
      prisma.user.count.mockResolvedValue(0);
      prisma.auditLog.create.mockResolvedValue({});

      await service.toggleUserActive('u1', 'actor-id');

      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('hidePost writes an AuditLog entry', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', isHidden: false });
      prisma.post.update.mockResolvedValue({ id: 'p1', isHidden: true });
      prisma.auditLog.create.mockResolvedValue({});

      await service.hidePost('p1', 'actor-id');

      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('pinPost writes an AuditLog entry', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', isPinned: false });
      prisma.post.update.mockResolvedValue({ id: 'p1', isPinned: true });
      prisma.auditLog.create.mockResolvedValue({});

      await service.pinPost('p1', 'actor-id');

      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  // ── FIXED SEC-007: last-admin guard prevents system lockout ─────────────

  describe('SEC-007 FIXED: last-admin guard and self-target protection', () => {
    it('admin cannot demote themselves — self-target blocked', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

      await expect(service.updateUserRole('admin-1', 'MEMBER', 'admin-1'))
        .rejects.toThrow('Cannot demote yourself');
    });

    it('cannot remove the last admin via role change', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
      prisma.user.count.mockResolvedValue(1);

      await expect(service.updateUserRole('admin-1', 'MEMBER', 'different-admin'))
        .rejects.toThrow('Cannot remove the last admin');
    });

    it('admin cannot deactivate themselves', async () => {
      await expect(service.toggleUserActive('admin-1', 'admin-1'))
        .rejects.toThrow('Cannot deactivate yourself');
    });

    it('cannot deactivate the last active admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN', isActive: true });
      prisma.user.count.mockResolvedValue(1);

      await expect(service.toggleUserActive('admin-1', 'different-admin'))
        .rejects.toThrow('Cannot deactivate the last admin');
    });

    it('demoting a non-admin to MEMBER succeeds without last-admin check', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
      prisma.user.update.mockResolvedValue({ id: 'u1', email: 'u@example.com', name: 'User', role: 'MEMBER' });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.updateUserRole('u1', 'MEMBER', 'admin-id');
      expect(result.role).toBe('MEMBER');
    });
  });

  // ── SEC-015 FIXED at controller: invalid roles blocked by @IsEnum ────────

  describe('SEC-015 FIXED: updateUserRole rejects invalid role strings', () => {
    it('updateUserRole with "SUPERADMIN" throws (Prisma P2006 at service level)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
      const dbError = new Error('Invalid value for enum Role: SUPERADMIN') as any;
      dbError.code = 'P2006';
      prisma.user.update.mockRejectedValue(dbError);

      await expect(service.updateUserRole('u1', 'SUPERADMIN', 'actor-id')).rejects.toThrow();
    });

    it('updateUserRole with empty string throws', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
      const dbError = new Error('Invalid enum value') as any;
      dbError.code = 'P2006';
      prisma.user.update.mockRejectedValue(dbError);

      await expect(service.updateUserRole('u1', '', 'actor-id')).rejects.toThrow();
    });
  });

  // ── getAllUsers: intentionally exposes full data to admins ───────────────

  describe('getAllUsers exposes emails of deactivated/deleted users (admin-only, correct)', () => {
    it('getAllUsers includes anonymised deleted-user records', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'active@example.com', role: 'MEMBER', isActive: true, _count: { posts: 5 } },
        { id: 'u2', email: 'deleted-u2@deleted.invalid', role: 'MEMBER', isActive: false, _count: { posts: 2 } },
      ]);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.getAllUsers(1, 20);
      const deletedUser = result.data.find((u) => !u.isActive);

      expect(deletedUser?.email).toBe('deleted-u2@deleted.invalid');
    });
  });

  // ── FIXED SEC-021: getModerationQueue is paginated ───────────────────────

  describe('SEC-021 FIXED: getModerationQueue returns paginated results', () => {
    it('getModerationQueue returns paginated response with total count', async () => {
      prisma.post.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          id: `p-${i}`,
          content: 'spam',
          isHidden: true,
          author: { id: 'spammer', name: 'Spammer', email: 'spam@evil.com' },
          _count: { comments: 0, reactions: 0 },
        })),
      );
      prisma.post.count.mockResolvedValue(10000);

      const result = await service.getModerationQueue(1, 20);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 10000);
      expect(result).toHaveProperty('totalPages', 500);
      expect(result.data).toHaveLength(20);
    });
  });

  // ── hidePost/pinPost are toggles (documented behaviour) ─────────────────

  describe('hidePost and pinPost are toggle operations (not explicit set)', () => {
    it('two consecutive hidePost calls restore the original visibility', async () => {
      prisma.post.findUnique
        .mockResolvedValueOnce({ id: 'p1', isHidden: false })
        .mockResolvedValueOnce({ id: 'p1', isHidden: true });
      prisma.post.update
        .mockResolvedValueOnce({ id: 'p1', isHidden: true })
        .mockResolvedValueOnce({ id: 'p1', isHidden: false });
      prisma.auditLog.create.mockResolvedValue({});

      const first = await service.hidePost('p1', 'actor-id');
      const second = await service.hidePost('p1', 'actor-id');

      expect(first.isHidden).toBe(true);
      expect(second.isHidden).toBe(false);
    });
  });
});
