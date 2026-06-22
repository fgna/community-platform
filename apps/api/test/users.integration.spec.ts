import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanupByEmailSuffix, registerUser, bearer } from './helpers';

const SUFFIX = '@users.int.test';

describe('Users — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let memberToken: string;
  let memberUserId: string;
  let otherToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanupByEmailSuffix(prisma, SUFFIX);

    const member = await registerUser(app, `member${SUFFIX}`, 'Member User');
    memberToken = member.accessToken;
    memberUserId = member.userId;

    const other = await registerUser(app, `other${SUFFIX}`, 'Other User');
    otherToken = other.accessToken;
    otherUserId = other.userId;
  });

  afterAll(async () => {
    await cleanupByEmailSuffix(prisma, SUFFIX);
    await app.close();
  });

  // ── Member directory ──────────────────────────────────────────────────────

  describe('GET /api/users', () => {
    it('200 — returns paginated user list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('200 — does not expose email addresses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set(bearer(memberToken))
        .expect(200);

      for (const user of res.body.data) {
        expect(user).not.toHaveProperty('email');
        expect(user).not.toHaveProperty('passwordHash');
      }
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });
  });

  // ── Profile ───────────────────────────────────────────────────────────────

  describe('GET /api/users/me', () => {
    it('200 — returns current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body.id).toBe(memberUserId);
      expect(res.body.name).toBe('Member User');
    });
  });

  describe('PATCH /api/users/me', () => {
    it('200 — updates profile fields', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set(bearer(memberToken))
        .send({ name: 'Updated Name', bio: 'My bio' })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
      expect(res.body.bio).toBe('My bio');
    });

    it('400 — rejects javascript: avatar URL', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/me')
        .set(bearer(memberToken))
        .send({ avatarUrl: 'javascript:alert(1)' })
        .expect(400);
    });
  });

  // ── Get user by ID ────────────────────────────────────────────────────────

  describe('GET /api/users/:id', () => {
    it('200 — returns user profile with follow status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${otherUserId}`)
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body.id).toBe(otherUserId);
      expect(res.body.name).toBe('Other User');
    });

    it('404 — unknown user ID', async () => {
      await request(app.getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set(bearer(memberToken))
        .expect(404);
    });
  });

  // ── Follow / Unfollow ─────────────────────────────────────────────────────

  describe('POST /api/users/:id/follow', () => {
    it('201 — follow a user', async () => {
      await request(app.getHttpServer())
        .post(`/api/users/${otherUserId}/follow`)
        .set(bearer(memberToken))
        .expect(201);
    });

    it('confirms follow status on profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${otherUserId}`)
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body.isFollowing).toBe(true);
    });
  });

  describe('DELETE /api/users/:id/follow', () => {
    it('200 — unfollow a user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${otherUserId}/follow`)
        .set(bearer(memberToken))
        .expect(200);
    });

    it('confirms unfollow status on profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${otherUserId}`)
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body.isFollowing).toBe(false);
    });
  });
});
