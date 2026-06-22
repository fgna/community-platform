/**
 * ADVERSARIAL TESTS: Admin Reports / CSV Export
 *
 * SEC-056: CSV exports load entire dataset into memory — OOM denial of service
 * SEC-057: CSV exports include PII (emails) in content-focused reports
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

function buildMockPrisma() {
  return {
    user: { findMany: vi.fn() },
    post: { findMany: vi.fn() },
    event: { findMany: vi.fn() },
    progress: { findMany: vi.fn() },
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      ReportsService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<ReportsService>(ReportsService);
}

describe('[SEC-056] CSV exports load unbounded data into memory', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: ReportsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('exportMembersCsv calls findMany with no take limit', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await service.exportMembersCsv();

    // SEC-056: findMany called without take — loads ALL users into memory
    const callArgs = prisma.user.findMany.mock.calls[0][0];
    expect(callArgs.take).toBeUndefined();
  });

  it('exportPostsCsv calls findMany with no take limit', async () => {
    prisma.post.findMany.mockResolvedValue([]);

    await service.exportPostsCsv();

    const callArgs = prisma.post.findMany.mock.calls[0][0];
    expect(callArgs.take).toBeUndefined();
  });

  it('exportCourseProgressCsv has no date filter parameter', async () => {
    prisma.progress.findMany.mockResolvedValue([]);

    // SEC-056: This method takes no date range params — always dumps entire table
    await service.exportCourseProgressCsv();

    const callArgs = prisma.progress.findMany.mock.calls[0][0];
    expect(callArgs.where).toBeUndefined();
    expect(callArgs.take).toBeUndefined();
  });
});

describe('[SEC-057] PII in content-focused CSV exports', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: ReportsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('exportPostsCsv includes author email addresses', async () => {
    prisma.post.findMany.mockResolvedValue([
      {
        id: 'p1',
        title: 'Test Post',
        content: 'Content',
        createdAt: new Date('2026-01-01'),
        author: { name: 'Alice', email: 'alice@private.com' },
        _count: { comments: 0, reactions: 0 },
      },
    ]);

    const csv = await service.exportPostsCsv();

    // SEC-057: Post export includes author email — unnecessary PII exposure
    expect(csv).toContain('alice@private.com');
  });

  it('exportCourseProgressCsv includes user email addresses', async () => {
    prisma.progress.findMany.mockResolvedValue([
      {
        user: { name: 'Bob', email: 'bob@private.com' },
        course: { title: 'Leadership 101' },
        percentage: 100,
        completedAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ]);

    const csv = await service.exportCourseProgressCsv();

    // SEC-057: Course progress export includes user email
    expect(csv).toContain('bob@private.com');
  });
});
