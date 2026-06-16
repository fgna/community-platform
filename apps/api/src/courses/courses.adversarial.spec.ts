/**
 * ADVERSARIAL TESTS: Courses & Learning Hub
 *
 * Attack surfaces:
 * - Unpublished courses accessible directly by ID (no isPublished guard in findOne)
 * - Lessons inside unpublished courses accessible via getLesson
 * - Course progress accepts out-of-range percentages (negative, >100, NaN, Infinity)
 * - Progress can be set on unpublished or non-existent courses
 * - Concurrent progress updates race on the upsert (data consistency)
 * - Progress can regress: setting 100% then 50% clears completedAt
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

function buildMockPrisma() {
  return {
    course: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    progress: {
      upsert: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
  };
}

async function buildService(prisma: ReturnType<typeof buildMockPrisma>) {
  const module = await Test.createTestingModule({
    providers: [
      CoursesService,
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile();
  return module.get<CoursesService>(CoursesService);
}

describe('CoursesService — adversarial', () => {
  let prisma: ReturnType<typeof buildMockPrisma>;
  let service: CoursesService;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    service = await buildService(prisma);
    vi.clearAllMocks();
  });

  // ── INVARIANT: unpublished courses must not be readable by members ──────

  describe('INVARIANT: unpublished courses are not publicly accessible', () => {
    it('findOne returns unpublished course when called with its ID', async () => {
      /**
       * courses.service.ts:35-54 — findOne queries `where: { id }` with NO
       * isPublished filter.
       *
       * If an attacker knows or guesses a course ID (cuid is not secret),
       * they can read the full course content, modules, and lessons of a
       * draft course before it is published.
       *
       * Expected: 404 for unpublished courses (to non-admins)
       * Actual: full course returned
       */
      const draftCourse = {
        id: 'course-draft',
        title: 'Unreleased Premium Content',
        description: 'Secret curriculum',
        isPublished: false,
        modules: [
          {
            id: 'm1',
            title: 'Module 1',
            order: 1,
            lessons: [
              { id: 'l1', title: 'Secret Lesson', content: 'Confidential material', order: 1 },
            ],
          },
        ],
        progress: [],
        _count: { progress: 0 },
      };
      prisma.course.findUnique.mockResolvedValue(draftCourse);

      const result = await service.findOne('course-draft', 'random-user');

      // Full unpublished course content returned — content leak
      expect(result.isPublished).toBe(false);
      expect(result.modules[0].lessons[0].content).toBe('Confidential material');
    });

    it('getLesson returns lesson from unpublished course', async () => {
      /**
       * courses.service.ts:102-109 — getLesson retrieves the lesson without
       * checking if its parent course is published.
       * A member can access lesson content for a draft course by ID.
       */
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'lesson-1',
        title: 'Secret Lesson',
        content: 'Premium undisclosed content',
        order: 1,
        module: {
          id: 'module-1',
          course: {
            id: 'course-draft',
            isPublished: false,
            title: 'Draft Course',
          },
        },
      });

      const result = await service.getLesson('lesson-1');

      // Lesson content from unpublished course is returned
      expect(result.module.course.isPublished).toBe(false);
      expect(result.content).toBe('Premium undisclosed content');
    });
  });

  // ── INVARIANT: progress percentage must be between 0 and 100 ────────────

  describe('INVARIANT: progress percentage has no bounds validation', () => {
    it('negative percentage is accepted and stored', async () => {
      /**
       * courses.service.ts:83-99 — no bounds check on percentage.
       * Setting percentage = -50 stores a negative value.
       * Client code displaying "50% complete" becomes "-50% complete".
       * completedAt is also not set (percentage >= 100 check is not triggered).
       */
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true });
      prisma.progress.upsert.mockResolvedValue({
        userId: 'u1',
        courseId: 'c1',
        percentage: -50,
        completedAt: null,
      });

      const result = await service.updateProgress('c1', 'u1', -50);
      expect(result.percentage).toBe(-50);
    });

    it('percentage > 100 triggers completion just as 100 does (≥100 check)', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true });
      prisma.progress.upsert.mockImplementation(({ update }: any) => ({
        userId: 'u1',
        courseId: 'c1',
        percentage: 999,
        completedAt: update.completedAt,
      }));

      const result = await service.updateProgress('c1', 'u1', 999);
      // completedAt is set because 999 >= 100
      expect(result.completedAt).not.toBeNull();
    });

    it('NaN percentage is passed to upsert without error', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true });
      prisma.progress.upsert.mockResolvedValue({
        userId: 'u1',
        courseId: 'c1',
        percentage: NaN,
        completedAt: null,
      });

      const result = await service.updateProgress('c1', 'u1', NaN);
      expect(result.percentage).toBeNaN();
    });

    it('Infinity percentage is accepted (completedAt triggered)', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true });
      prisma.progress.upsert.mockImplementation(({ update }: any) => ({
        userId: 'u1',
        courseId: 'c1',
        percentage: Infinity,
        completedAt: update.completedAt,
      }));

      const result = await service.updateProgress('c1', 'u1', Infinity);
      expect(result.completedAt).not.toBeNull();
    });
  });

  // ── INVARIANT: progress on unpublished course must be rejected ───────────

  describe('INVARIANT: progress can be set on unpublished courses', () => {
    it('updateProgress accepts a draft course ID — no isPublished check', async () => {
      /**
       * updateProgress only checks the course exists (not that it's published).
       * A user can track progress on a course that isn't officially available.
       * When the course is deleted, progress records orphan or cascade-delete.
       */
      prisma.course.findUnique.mockResolvedValue({
        id: 'draft-course',
        isPublished: false,
      });
      prisma.progress.upsert.mockResolvedValue({
        userId: 'u1',
        courseId: 'draft-course',
        percentage: 50,
        completedAt: null,
      });

      const result = await service.updateProgress('draft-course', 'u1', 50);
      expect(result.percentage).toBe(50);
      // No error — progress on unpublished content is silently accepted
    });
  });

  // ── INVARIANT: progress cannot regress without clearing completedAt ──────

  describe('INVARIANT: completion state regression', () => {
    it('setting percentage to 50 after 100 sets completedAt to null (regression)', async () => {
      /**
       * courses.service.ts:90 — completedAt: percentage >= 100 ? new Date() : null
       * If a user has 100% (completed), then an admin/system sets it back to 50%,
       * completedAt is explicitly nulled. Completion certificates or rewards
       * issued based on completedAt could be invalidated retroactively.
       */
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true });
      prisma.progress.upsert.mockImplementation(({ update }: any) => ({
        userId: 'u1',
        courseId: 'c1',
        percentage: 50,
        completedAt: update.completedAt,
      }));

      const result = await service.updateProgress('c1', 'u1', 50);
      expect(result.completedAt).toBeNull();
      // Completion badge/certificate would be invalidated
    });
  });

  // ── INVARIANT: concurrent progress updates must not produce inconsistency ─

  describe('INVARIANT: concurrent progress updates', () => {
    it('two simultaneous updates to different percentages produce non-deterministic result', async () => {
      /**
       * The upsert is not wrapped in a transaction with optimistic locking.
       * Two concurrent calls (e.g. two browser tabs) can race.
       * The "last write wins" but which write wins is non-deterministic.
       *
       * For monotonically increasing progress this is acceptable, but the
       * service allows any percentage value (including regression), so a
       * stale update arriving last could overwrite a higher value.
       */
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', isPublished: true });

      let upsertCount = 0;
      prisma.progress.upsert.mockImplementation(({ update }: any) => {
        upsertCount++;
        return Promise.resolve({
          userId: 'u1',
          courseId: 'c1',
          percentage: update.percentage,
          completedAt: update.completedAt,
        });
      });

      // Concurrent: one racing to 80%, other racing to 60%
      const [high, low] = await Promise.all([
        service.updateProgress('c1', 'u1', 80),
        service.updateProgress('c1', 'u1', 60),
      ]);

      // Both succeed — no conflict detection
      expect(upsertCount).toBe(2);
      // The final DB value is non-deterministic (last write wins)
      expect([high.percentage, low.percentage]).toContain(80);
      expect([high.percentage, low.percentage]).toContain(60);
    });
  });

  // ── INVARIANT: pagination edge cases ────────────────────────────────────

  describe('INVARIANT: findAll pagination', () => {
    it('limit=0 produces Infinity totalPages', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(10);

      const result = await service.findAll(1, 0);
      expect(result.totalPages).toBe(Infinity);
    });
  });
});
