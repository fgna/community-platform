/**
 * ADVERSARIAL TESTS: Assessments
 *
 * SEC-043: questionId from client not validated against QUESTIONS array
 * SEC-044: score manipulation — dimension average can be skewed by fabricated questionIds
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AssessmentsService } from './assessments.service';
import { PrismaService } from '../prisma/prisma.service';

function buildMockPrisma() {
  return {
    assessment: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      AssessmentsService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<AssessmentsService>(AssessmentsService);
}

describe('[SEC-043] unvalidated questionIds in submit()', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: AssessmentsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('submit() accepts fabricated questionIds not in QUESTIONS array', async () => {
    prisma.assessment.create.mockImplementation(async ({ data }) => ({
      id: 'a1',
      userId: data.userId,
      scores: data.scores,
      overallScore: data.overallScore,
      completedAt: new Date(),
    }));

    // Send 30 answers with entirely fake questionIds
    const fakeAnswers = Array.from({ length: 30 }, (_, i) => ({
      questionId: `FAKE${i}`,
      score: 5,
    }));

    const result = await service.submit('u1', { answers: fakeAnswers });

    // SEC-043: The service filters answers by a.questionId.startsWith(dim)
    // Fake IDs starting with something other than G/R/O/W/T/H produce
    // zero matches per dimension, so avg = 0/1 = 0
    expect(result.scores).toBeDefined();
    // All dimension scores should be 0 because no fakeId starts with G,R,O,W,T,H
    const scores = result.scores as Record<string, number>;
    expect(scores['G']).toBe(0);
    expect(scores['R']).toBe(0);
  });

  it('submit() allows inflating a single dimension with duplicate questionIds', async () => {
    prisma.assessment.create.mockImplementation(async ({ data }) => ({
      id: 'a1',
      userId: data.userId,
      scores: data.scores,
      overallScore: data.overallScore,
      completedAt: new Date(),
    }));

    // 30 answers all claiming to be G-dimension questions with score 5
    const spikedAnswers = Array.from({ length: 30 }, (_, i) => ({
      questionId: `G${i + 1}`,
      score: 5,
    }));

    const result = await service.submit('u1', { answers: spikedAnswers });
    const scores = result.scores as Record<string, number>;

    // SEC-044: G dimension gets 30 answers all scoring 5 → average = 5
    // Other dimensions get 0 answers → 0/1 = 0
    expect(scores['G']).toBe(5);
    expect(scores['R']).toBe(0);
    expect(scores['O']).toBe(0);
    // The overall score is (5+0+0+0+0+0)/6 = 0.83 — a skewed result
    expect(result.overallScore).toBeCloseTo(0.83, 1);
  });

  it('submit() does not verify answers map 1:1 to actual QUESTIONS', async () => {
    prisma.assessment.create.mockImplementation(async ({ data }) => ({
      id: 'a1',
      userId: data.userId,
      scores: data.scores,
      overallScore: data.overallScore,
      completedAt: new Date(),
    }));

    // Mix of real and fake: submit G1-G5 legitimately, fake the rest
    const answers = [
      // 5 real G questions
      ...['G1', 'G2', 'G3', 'G4', 'G5'].map((id) => ({ questionId: id, score: 5 })),
      // 25 fake questions for other dimensions
      ...Array.from({ length: 25 }, (_, i) => ({
        questionId: `X${i}`,
        score: 1,
      })),
    ];

    const result = await service.submit('u1', { answers });
    const scores = result.scores as Record<string, number>;

    // G gets a perfect score, other dimensions are 0 (not 1, because X doesn't match)
    expect(scores['G']).toBe(5);
    expect(scores['R']).toBe(0);
  });
});
