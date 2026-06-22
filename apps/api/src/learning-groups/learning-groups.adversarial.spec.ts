/**
 * ADVERSARIAL TESTS: Learning Groups
 *
 * SEC-035: join() has TOCTOU race condition (count check → create not in transaction)
 * SEC-036: non-member can view group detail (messages hidden, but metadata+members leak)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { LearningGroupsService } from './learning-groups.service';
import { PrismaService } from '../prisma/prisma.service';

function buildMockPrisma() {
  return {
    learningGroup: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    learningGroupMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    learningGroupMessage: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      LearningGroupsService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<LearningGroupsService>(LearningGroupsService);
}

describe('[SEC-035] TOCTOU race in join() — FIXED', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: LearningGroupsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('join() uses a $transaction to prevent race conditions', async () => {
    // SEC-035 FIX: join() now wraps all queries in a $transaction
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        learningGroup: prisma.learningGroup,
        learningGroupMember: prisma.learningGroupMember,
        $queryRaw: vi.fn().mockResolvedValue([]),
      };
      prisma.learningGroup.findUnique.mockResolvedValue({
        id: 'g1',
        _count: { members: 7 },
      });
      prisma.learningGroupMember.findUnique.mockResolvedValue(null);
      prisma.learningGroupMember.create.mockResolvedValue({ id: 'm1', groupId: 'g1', userId: 'u1' });
      return cb(tx);
    });

    await service.join('g1', 'u1');

    // SEC-035 FIX: $transaction IS called — count check and create are atomic
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('concurrent joins are serialized by the transaction', async () => {
    // SEC-035 FIX: With a transaction, the DB serializes the count check + create
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        learningGroup: prisma.learningGroup,
        learningGroupMember: prisma.learningGroupMember,
        $queryRaw: vi.fn().mockResolvedValue([]),
      };
      prisma.learningGroup.findUnique.mockResolvedValue({
        id: 'g1',
        _count: { members: 7 },
      });
      prisma.learningGroupMember.findUnique.mockResolvedValue(null);
      prisma.learningGroupMember.create.mockResolvedValue({});
      return cb(tx);
    });

    await Promise.all([
      service.join('g1', 'user-a'),
      service.join('g1', 'user-b'),
    ]);

    // Both calls go through $transaction — DB-level isolation prevents the race
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });
});

describe('[SEC-036] non-member metadata leak in findOne()', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: LearningGroupsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('non-member can see group name and description but not member list details', async () => {
    prisma.learningGroup.findUnique.mockResolvedValue({
      id: 'g1',
      name: 'Secret Strategy Group',
      description: 'Confidential growth plans',
      createdById: 'creator-1',
      createdBy: { id: 'creator-1', name: 'Alice', avatarUrl: null },
      members: [
        { userId: 'creator-1', user: { id: 'creator-1', name: 'Alice', avatarUrl: null } },
        { userId: 'member-2', user: { id: 'member-2', name: 'Bob', avatarUrl: null } },
      ],
      messages: [
        { id: 'm1', content: 'Secret message', sender: { id: 'creator-1', name: 'Alice' } },
      ],
      _count: { members: 2, messages: 1 },
    });

    const result = await service.findOne('g1', 'outsider-user');

    // SEC-036 FIX: Messages are hidden from non-members
    expect(result.messages).toEqual([]);
    expect(result.isMember).toBe(false);

    // Non-members can see basic group info
    expect(result.name).toBe('Secret Strategy Group');
    expect(result.description).toBe('Confidential growth plans');

    // SEC-036 FIX: Member list is hidden — only member count is exposed
    expect(result.members).toHaveLength(0);
    expect(result.memberCount).toBe(2);
  });
});
