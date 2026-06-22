/**
 * ADVERSARIAL TESTS: OAuth Service
 *
 * SEC-045: No OAuth state parameter — CSRF on authorization code flow
 * SEC-046: redirectUri from client body with no allowlist — open redirect
 * SEC-047: Automatic account linking by email without email_verified check — account takeover
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { OAuthService } from './oauth.service';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

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

describe('[SEC-045] OAuth CSRF — no state parameter', () => {
  it('OAuthCallbackDto accepts code + redirectUri without a state param', async () => {
    // SEC-045: The DTO only has { code, redirectUri } — no state field
    // Without state, an attacker can forge the callback and link their OAuth identity
    // to a victim's session (CSRF on the OAuth authorization code flow)
    const { OAuthCallbackDto } = await import('./dto/oauth-callback.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    const dto = plainToInstance(OAuthCallbackDto, {
      code: 'attacker-code',
      redirectUri: 'http://localhost:3000/auth/callback/google',
    });
    const errors = await validate(dto);

    // No validation error — the DTO doesn't require a state parameter
    expect(errors).toHaveLength(0);
    // There's no 'state' field at all on the DTO
    expect((dto as any).state).toBeUndefined();
  });
});

describe('[SEC-046] redirectUri open redirect / no allowlist', () => {
  it('OAuthCallbackDto accepts any string as redirectUri', async () => {
    const { OAuthCallbackDto } = await import('./dto/oauth-callback.dto');
    const { validate } = await import('class-validator');
    const { plainToInstance } = await import('class-transformer');

    // SEC-046: attacker-controlled redirect_uri — could be any domain
    const dto = plainToInstance(OAuthCallbackDto, {
      code: 'some-code',
      redirectUri: 'https://evil-attacker.com/steal-token',
    });
    const errors = await validate(dto);

    // No validation error — @IsString() with no @IsUrl() or domain allowlist
    expect(errors).toHaveLength(0);
  });
});

describe('[SEC-047] automatic account linking by email — account takeover', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: OAuthService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('handleOAuthLogin auto-links when email matches existing user', async () => {
    // No existing OAuth account for this provider+id
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);

    // But there IS an existing user with the same email
    prisma.user.findUnique.mockResolvedValue({
      id: 'victim-user-id',
      email: 'victim@example.com',
      name: 'Victim',
      role: 'MEMBER',
      avatarUrl: null,
      membershipTier: 'FREE',
      isActive: true,
    });

    // The service creates an OAuth link without any email_verified check
    prisma.oAuthAccount.create.mockResolvedValue({ id: 'oa1' });

    // SEC-047: Attacker controls an OAuth account with victim@example.com
    // The service auto-links it to the victim's account and generates tokens
    const result = await (service as any).handleOAuthLogin('google', {
      providerAccountId: 'attacker-google-id',
      email: 'victim@example.com',
      name: 'Attacker',
      avatarUrl: null,
    });

    // The attacker gets tokens for the victim's account
    expect(result.user.id).toBe('victim-user-id');
    expect(result.accessToken).toBe('at');

    // The attacker's Google account is now linked to the victim's user
    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'victim-user-id',
        providerAccountId: 'attacker-google-id',
      }),
    });
  });
});
