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
import { BadRequestException } from '@nestjs/common';
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
  it('UpsertJournalDto rejects content exceeding max length', async () => {
    const hugeContent = 'x'.repeat(1_000_000); // 1MB of text
    const dto = plainToInstance(UpsertJournalDto, {
      content: hugeContent,
    });

    const errors = await validate(dto);

    // SEC-040 FIX: @MaxLength(50000) now rejects oversized content
    expect(errors.filter((e) => e.property === 'content').length).toBeGreaterThan(0);
  });

  it('UpsertJournalDto accepts content within max length', async () => {
    const normalContent = 'x'.repeat(50000);
    const dto = plainToInstance(UpsertJournalDto, {
      content: normalContent,
      mood: 'grateful',
    });

    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'content')).toHaveLength(0);
  });
});

describe('[SEC-041] mood field accepts arbitrary strings', () => {
  it('mood rejects XSS payloads', async () => {
    const dto = plainToInstance(UpsertJournalDto, {
      content: 'Today was fine.',
      mood: '<script>alert("xss")</script>',
    });

    const errors = await validate(dto);

    // SEC-041 FIX: mood now validates against an enum of valid moods
    expect(errors.filter((e) => e.property === 'mood').length).toBeGreaterThan(0);
  });

  it('mood rejects extremely long strings', async () => {
    const dto = plainToInstance(UpsertJournalDto, {
      content: 'Entry.',
      mood: 'A'.repeat(50000),
    });

    const errors = await validate(dto);
    // SEC-041 FIX: @MaxLength(50) and @IsIn() reject oversized/invalid mood strings
    expect(errors.filter((e) => e.property === 'mood').length).toBeGreaterThan(0);
  });

  it('mood accepts valid mood values', async () => {
    const dto = plainToInstance(UpsertJournalDto, {
      content: 'Entry.',
      mood: 'grateful',
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

  it('findOne() with garbage date throws BadRequestException', async () => {
    const badDate = 'not-a-date';

    // SEC-042 FIX: Service now validates date format before parsing
    await expect(service.findOne('u1', badDate)).rejects.toThrow(BadRequestException);
  });

  it('upsert() with malformed date throws BadRequestException', async () => {
    // SEC-042 FIX: Service now validates date format before parsing
    await expect(
      service.upsert('u1', '__proto__', { content: 'test', mood: 'grateful' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('month query parameter with invalid month value is rejected', async () => {
    // SEC-042 FIX: Service now validates month format (YYYY-MM with valid month range)
    await expect(service.findAll('u1', '2026-13')).rejects.toThrow(BadRequestException);
  });

  it('month param with extra segments is rejected', async () => {
    // SEC-042 FIX: Extra segments after YYYY-MM are now rejected
    await expect(service.findAll('u1', '2026-06-INJECTED')).rejects.toThrow(BadRequestException);
  });

  it('valid dates are accepted', async () => {
    prisma.journalEntry.findUnique.mockResolvedValue({
      id: 'j1',
      userId: 'u1',
      date: new Date('2026-06-15T00:00:00.000Z'),
      content: 'test',
      mood: 'grateful',
    });

    const result = await service.findOne('u1', '2026-06-15');
    expect(result).toBeDefined();
    expect(result.id).toBe('j1');
  });

  it('valid month is accepted', async () => {
    prisma.journalEntry.findMany.mockResolvedValue([]);

    const result = await service.findAll('u1', '2026-06');
    expect(result).toEqual([]);
  });
});
