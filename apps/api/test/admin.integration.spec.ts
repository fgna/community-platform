import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanupByEmailSuffix, registerUser, createAdminUser, bearer } from './helpers';

const SUFFIX = '@admin.int.test';

describe('Admin — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;
  let memberToken: string;
  let memberUserId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanupByEmailSuffix(prisma, SUFFIX);

    const admin = await createAdminUser(prisma, app, `admin${SUFFIX}`);
    adminToken = admin.accessToken;
    adminUserId = admin.userId;

    const member = await registerUser(app, `member${SUFFIX}`, 'Member User');
    memberToken = member.accessToken;
    memberUserId = member.userId;
  });

  afterAll(async () => {
    await cleanupByEmailSuffix(prisma, SUFFIX);
    await app.close();
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  describe('GET /api/admin/stats', () => {
    it('200 — returns platform statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/stats')
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('posts');
    });

    it('403 — member cannot access', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/stats')
        .set(bearer(memberToken))
        .expect(403);
    });
  });

  // ── User management ───────────────────────────────────────────────────────

  describe('GET /api/admin/users', () => {
    it('200 — returns all users (including inactive)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });

    it('403 — member cannot list users via admin', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set(bearer(memberToken))
        .expect(403);
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('200 — admin can change member role to ADMIN', async () => {
      const target = await registerUser(app, `rolechange${SUFFIX}`, 'Role Target');

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/users/${target.userId}/role`)
        .set(bearer(adminToken))
        .send({ role: 'ADMIN' })
        .expect(200);

      expect(res.body.role).toBe('ADMIN');
    });

    it('403 — member cannot change roles', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/users/${memberUserId}/role`)
        .set(bearer(memberToken))
        .send({ role: 'ADMIN' })
        .expect(403);
    });
  });

  describe('PATCH /api/admin/users/:id/toggle-active', () => {
    it('200 — admin can deactivate a member', async () => {
      const target = await registerUser(app, `deactivate${SUFFIX}`, 'Deactivate Target');

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/users/${target.userId}/toggle-active`)
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });
  });

  // ── Post moderation ───────────────────────────────────────────────────────

  describe('PATCH /api/admin/posts/:id/hide', () => {
    it('200 — admin can hide a post', async () => {
      const postRes = await request(app.getHttpServer())
        .post('/api/posts')
        .set(bearer(memberToken))
        .send({ content: 'Post to hide' });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/posts/${postRes.body.id}/hide`)
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body.isHidden).toBe(true);
    });
  });

  describe('PATCH /api/admin/posts/:id/pin', () => {
    it('200 — admin can pin a post', async () => {
      const postRes = await request(app.getHttpServer())
        .post('/api/posts')
        .set(bearer(memberToken))
        .send({ content: 'Post to pin' });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/posts/${postRes.body.id}/pin`)
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body.isPinned).toBe(true);
    });
  });

  // ── Moderation queue ──────────────────────────────────────────────────────

  describe('GET /api/admin/moderation', () => {
    it('200 — returns moderation queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/moderation')
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── Audit log ─────────────────────────────────────────────────────────────

  describe('GET /api/admin/audit-log', () => {
    it('200 — returns audit log entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/audit-log')
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ── Platform settings ─────────────────────────────────────────────────────

  describe('GET /api/admin/settings', () => {
    it('200 — returns platform settings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/settings')
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body).toHaveProperty('platformName');
    });
  });

  // ── Invites ───────────────────────────────────────────────────────────────

  describe('POST /api/admin/invites', () => {
    it('201 — admin can create an invite', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/invites')
        .set(bearer(adminToken))
        .send({ email: `invited${SUFFIX}` })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe(`invited${SUFFIX}`);
    });

    it('403 — member cannot create invites', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/invites')
        .set(bearer(memberToken))
        .send({ email: `nope${SUFFIX}` })
        .expect(403);
    });
  });

  describe('GET /api/admin/invites', () => {
    it('200 — returns invite list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/invites')
        .set(bearer(adminToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
