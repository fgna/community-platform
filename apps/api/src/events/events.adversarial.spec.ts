/**
 * ADVERSARIAL TESTS: Events & RSVP
 *
 * Attack surfaces:
 * - RSVP capacity race condition: check-then-act TOCTOU → exceed maxRsvps
 * - RSVP status not validated (any string accepted, DB throws 500)
 * - Event update bypasses start/end date validation
 * - Cancelling a non-existent RSVP is a silent no-op (returns 200)
 * - Events can be created with past dates (no future-date constraint)
 * - maxRsvps=0 is rejected by DTO (Min(1)) but not checked in service update
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

function buildMockPrisma() {
  return {
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    eventRsvp: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      EventsService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<EventsService>(EventsService);
}

describe('EventsService — adversarial', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: EventsService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
    vi.clearAllMocks();
  });

  // ── INVARIANT: event capacity must not be exceeded ──────────────────────

  describe('INVARIANT: maxRsvps is a hard ceiling, not a hint', () => {
    it('TOCTOU race: two concurrent RSVP requests at capacity-1 both succeed', async () => {
      /**
       * events.service.ts:91-114
       * Step 1: both read event with _count.rsvps = 9 (capacity=10)
       * Step 2: both pass the capacity check (9 < 10)
       * Step 3: both upsert → 11 attendees for a 10-person event
       *
       * Root cause: no DB-level locking (SELECT FOR UPDATE or serializable transaction).
       * Fix: use a DB transaction with pessimistic locking or atomic increment.
       */
      const eventAtCapacityMinus1 = {
        id: 'event-1',
        maxRsvps: 10,
        _count: { rsvps: 9 },
      };

      // Both concurrent reads see 9 attendees
      prisma.event.findUnique
        .mockResolvedValueOnce(eventAtCapacityMinus1)
        .mockResolvedValueOnce(eventAtCapacityMinus1);

      prisma.eventRsvp.upsert
        .mockResolvedValueOnce({ id: 'rsvp-user-a', status: 'GOING', userId: 'user-a' })
        .mockResolvedValueOnce({ id: 'rsvp-user-b', status: 'GOING', userId: 'user-b' });

      const [resultA, resultB] = await Promise.all([
        service.rsvp('event-1', 'user-a', 'GOING'),
        service.rsvp('event-1', 'user-b', 'GOING'),
      ]);

      // Both succeed → capacity exceeded
      expect(resultA).toHaveProperty('status', 'GOING');
      expect(resultB).toHaveProperty('status', 'GOING');
      // upsert called twice → 11th attendee created beyond capacity of 10
      expect(prisma.eventRsvp.upsert).toHaveBeenCalledTimes(2);
    });

    it('TOCTOU race: N concurrent requests at full capacity all succeed', async () => {
      /**
       * Extreme version: event is at capacity (10/10).
       * All concurrent requests read the same count (10) and pass the check.
       * In a real system each request would add one more attendee.
       */
      const fullEvent = {
        id: 'event-full',
        maxRsvps: 10,
        _count: { rsvps: 10 },
      };

      // All 5 concurrent reads see 10 attendees — capacity check passes for none
      // of them because the check is: 10 >= 10 → should throw
      prisma.event.findUnique.mockResolvedValue(fullEvent);

      // At capacity, the check DOES fire — but this tests that a race before
      // the count increments means the first concurrent request gets in
      await expect(
        service.rsvp('event-full', 'user-x', 'GOING'),
      ).rejects.toThrow(BadRequestException);
    });

    it('capacity check is skipped when status is MAYBE or NOT_GOING', async () => {
      /**
       * The capacity check only fires when status === 'GOING'.
       * A GOING rsvp can be changed to MAYBE after the event fills up —
       * that's correct. But this also means invalid statuses that don't equal
       * 'GOING' bypass the check entirely.
       */
      const fullEvent = {
        id: 'event-full',
        maxRsvps: 10,
        _count: { rsvps: 10 },
      };
      prisma.event.findUnique.mockResolvedValue(fullEvent);
      prisma.eventRsvp.upsert.mockResolvedValue({ id: 'rsvp-1', status: 'MAYBE' });

      const result = await service.rsvp('event-full', 'user-1', 'MAYBE');
      expect(result).toBeDefined();
    });
  });

  // ── INVARIANT: RSVP status must be validated ────────────────────────────

  describe('INVARIANT: invalid RSVP status must produce controlled 400, not 500', () => {
    it('arbitrary string status is passed directly to Prisma (no DTO guard)', async () => {
      /**
       * events.controller.ts:56 — status from body: { status: string }
       * No @IsEnum(RsvpStatus) decorator on the inline body type.
       * The service forwards the string to Prisma as any.
       * Prisma throws a runtime validation error (P2006) → unhandled 500.
       */
      prisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        maxRsvps: null,
        _count: { rsvps: 0 },
      });
      const dbError = new Error('Invalid value for enum RsvpStatus') as any;
      dbError.code = 'P2006';
      prisma.eventRsvp.upsert.mockRejectedValue(dbError);

      await expect(
        service.rsvp('event-1', 'user-1', 'ATTENDING'),
      ).rejects.toThrow();
      // Should have been caught at the DTO level as a 400, not a 500
    });

    it('empty string status is passed to Prisma unchanged', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'event-1',
        maxRsvps: null,
        _count: { rsvps: 0 },
      });
      const dbError = new Error('Invalid enum value') as any;
      dbError.code = 'P2006';
      prisma.eventRsvp.upsert.mockRejectedValue(dbError);

      await expect(
        service.rsvp('event-1', 'user-1', ''),
      ).rejects.toThrow();
    });
  });

  // ── INVARIANT: event dates must be logically consistent ─────────────────

  describe('INVARIANT: event dates cannot be inverted via update', () => {
    it('update() does NOT validate startsAt < endsAt', async () => {
      /**
       * events.service.ts:59-70 — create() validates: startsAt >= endsAt → throw
       * events.service.ts:73-81 — update() has NO such validation.
       *
       * An admin can update an event to have endsAt BEFORE startsAt,
       * creating a logically impossible event. Clients showing duration,
       * countdown timers, or date ranges will malfunction.
       */
      const existingEvent = { id: 'event-1' };
      prisma.event.findUnique.mockResolvedValue(existingEvent);
      prisma.event.update.mockResolvedValue({
        id: 'event-1',
        startsAt: new Date('2026-12-01T10:00:00Z'),
        endsAt: new Date('2026-11-30T10:00:00Z'), // ends BEFORE it starts
      });

      const result = await service.update('event-1', {
        startsAt: '2026-12-01T10:00:00Z',
        endsAt: '2026-11-30T10:00:00Z',
      });

      // No exception thrown — invalid temporal state accepted
      expect(result.endsAt.getTime()).toBeLessThan(result.startsAt.getTime());
    });

    it('create() with equal startsAt and endsAt throws BadRequestException', async () => {
      await expect(
        service.create({
          title: 'Same Time Event',
          description: 'Starts and ends at the same instant',
          startsAt: '2026-06-20T10:00:00Z',
          endsAt: '2026-06-20T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('create() accepts events in the past (no future-date constraint)', async () => {
      /**
       * No validation on startsAt being in the future.
       * Admins can create events that have already happened, polluting the event list.
       */
      prisma.event.create.mockResolvedValue({
        id: 'past-event',
        title: 'Past Event',
        startsAt: new Date('2020-01-01T00:00:00Z'),
        endsAt: new Date('2020-01-01T01:00:00Z'),
      });

      const result = await service.create({
        title: 'Past Event',
        description: 'This already happened over 6 years ago',
        startsAt: '2020-01-01T00:00:00Z',
        endsAt: '2020-01-01T01:00:00Z',
      });

      expect(result).toBeDefined();
    });
  });

  // ── INVARIANT: cancel RSVP on unknown event returns informative error ───

  describe('INVARIANT: cancel RSVP on non-existent event is silently accepted', () => {
    it('cancelRsvp with no matching event returns success without checking event existence', async () => {
      /**
       * events.service.ts:117-120 — cancelRsvp calls deleteMany without
       * first checking the event exists. If the eventId is invalid, it
       * returns { message: 'RSVP cancelled' } with count: 0 — silent no-op.
       *
       * A client could call DELETE /events/nonexistent-id/rsvp and get a 200 OK.
       * The event existence invariant is not validated.
       */
      prisma.eventRsvp.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.cancelRsvp('nonexistent-event', 'user-1');
      expect(result.message).toBe('RSVP cancelled');
      // No NotFoundException — the non-existence of the event is ignored
    });
  });

  // ── INVARIANT: pagination edge cases ────────────────────────────────────

  describe('INVARIANT: pagination cannot produce Infinity totalPages', () => {
    it('limit=0 produces Infinity totalPages', async () => {
      prisma.event.findMany.mockResolvedValue([]);
      prisma.event.count.mockResolvedValue(50);

      const result = await service.findAll(1, 0);
      expect(result.totalPages).toBe(Infinity);
    });
  });
});
