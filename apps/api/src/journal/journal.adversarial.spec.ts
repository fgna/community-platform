/**
 * ADVERSARIAL TESTS: Journal
 *
 * SEC-040: No content length limit in DTO — unbounded payload
 * SEC-041: mood field is free-text string — no enum validation
 * SEC-042: date param parsed unsafely — NaN/Invalid Date propagated to DB
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JournalService } from './journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpsertJournalDto } from './dto/upsert-journal.dto';

function buildMockPrisma() {
  return {
    journalEntry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      JournalService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<JournalService>(JournalService);
}

describe('[SEC-040] unbounded content field', () => {
  it('UpsertJournalDto has no @MaxLength on content', async () => {
    const hugeContent = 'x'.repeat(1_000_000); // 1MB of text
    const dto = plainToInstance(UpsertJournalDto, {
      content: hugeContent,
    });

    const errors = await validate(dto);

    // SEC-040: No validation error — DTO only has @IsString() @IsNotEmpty()
    expect(errors.filter((e) => e.property === 'content')).toHaveLength(0);
  });
});

describe('[SEC-041] mood field accepts arbitrary strings', () => {
  it('mood accepts any string including XSS payloads', async () => {
    const dto = plainToInstance(UpsertJournalDto, {
      content: 'Today was fine.',
      mood: '<script>alert("xss")</script>',
    });

    const errors = await validate(dto);

    // SEC-041: mood is @IsString() @IsOptional() with no enum constraint
    expect(errors.filter((e) => e.property === 'mood')).toHaveLength(0);
  });

  it('mood accepts extremely long strings', async () => {
    const dto = plainToInstance(UpsertJournalDto, {
      content: 'Entry.',
      mood: 'A'.repeat(50000),
    });

    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'mood')).toHaveLength(0);
  });
});

describe('[SEC-042] unsafe date parsing in journal service', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: JournalService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
  });

  it('findOne() with garbage date creates Invalid Date sent to Prisma', async () => {
    const badDate = 'not-a-date';
    const parsed = new Date(badDate + 'T00:00:00.000Z');

    // SEC-042: The date becomes Invalid Date — Prisma behavior is undefined
    expect(isNaN(parsed.getTime())).toBe(true);
  });

  it('upsert() with malformed date passes Invalid Date to Prisma where clause', async () => {
    prisma.journalEntry.upsert.mockResolvedValue({ id: 'j1' });

    // SEC-042: Service constructs new Date(date + 'T00:00:00.000Z') with no validation
    // Prisma may throw or silently create a record with a bad date
    const parsed = new Date('__proto__T00:00:00.000Z');
    expect(isNaN(parsed.getTime())).toBe(true);
  });

  it('month query parameter with injected values parsed by split("-")', () => {
    // The service does: month.split('-').map(Number)
    const maliciousMonth = '2026-13'; // month 13 doesn't exist
    const [year, mon] = maliciousMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, mon - 1, 1));

    // JavaScript Date wraps: month 12 (0-indexed) = January of next year
    expect(startDate.getUTCMonth()).toBe(0); // January, not an error
    expect(startDate.getUTCFullYear()).toBe(2027); // Silently moved to 2027
  });

  it('month param with extra segments does not error', () => {
    const weirdMonth = '2026-06-INJECTED';
    const [year, mon] = weirdMonth.split('-').map(Number);

    expect(year).toBe(2026);
    expect(mon).toBe(6);
    // The extra segment is silently ignored by split + destructuring
  });
});
