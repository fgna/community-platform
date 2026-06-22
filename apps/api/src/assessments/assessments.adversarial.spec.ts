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
import { BadRequestException } from '@nestjs/common';

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

  it('submit() rejects fabricated questionIds not in QUESTIONS array', async () => {
    // Send 30 answers with entirely fake questionIds
    const fakeAnswers = Array.from({ length: 30 }, (_, i) => ({
      questionId: `FAKE${i}`,
      score: 5,
    }));

    // SEC-043 FIX: Service now validates questionIds against the server QUESTIONS array
    await expect(service.submit('u1', { answers: fakeAnswers })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('submit() rejects inflating a single dimension with duplicate questionIds', async () => {
    // 30 answers all claiming to be G-dimension questions with score 5
    const spikedAnswers = Array.from({ length: 30 }, (_, i) => ({
      questionId: `G${i + 1}`,
      score: 5,
    }));

    // SEC-044 FIX: Service now validates that questionIds match exactly the expected set
    await expect(service.submit('u1', { answers: spikedAnswers })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('submit() rejects a mix of real and fake questionIds', async () => {
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

    // SEC-043 FIX: Invalid questionIds are now rejected
    await expect(service.submit('u1', { answers })).rejects.toThrow(BadRequestException);
  });

  it('submit() accepts valid answers matching all QUESTIONS', async () => {
    prisma.assessment.create.mockImplementation(async ({ data }) => ({
      id: 'a1',
      userId: data.userId,
      scores: data.scores,
      overallScore: data.overallScore,
      completedAt: new Date(),
    }));

    // Build valid answers for all 30 questions
    const validAnswers = [
      ...['G1', 'G2', 'G3', 'G4', 'G5'].map((id) => ({ questionId: id, score: 4 })),
      ...['R1', 'R2', 'R3', 'R4', 'R5'].map((id) => ({ questionId: id, score: 3 })),
      ...['O1', 'O2', 'O3', 'O4', 'O5'].map((id) => ({ questionId: id, score: 5 })),
      ...['W1', 'W2', 'W3', 'W4', 'W5'].map((id) => ({ questionId: id, score: 4 })),
      ...['T1', 'T2', 'T3', 'T4', 'T5'].map((id) => ({ questionId: id, score: 3 })),
      ...['H1', 'H2', 'H3', 'H4', 'H5'].map((id) => ({ questionId: id, score: 2 })),
    ];

    const result = await service.submit('u1', { answers: validAnswers });
    expect(result.scores).toBeDefined();

    const scores = result.scores as Record<string, number>;
    expect(scores['G']).toBe(4);
    expect(scores['R']).toBe(3);
    expect(scores['O']).toBe(5);
    expect(scores['W']).toBe(4);
    expect(scores['T']).toBe(3);
    expect(scores['H']).toBe(2);
  });
});
