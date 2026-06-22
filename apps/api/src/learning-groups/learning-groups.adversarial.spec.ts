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

describe('[SEC-035] TOCTOU race in join()', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: LearningGroupsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('join() does not use a transaction around count check + create', async () => {
    // Group is at 7/8 capacity
    prisma.learningGroup.findUnique.mockResolvedValue({
      id: 'g1',
      _count: { members: 7 },
    });
    prisma.learningGroupMember.findUnique.mockResolvedValue(null);
    prisma.learningGroupMember.create.mockResolvedValue({ id: 'm1', groupId: 'g1', userId: 'u1' });

    await service.join('g1', 'u1');

    // SEC-035: The service calls findUnique, then findUnique for dupe check,
    // then create — three separate queries with no $transaction wrapper.
    // Between the count check and the create, another request can slip through.
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.learningGroupMember.create).toHaveBeenCalled();
  });

  it('concurrent joins can exceed MAX_MEMBERS', async () => {
    // Simulate: both requests see 7 members (under the limit of 8)
    prisma.learningGroup.findUnique.mockResolvedValue({
      id: 'g1',
      _count: { members: 7 },
    });
    prisma.learningGroupMember.findUnique.mockResolvedValue(null);
    prisma.learningGroupMember.create.mockResolvedValue({});

    // Both calls pass the capacity check because both see count=7
    const [r1, r2] = await Promise.all([
      service.join('g1', 'user-a'),
      service.join('g1', 'user-b'),
    ]);

    // SEC-035: both succeed — group now has 9 members (exceeds MAX_MEMBERS=8)
    expect(prisma.learningGroupMember.create).toHaveBeenCalledTimes(2);
  });
});

describe('[SEC-036] non-member metadata leak in findOne()', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: LearningGroupsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('non-member can see group name, description, and full member list', async () => {
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

    // SEC-036: Messages are correctly hidden from non-members
    expect(result.messages).toEqual([]);
    expect(result.isMember).toBe(false);

    // But the group's existence, name, description, and full member list are exposed
    expect(result.name).toBe('Secret Strategy Group');
    expect(result.description).toBe('Confidential growth plans');
    expect(result.members).toHaveLength(2);
    expect(result.members[0].user.name).toBe('Alice');
  });
});
