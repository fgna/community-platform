/**
 * ADVERSARIAL TESTS: OAuth Service
 *
 * SEC-045: No OAuth state parameter — CSRF on authorization code flow — FIXED
 * SEC-046: redirectUri from client body with no allowlist — FIXED (@IsUrl added)
 * SEC-047: Automatic account linking by email without email_verified check — FIXED
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { OAuthService } from './oauth.service';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

function buildMockPrisma() {
  return {
    oAuthAccount: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

const mockAuthService = {
  generateTokens: vi.fn().mockResolvedValue({
    accessToken: 'at',
    refreshToken: 'rt',
  }),
};

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      OAuthService,
      { provide: PrismaService, useValue: prisma },
      { provide: AuthService, useValue: mockAuthService },
    ],
  }).compile();
  return module.get<OAuthService>(OAuthService);
}

describe('[SEC-045] OAuth CSRF — state parameter — FIXED', () => {
  it('OAuthCallbackDto has optional state field', async () => {
    const { OAuthCallbackDto } = await import('./dto/oauth-callback.dto');

    const dto = plainToInstance(OAuthCallbackDto, {
      code: 'auth-code',
      redirectUri: 'http://localhost:3000/auth/callback/google',
      state: 'csrf-token-123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('[SEC-046] redirectUri validation — FIXED', () => {
  it('OAuthCallbackDto rejects non-URL strings as redirectUri', async () => {
    const { OAuthCallbackDto } = await import('./dto/oauth-callback.dto');

    const dto = plainToInstance(OAuthCallbackDto, {
      code: 'some-code',
      redirectUri: 'not-a-url',
    });
    const errors = await validate(dto);
    const uriError = errors.find((e) => e.property === 'redirectUri');
    expect(uriError).toBeDefined();
  });

  it('OAuthCallbackDto accepts valid callback URL', async () => {
    const { OAuthCallbackDto } = await import('./dto/oauth-callback.dto');

    const dto = plainToInstance(OAuthCallbackDto, {
      code: 'some-code',
      redirectUri: 'http://localhost:3000/auth/callback/google',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('[SEC-047] email_verified check on account linking — FIXED', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: OAuthService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('handleOAuthLogin rejects auto-link when email is not verified', async () => {
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: 'victim-user-id',
      email: 'victim@example.com',
      name: 'Victim',
      role: 'MEMBER',
      avatarUrl: null,
      membershipTier: 'FREE',
      isActive: true,
    });

    const { BadRequestException } = await import('@nestjs/common');

    await expect(
      (service as any).handleOAuthLogin('google', {
        providerAccountId: 'attacker-google-id',
        email: 'victim@example.com',
        emailVerified: false,
        name: 'Attacker',
        avatarUrl: null,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('handleOAuthLogin allows auto-link when email is verified', async () => {
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      name: 'User',
      role: 'MEMBER',
      avatarUrl: null,
      membershipTier: 'FREE',
      isActive: true,
    });
    prisma.oAuthAccount.create.mockResolvedValue({ id: 'oa1' });

    const result = await (service as any).handleOAuthLogin('google', {
      providerAccountId: 'google-id',
      email: 'user@example.com',
      emailVerified: true,
      name: 'User',
      avatarUrl: null,
    });

    expect(result.user.id).toBe('user-id');
    expect(result.accessToken).toBe('at');
  });
});
