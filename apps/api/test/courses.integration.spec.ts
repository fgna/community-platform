import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanupByEmailSuffix, registerUser, createAdminUser, bearer } from './helpers';

const SUFFIX = '@courses.int.test';

describe('Courses — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let memberToken: string;
  let courseId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanupByEmailSuffix(prisma, SUFFIX);

    const admin = await createAdminUser(prisma, app, `admin${SUFFIX}`);
    adminToken = admin.accessToken;

    const member = await registerUser(app, `member${SUFFIX}`, 'Member User');
    memberToken = member.accessToken;

    const courseRes = await request(app.getHttpServer())
      .post('/api/courses')
      .set(bearer(adminToken))
      .send({ title: 'Integration Course', description: 'Test course', isPublished: true });
    courseId = courseRes.body.id;
  });

  afterAll(async () => {
    if (courseId) {
      await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    }
    await cleanupByEmailSuffix(prisma, SUFFIX);
    await app.close();
  });

  // ── List ──────────────────────────────────────────────────────────────────

  describe('GET /api/courses', () => {
    it('200 — returns paginated courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/courses')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/courses').expect(401);
    });
  });

  // ── Detail ────────────────────────────────────────────────────────────────

  describe('GET /api/courses/:id', () => {
    it('200 — returns course with modules', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/courses/${courseId}`)
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body.id).toBe(courseId);
      expect(res.body.title).toBe('Integration Course');
      expect(res.body).toHaveProperty('modules');
    });

    it('404 — non-existent course', async () => {
      await request(app.getHttpServer())
        .get('/api/courses/nonexistent-id')
        .set(bearer(memberToken))
        .expect(404);
    });
  });

  // ── Progress ──────────────────────────────────────────────────────────────

  describe('PUT /api/courses/:id/progress', () => {
    it('200 — updates and returns progress', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/courses/${courseId}/progress`)
        .set(bearer(memberToken))
        .send({ percentage: 50 })
        .expect(200);

      expect(res.body.percentage).toBe(50);
    });

    it('200 — updates progress again', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/courses/${courseId}/progress`)
        .set(bearer(memberToken))
        .send({ percentage: 100 })
        .expect(200);

      expect(res.body.percentage).toBe(100);
    });
  });

  // ── Admin CRUD ────────────────────────────────────────────────────────────

  describe('Admin course management', () => {
    it('201 — admin creates a course', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/courses')
        .set(bearer(adminToken))
        .send({ title: 'New Course', description: 'Fresh from admin', isPublished: false })
        .expect(201);

      expect(res.body.title).toBe('New Course');
      expect(res.body.isPublished).toBe(false);
      await prisma.course.delete({ where: { id: res.body.id } });
    });

    it('403 — member cannot create a course', async () => {
      await request(app.getHttpServer())
        .post('/api/courses')
        .set(bearer(memberToken))
        .send({ title: 'Sneaky Course', description: 'Not allowed' })
        .expect(403);
    });

    it('200 — admin updates a course', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/courses/${courseId}`)
        .set(bearer(adminToken))
        .send({ title: 'Updated Integration Course' })
        .expect(200);

      expect(res.body.title).toBe('Updated Integration Course');

      // Restore title for subsequent tests
      await request(app.getHttpServer())
        .put(`/api/courses/${courseId}`)
        .set(bearer(adminToken))
        .send({ title: 'Integration Course' });
    });
  });
});
