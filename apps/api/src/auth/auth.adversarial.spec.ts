/**
 * ADVERSARIAL TESTS: Authentication & Token Management
 *
 * Attack surfaces:
 * - Token refresh race condition (TOCTOU)
 * - Default secret fallback in production
 * - Refresh token accumulation (no cleanup)
 * - Account deletion does not immediately invalidate live JWTs
 * - Inactive user can still hold valid DB-resident tokens
 * - Register with pathological inputs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvitesService } from '../invites/invites.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

// ── helpers ─────────────────────────────────────────────────────────────────

function buildMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'rt-1' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn(),
    },
  };
}

const mockJwt = {
  sign: vi.fn().mockReturnValue('signed-access-token'),
};

const mockInvites = {
  validateInvite: vi.fn(),
  consumeInvite: vi.fn(),
};

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prisma },
      { provide: JwtService, useValue: mockJwt },
      { provide: InvitesService, useValue: mockInvites },
    ],
  }).compile();
  return module.get<AuthService>(AuthService);
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('AuthService — adversarial', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: AuthService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
    vi.clearAllMocks();
    mockJwt.sign.mockReturnValue('signed-access-token');
  });

  // ── INVARIANT: token refresh is non-duplicable ──────────────────────────

  describe('INVARIANT: refresh token rotation prevents token duplication', () => {
    it('concurrent refreshes with same token produce independent new token pairs', async () => {
      /**
       * TOCTOU ATTACK: Two simultaneous refresh calls with the same refreshToken.
       * Both pass strategy validation before either deletes the row.
       * Both then call service.refresh(), which deletes (no-op on 2nd) and
       * creates a NEW token each time.
       *
       * Expected invariant: a refresh token can only be exchanged ONCE.
       * Actual behaviour: both succeed → two independent active sessions.
       * This is a GHOST SESSION vulnerability.
       */
      let callCount = 0;
      mockJwt.sign.mockImplementation(() => `access-token-${++callCount}`);
      prisma.refreshToken.create
        .mockResolvedValueOnce({ id: 'rt-A' })
        .mockResolvedValueOnce({ id: 'rt-B' });

      const [resultA, resultB] = await Promise.all([
        service.refresh('user-1', 'user@example.com', 'MEMBER', 'old-refresh-token'),
        service.refresh('user-1', 'user@example.com', 'MEMBER', 'old-refresh-token'),
      ]);

      // Both succeed — ghost session confirmed
      expect(resultA.accessToken).toBeDefined();
      expect(resultB.accessToken).toBeDefined();

      // Both received DIFFERENT tokens → two independent live sessions
      expect(resultA.accessToken).not.toBe(resultB.accessToken);
      expect(resultA.refreshToken).not.toBe(resultB.refreshToken);

      // Each refresh() call: 1× deleteMany for old token + 1× deleteMany in generateTokens()
      // purging expired tokens (SEC-009 fix) = 2 per call × 2 concurrent calls = 4 total.
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledTimes(4);
    });

    it('refresh deletes the OLD token but never revokes the just-issued one', async () => {
      /**
       * After refresh() there is no mechanism to revoke the new token except
       * explicit logout with that specific token. An attacker who captured the
       * original refresh token and triggers the race owns a permanent ghost session.
       */
      prisma.refreshToken.create.mockResolvedValue({ id: 'new-rt' });

      await service.refresh('user-1', 'user@example.com', 'MEMBER', 'captured-refresh-token');

      // First deleteMany: old token consumed; second: expired-token purge (SEC-009)
      const deletedTokenArg = prisma.refreshToken.deleteMany.mock.calls[0][0];
      expect(deletedTokenArg.where.token).toBe('captured-refresh-token');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledTimes(2);
    });
  });

  // ── INVARIANT: login does not accumulate unbounded refresh tokens ───────

  describe('INVARIANT: login does not accumulate stale refresh tokens', () => {
    it('login creates a new refresh token WITHOUT deleting previous tokens', async () => {
      /**
       * BLAST RADIUS: An attacker who drives 1000 login calls before logout
       * will leave 1000 valid refresh tokens in the DB for 7 days.
       * No cleanup mechanism exists in generateTokens().
       */
      const passwordHash = await argon2.hash('password123');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        role: 'MEMBER',
        isActive: true,
        avatarUrl: null,
        passwordHash,
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      await service.login({ email: 'user@example.com', password: 'password123' });
      await service.login({ email: 'user@example.com', password: 'password123' });
      await service.login({ email: 'user@example.com', password: 'password123' });

      // Three logins → three refresh tokens created; SEC-009: each generateTokens()
      // purges expired tokens for the user — 1 deleteMany per login = 3 total.
      // Active (non-expired) tokens for the user are NOT deleted — sessions preserved.
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(3);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledTimes(3);
    });
  });

  // ── INVARIANT: deactivated users cannot authenticate ───────────────────

  describe('INVARIANT: inactive users are blocked at login', () => {
    it('deactivated user receives UnauthorizedException even with correct password', async () => {
      const passwordHash = await argon2.hash('validpass');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'inactive@example.com',
        isActive: false,
        passwordHash,
      });

      await expect(
        service.login({ email: 'inactive@example.com', password: 'validpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── INVARIANT: default secrets must not reach production ────────────────

  describe('INVARIANT: hardcoded default secrets are dangerous', () => {
    it('generateTokens falls back to "default-secret" when JWT_SECRET is absent', async () => {
      /**
       * auth.service.ts line 101: secret: process.env.JWT_SECRET || 'default-secret'
       * If the env var is missing (mis-configured deployment, leaked .env.example),
       * any attacker who knows the default can mint arbitrary JWTs.
       *
       * This test verifies the fallback path IS used — exposing the risk.
       */
      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'new@example.com',
        name: 'New',
        role: 'MEMBER',
        avatarUrl: null,
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt' });

      // This must NOT throw — it uses the fallback secret silently
      const result = await service.register({ email: 'new@example.com', name: 'New', password: 'password123' });
      expect(result.accessToken).toBeDefined();

      // Verify jwtService.sign was called with the dangerous fallback
      const signArgs = mockJwt.sign.mock.calls[0];
      expect(signArgs[1].secret).toBe('default-secret');

      if (original !== undefined) process.env.JWT_SECRET = original;
    });
  });

  // ── INVARIANT: email uniqueness is case-independent ────────────────────

  describe('INVARIANT: email collision with different case', () => {
    it('allows registration of USER@EXAMPLE.COM when user@example.com exists', async () => {
      /**
       * The DB has a unique constraint on email, but it's case-sensitive (PostgreSQL default).
       * A user could register user@example.com and USER@EXAMPLE.COM as separate accounts.
       * This breaks the "one account per email" invariant and allows duplicate identities.
       */
      // First user registered fine
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValue({
        id: 'u2',
        email: 'USER@EXAMPLE.COM',
        name: 'Upper',
        role: 'MEMBER',
        avatarUrl: null,
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt' });

      // findUnique for 'USER@EXAMPLE.COM' returns null even though
      // 'user@example.com' already exists (Prisma query is exact-match)
      const result = await service.register({
        email: 'USER@EXAMPLE.COM',
        name: 'Upper',
        password: 'password123',
      });

      // Registration succeeded — two accounts for the same mailbox
      expect(result.user.email).toBe('USER@EXAMPLE.COM');
    });
  });

  // ── INVARIANT: logout is idempotent and doesn't throw on missing token ──

  describe('INVARIANT: logout with unknown/already-used token must not error', () => {
    it('deleteMany with no matching token returns gracefully', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.logout('nonexistent-refresh-token');
      expect(result.message).toBe('Logged out successfully');
    });
  });

  // ── INVARIANT: register rejects malformed inputs ────────────────────────

  describe('INVARIANT: pathological register inputs', () => {
    it('unicode-only name is accepted (no character type restriction)', async () => {
      /**
       * No character-set restriction on name. Chinese, emoji, RTL characters,
       * zero-width joiners all pass @IsString() + MaxLength(100).
       * This could break rendering, search, and export downstream.
       */
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u3',
        email: 'unicode@example.com',
        name: '你好🎉​‮',
        role: 'MEMBER',
        avatarUrl: null,
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt' });

      const result = await service.register({
        email: 'unicode@example.com',
        name: '你好🎉​‮',
        password: 'password123',
      });

      expect(result.user).toBeDefined();
      // No error thrown — the name passes through as-is
    });

    it('password of exactly 8 chars (minimum) is accepted — weak password policy', async () => {
      /**
       * MinLength(8) only. 'password', '12345678', 'aaaaaaaa' all pass.
       * No complexity, entropy, or common-password check exists.
       */
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u4',
        email: 'weak@example.com',
        name: 'Weak',
        role: 'MEMBER',
        avatarUrl: null,
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt' });

      const result = await service.register({
        email: 'weak@example.com',
        name: 'Weak',
        password: 'password',
      });

      expect(result.user).toBeDefined();
    });
  });

  // ── INVARIANT: existing tokens revoked on account delete ────────────────

  describe('INVARIANT: account deletion revokes all tokens', () => {
    it('logout only accepts a single refresh token — does NOT mass-revoke all user tokens', async () => {
      /**
       * AuthService.logout() deletes ONE refresh token (the one provided).
       * If a user has 5 sessions (5 refresh tokens), logout from one session
       * leaves 4 active sessions unrevoked.
       *
       * Only deleteAccount() calls deleteMany({ where: { userId } }).
       * This means "logout" is not a security boundary for multi-session users.
       */
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('rt-session-1');

      // Only deletes the provided token, not all tokens for the user
      const call = prisma.refreshToken.deleteMany.mock.calls[0][0];
      expect(call.where).toEqual({ token: 'rt-session-1' });
      // No userId filter — only 1 of N sessions is terminated
      expect(call.where).not.toHaveProperty('userId');
    });
  });
});
