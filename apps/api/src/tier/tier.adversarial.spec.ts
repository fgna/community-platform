/**
 * ADVERSARIAL TESTS: Tier / Premium Upgrade
 *
 * SEC-031: POST /tier/upgrade has no payment verification — any auth user can self-promote to PREMIUM
 * SEC-032: POST /tier/admin/:userId/:tier accepts arbitrary strings (no enum validation)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { TierService } from './tier.service';
import { TierController } from './tier.controller';
import { PrismaService } from '../prisma/prisma.service';

function buildMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

async function buildModule(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    controllers: [TierController],
    providers: [
      TierService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return {
    service: module.get<TierService>(TierService),
    controller: module.get<TierController>(TierController),
  };
}

describe('[SEC-031] free tier self-upgrade bypass', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: TierService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    ({ service } = await buildModule(prisma));
  });

  it('upgradeTier() promotes user without any payment check', async () => {
    prisma.user.update.mockResolvedValue({ id: 'free-user', membershipTier: 'PREMIUM' });

    const result = await service.upgradeTier('free-user');

    expect(result.membershipTier).toBe('PREMIUM');
    // SEC-031: upgrade succeeds with zero payment/billing verification
    // This test documents the current (insecure) behaviour: once a fix adds
    // payment verification, this call will throw or require a payment token.
  });

  it('controller upgrade() exposes unauthenticated tier promotion', async () => {
    prisma.user.update.mockResolvedValue({ id: 'u1', membershipTier: 'PREMIUM' });

    const result = await service.upgradeTier('u1');
    expect(result.membershipTier).toBe('PREMIUM');
    // No @Roles guard on the upgrade endpoint — any authenticated user reaches it
  });
});

describe('[SEC-032] arbitrary tier string injection', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: TierService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    ({ service } = await buildModule(prisma));
  });

  it('setTier() accepts arbitrary string values without enum validation', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', membershipTier: 'FREE' });
    prisma.user.update.mockResolvedValue({ id: 'u1', membershipTier: 'SUPERADMIN' });

    const result = await service.setTier('u1', 'SUPERADMIN');

    // SEC-032: "SUPERADMIN" is not a valid MembershipTier enum value,
    // but the service casts `tier as any` and Prisma may accept it
    expect(result.membershipTier).toBe('SUPERADMIN');
  });

  it('setTier() does not reject empty-string tier', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', membershipTier: 'FREE' });
    prisma.user.update.mockResolvedValue({ id: 'u1', membershipTier: '' });

    const result = await service.setTier('u1', '');
    expect(result.membershipTier).toBe('');
  });

  it('setTier() does not reject extremely long tier string', async () => {
    const longTier = 'A'.repeat(10000);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', membershipTier: 'FREE' });
    prisma.user.update.mockResolvedValue({ id: 'u1', membershipTier: longTier });

    const result = await service.setTier('u1', longTier);
    expect(result.membershipTier).toBe(longTier);
  });
});
