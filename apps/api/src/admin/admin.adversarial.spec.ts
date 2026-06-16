/**
 * ADVERSARIAL TESTS: Admin Service
 *
 * Attack surfaces:
 * - Audit log is NEVER written (AuditLog table exists, AdminService ignores it)
 * - Admin can self-demote to MEMBER (no last-admin guard)
 * - Admin can deactivate themselves (no guard → locked-out system)
 * - updateUserRole accepts arbitrary strings (not enum-validated)
 * - getAllUsers exposes emails of ALL users including deactivated/deleted ones
 * - getModerationQueue has no pagination (unbounded result set)
 * - Role change takes effect immediately on next DB-checked request (correct)
 *   but is not atomic with the audit log write (non-transactional risk)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

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

  // ── INVARIANT: every admin action is audit-logged ───────────────────────

  describe('INVARIANT: admin actions are written to AuditLog', () => {
    it('updateUserRole does NOT write an AuditLog entry', async () => {
      /**
       * admin.service.ts:43-52 — updateUserRole updates the user's role but
       * never calls prisma.auditLog.create.
       *
       * The AuditLog table exists and is intended for tracking sensitive actions.
       * An admin silently promoting any user to ADMIN leaves no trace.
       * This is a compliance failure (GDPR Article 5.2 — accountability) and
       * a security gap (privilege escalation is not detectable from audit logs).
       */
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
      prisma.user.update.mockResolvedValue({ id: 'u1', email: 'u@example.com', name: 'User', role: 'ADMIN' });

      await service.updateUserRole('u1', 'ADMIN');

      // AuditLog.create was never called
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('toggleUserActive does NOT write an AuditLog entry', async () => {
      /**
       * Deactivating a user account is a high-impact action — a user loses
       * access immediately. No audit trail is created.
       */
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true });
      prisma.user.update.mockResolvedValue({ id: 'u1', email: 'u@example.com', name: 'User', isActive: false });

      await service.toggleUserActive('u1');

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('hidePost does NOT write an AuditLog entry', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', isHidden: false });
      prisma.post.update.mockResolvedValue({ id: 'p1', isHidden: true });

      await service.hidePost('p1');

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('pinPost does NOT write an AuditLog entry', async () => {
      prisma.post.findUnique.mockResolvedValue({ id: 'p1', isPinned: false });
      prisma.post.update.mockResolvedValue({ id: 'p1', isPinned: true });

      await service.pinPost('p1');

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  // ── INVARIANT: system must always have at least one active admin ─────────

  describe('INVARIANT: no last-admin guard exists', () => {
    it('admin can demote themselves to MEMBER — leaving system without an admin', async () => {
      /**
       * updateUserRole has no guard against self-demotion or last-admin scenarios.
       * If the platform has only one admin and they call PATCH /admin/users/{self}/role
       * with { role: 'MEMBER' }, the system is permanently locked out of admin.
       * Recovery requires direct DB access.
       */
      const selfAdminUser = { id: 'admin-1', role: 'ADMIN' };
      prisma.user.findUnique.mockResolvedValue(selfAdminUser);
      prisma.user.update.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'MEMBER' });

      const result = await service.updateUserRole('admin-1', 'MEMBER');
      expect(result.role).toBe('MEMBER');
      // No error — system may now have zero admins
    });

    it('admin can deactivate themselves — locking their own account', async () => {
      /**
       * toggleUserActive has no guard against self-deactivation.
       * An admin who deactivates themselves cannot re-authenticate
       * (login checks isActive). Recovery requires direct DB access.
       */
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true });
      prisma.user.update.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', name: 'Admin', isActive: false });

      const result = await service.toggleUserActive('admin-1');
      expect(result.isActive).toBe(false);
      // No error — admin has locked themselves out
    });
  });

  // ── INVARIANT: role update must reject invalid role strings ─────────────

  describe('INVARIANT: updateUserRole accepts arbitrary strings', () => {
    it('updateUserRole with "SUPERADMIN" is forwarded to Prisma unchanged', async () => {
      /**
       * admin.service.ts:43-52 — role: role as any
       * No @IsEnum(Role) validation on the controller body or service layer.
       * Prisma throws P2006 (invalid enum value) at runtime → unhandled 500.
       *
       * Expected: 400 Bad Request with enum validation message
       * Actual: 500 Internal Server Error from DB driver
       */
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
      const dbError = new Error('Invalid value for enum Role: SUPERADMIN') as any;
      dbError.code = 'P2006';
      prisma.user.update.mockRejectedValue(dbError);

      await expect(service.updateUserRole('u1', 'SUPERADMIN')).rejects.toThrow();
      // Should be a 400, not a 500
    });

    it('updateUserRole with empty string is forwarded to Prisma', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
      const dbError = new Error('Invalid enum value') as any;
      dbError.code = 'P2006';
      prisma.user.update.mockRejectedValue(dbError);

      await expect(service.updateUserRole('u1', '')).rejects.toThrow();
    });
  });

  // ── INVARIANT: getAllUsers exposes private data of inactive users ─────────

  describe('INVARIANT: getAllUsers exposes emails of deactivated/deleted users', () => {
    it('getAllUsers includes anonymised deleted-user records', async () => {
      /**
       * admin.service.ts:20-41 — getAllUsers uses prisma.user.findMany without
       * isActive filter, returning all users including deleted ones.
       * Deleted users have email 'deleted-{userId}@deleted.invalid'.
       * This is intentional for admin visibility, but must not leak to non-admins.
       *
       * The admin controller has @Roles('ADMIN') — correct guard exists.
       * This test verifies the data is present (admin can see it) and documents
       * that the guard must never be loosened.
       */
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'active@example.com', role: 'MEMBER', isActive: true, _count: { posts: 5 } },
        { id: 'u2', email: 'deleted-u2@deleted.invalid', role: 'MEMBER', isActive: false, _count: { posts: 2 } },
      ]);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.getAllUsers(1, 20);
      const deletedUser = result.data.find((u) => !u.isActive);

      expect(deletedUser?.email).toBe('deleted-u2@deleted.invalid');
      // The anonymised email is returned — only safe because the endpoint requires ADMIN
    });
  });

  // ── INVARIANT: getModerationQueue has no pagination ──────────────────────

  describe('INVARIANT: getModerationQueue returns all hidden posts without pagination', () => {
    it('getModerationQueue returns an unbounded list of hidden posts', async () => {
      /**
       * admin.service.ts:85-94 — getModerationQueue uses findMany without
       * take/skip. If 10,000 posts are hidden (e.g. after a spam attack),
       * the response contains all 10,000 rows in one HTTP response.
       *
       * Expected: paginated result with configurable limit
       * Actual: unbounded result set
       */
      const tenThousandHiddenPosts = Array.from({ length: 10000 }, (_, i) => ({
        id: `p-${i}`,
        content: 'spam',
        isHidden: true,
        author: { id: 'spammer', name: 'Spammer', email: 'spam@evil.com' },
        _count: { comments: 0, reactions: 0 },
      }));

      prisma.post.findMany.mockResolvedValue(tenThousandHiddenPosts);

      const result = await service.getModerationQueue();

      // All 10k posts returned in one call
      expect(result).toHaveLength(10000);
      // No pagination metadata
      expect(result).not.toHaveProperty('total');
      expect(result).not.toHaveProperty('totalPages');
    });
  });

  // ── INVARIANT: hide/pin toggle is idempotent but not explicit ────────────

  describe('INVARIANT: hidePost and pinPost are toggle operations (not explicit set)', () => {
    it('two consecutive hidePost calls restore the original visibility', async () => {
      /**
       * admin.service.ts:65-73 — hidePost toggles isHidden (NOT explicit set).
       * Calling POST .../hide twice hides then un-hides the post.
       * An admin clicking "hide" twice (UI double-submit) would un-hide the post.
       * The action name "hide" implies a one-way operation, but it's actually a toggle.
       */
      prisma.post.findUnique
        .mockResolvedValueOnce({ id: 'p1', isHidden: false })
        .mockResolvedValueOnce({ id: 'p1', isHidden: true });
      prisma.post.update
        .mockResolvedValueOnce({ id: 'p1', isHidden: true })  // first hide
        .mockResolvedValueOnce({ id: 'p1', isHidden: false }); // second hide un-hides

      const first = await service.hidePost('p1');
      const second = await service.hidePost('p1');

      expect(first.isHidden).toBe(true);
      expect(second.isHidden).toBe(false);  // Un-hidden by double-click
    });
  });
});
