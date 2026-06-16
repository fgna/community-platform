/**
 * ADVERSARIAL TESTS: GDPR Service
 *
 * Attack surfaces:
 * - Data export loads ALL user data in memory (DoS / OOM for large accounts)
 * - Account deletion leaves valid access tokens alive (JWT not revoked)
 * - Account deletion does NOT notify active sessions on other devices
 * - Anonymous consent session ID is not validated (spoofing/hijacking)
 * - getConsent returns null for users with no consent record (not a default record)
 * - Multiple consent records accumulate (every call creates a new row)
 * - Deleted user email format collision: deleted-{userId}@deleted.invalid
 *   could theoretically match another deleted user if userId contains '@deleted.invalid'
 * - deleteAccount on an already-deleted user succeeds (idempotency edge case)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { GdprService } from './gdpr.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

function buildMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      deleteMany: vi.fn(),
    },
    cookieConsent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      GdprService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<GdprService>(GdprService);
}

describe('GdprService — adversarial', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: GdprService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
    vi.clearAllMocks();
  });

  // ── INVARIANT: data export must not exhaust memory ───────────────────────

  describe('INVARIANT: exportUserData loads all data in a single unbounded query', () => {
    it('export for a power user loads thousands of posts/comments in one query', async () => {
      /**
       * gdpr.service.ts:27-47 — Single Prisma query with nested includes:
       *   posts → comments + reactions
       *   comments (standalone)
       *   reactions (standalone)
       *   courseProgress → course
       *   eventRsvps → event
       *   cookieConsents
       *
       * For a user with 10,000 posts each with 100 comments and 4 reactions,
       * this query returns ~1.04M rows, all held in memory simultaneously.
       * No streaming, no pagination, no timeout.
       *
       * Expected: paginated or streamed export
       * Actual: single in-memory load → OOM / request timeout
       */
      const massiveUserData = {
        id: 'u1',
        email: 'power@example.com',
        name: 'Power User',
        passwordHash: 'HASHED',
        posts: Array.from({ length: 10000 }, (_, i) => ({
          id: `post-${i}`,
          content: 'A'.repeat(10000),
          comments: Array.from({ length: 100 }, (_, j) => ({ id: `c-${i}-${j}`, content: 'comment' })),
          reactions: [
            { id: `r-${i}-1`, type: 'LIKE' },
            { id: `r-${i}-2`, type: 'HEART' },
          ],
        })),
        comments: Array.from({ length: 50000 }, (_, i) => ({ id: `gc-${i}`, content: 'comment' })),
        reactions: [],
        courseProgress: [],
        eventRsvps: [],
        cookieConsents: [],
      };

      prisma.user.findUnique.mockResolvedValue(massiveUserData);

      const result = await service.exportUserData('u1');

      // Export succeeds — in a real system this would timeout or OOM
      expect(result.user.posts).toHaveLength(10000);
      // No pagination in the result — entire dataset returned at once
      expect(result.user).not.toHaveProperty('nextPage');
    });

    it('password hash is excluded from export', async () => {
      /**
       * Correct: the service destructures passwordHash out before returning.
       * This invariant must hold even as the schema evolves.
       */
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'User',
        passwordHash: 'argon2id$...',
        posts: [],
        comments: [],
        reactions: [],
        courseProgress: [],
        eventRsvps: [],
        cookieConsents: [],
      });

      const result = await service.exportUserData('u1');

      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  // ── INVARIANT: account deletion invalidates all auth ─────────────────────

  describe('INVARIANT: deleteAccount revokes refresh tokens but not access tokens', () => {
    it('deleteAccount revokes refresh tokens (correct) but cannot revoke live JWTs', async () => {
      /**
       * gdpr.service.ts:50-70:
       * 1. Anonymises user record (isActive=false) ← JWT strategy re-checks isActive → OK
       * 2. Deletes refresh tokens ← prevents token rotation → OK
       *
       * However, a 15-minute access token issued 1 second before deletion
       * remains cryptographically valid for ~14m59s. The JWT strategy DOES
       * re-fetch from DB and check isActive, so this is mitigated — but only
       * as long as the strategy performs that DB check on every request.
       * If the strategy is ever changed to skip the DB check for performance,
       * the window becomes 15 minutes.
       *
       * This test documents the architectural dependency on the DB re-check.
       */
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: true });
      prisma.user.update.mockResolvedValue({ id: 'u1', isActive: false });
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.deleteAccount('u1');

      expect(result.message).toBe('Account deleted successfully');
      // Refresh tokens deleted
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      // Access token revocation is NOT explicit — relies on isActive DB check
    });

    it('calling deleteAccount twice on the same user succeeds both times', async () => {
      /**
       * First call: user exists, anonymise, delete tokens.
       * Second call: user exists (anonymised record still in DB), re-anonymise,
       * delete tokens (no-op). Both return success.
       *
       * There is no idempotency guard. The email becomes
       * deleted-{userId}@deleted.invalid → can be set again without conflict
       * because the unique constraint on email uses that exact string.
       */
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', isActive: false });
      prisma.user.update.mockResolvedValue({ id: 'u1', isActive: false });
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.deleteAccount('u1');
      expect(result.message).toBe('Account deleted successfully');
    });

    it('deleteAccount on non-existent user throws NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('ghost-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── INVARIANT: consent records must not accumulate unboundedly ────────────

  describe('INVARIANT: every consent update creates a new DB row (unbounded growth)', () => {
    it('updateConsent always inserts a new row, never updates existing', async () => {
      /**
       * gdpr.service.ts:15-18 — updateConsent calls prisma.cookieConsent.create
       * on every call. A user who updates consent daily for a year creates 365 rows.
       * getConsent uses findFirst + orderBy createdAt desc → correct latest value,
       * but the old rows are never cleaned up.
       *
       * This is an unbounded append-only table with no TTL or deduplication.
       */
      prisma.cookieConsent.create.mockResolvedValue({ id: 'cc-new', analytics: true, marketing: false });

      await service.updateConsent('u1', true, false);
      await service.updateConsent('u1', false, true);
      await service.updateConsent('u1', true, true);

      expect(prisma.cookieConsent.create).toHaveBeenCalledTimes(3);
      // No UPDATE or DELETE/INSERT — three independent rows in the DB
    });
  });

  // ── INVARIANT: anonymous consent sessionId is not validated ──────────────

  describe('INVARIANT: anonymous consent sessionId is attacker-controlled', () => {
    it('any sessionId including other users session IDs can be used as anonymous consent', async () => {
      /**
       * gdpr.service.ts:21-24 — saveAnonymousConsent accepts any sessionId.
       * An attacker can:
       * 1. Discover another user's sessionId (via network sniff, cookie theft, etc.)
       * 2. POST /api/gdpr/consent/anonymous with that sessionId and marketing=true
       * 3. The victim's session now has marketing consent they didn't give
       *
       * More broadly: there is no validation that the sessionId belongs to the caller.
       */
      prisma.cookieConsent.create.mockResolvedValue({
        id: 'cc-anon',
        sessionId: 'victim-session-id',
        analytics: true,
        marketing: true,
      });

      const result = await service.saveAnonymousConsent('victim-session-id', true, true);
      expect(result.sessionId).toBe('victim-session-id');
      // Consent stored for a session the caller may not own
    });

    it('empty sessionId is accepted (malformed consent record)', async () => {
      prisma.cookieConsent.create.mockResolvedValue({
        id: 'cc-empty',
        sessionId: '',
        analytics: false,
        marketing: false,
      });

      const result = await service.saveAnonymousConsent('', false, false);
      expect(result.sessionId).toBe('');
    });

    it('extremely long sessionId is accepted without length limit', async () => {
      const oversizedId = 'X'.repeat(100000);
      prisma.cookieConsent.create.mockResolvedValue({
        id: 'cc-long',
        sessionId: oversizedId,
        analytics: false,
        marketing: false,
      });

      const result = await service.saveAnonymousConsent(oversizedId, false, false);
      expect(result.sessionId).toHaveLength(100000);
    });
  });

  // ── INVARIANT: getConsent returns null (not a safe default) for new users ─

  describe('INVARIANT: getConsent returns null for users without consent records', () => {
    it('getConsent returns null — caller must handle null without crashing', async () => {
      /**
       * gdpr.service.ts:8-12 — returns findFirst result (null if none found).
       * getPrivacySettings uses optional chaining (consent?.analytics ?? false) — safe.
       * But if any other caller uses consent.analytics directly, it throws TypeError.
       */
      prisma.cookieConsent.findFirst.mockResolvedValue(null);

      const result = await service.getConsent('u1');
      expect(result).toBeNull();

      // getPrivacySettings handles null safely
      const settings = await service.getPrivacySettings('u1');
      expect(settings).toEqual({ analytics: false, marketing: false });
    });
  });
});
