import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanupByEmailSuffix, registerUser, bearer } from './helpers';

const SUFFIX = '@gdpr.int.test';

describe('GDPR — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let memberToken: string;
  let memberUserId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanupByEmailSuffix(prisma, SUFFIX);

    const member = await registerUser(app, `member${SUFFIX}`, 'GDPR User');
    memberToken = member.accessToken;
    memberUserId = member.userId;
  });

  afterAll(async () => {
    await cleanupByEmailSuffix(prisma, SUFFIX);
    await app.close();
  });

  // ── Cookie consent ────────────────────────────────────────────────────────

  describe('POST /api/gdpr/consent', () => {
    it('200/201 — saves cookie consent', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gdpr/consent')
        .set(bearer(memberToken))
        .send({ analytics: true, marketing: false });

      expect([200, 201]).toContain(res.status);
      expect(res.body.analytics).toBe(true);
      expect(res.body.marketing).toBe(false);
    });
  });

  describe('GET /api/gdpr/consent', () => {
    it('200 — returns current consent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gdpr/consent')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body).toHaveProperty('analytics');
      expect(res.body).toHaveProperty('marketing');
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/gdpr/consent').expect(401);
    });
  });

  // ── Anonymous consent ─────────────────────────────────────────────────────

  describe('POST /api/gdpr/consent/anonymous', () => {
    it('200/201 — saves anonymous consent without auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gdpr/consent/anonymous')
        .send({ sessionId: 'test-session-123', analytics: false, marketing: false });

      expect([200, 201]).toContain(res.status);
    });
  });

  // ── Data export ───────────────────────────────────────────────────────────

  describe('GET /api/gdpr/export', () => {
    it('200 — exports user data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gdpr/export')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(memberUserId);
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/gdpr/export').expect(401);
    });
  });

  // ── Privacy settings ──────────────────────────────────────────────────────

  describe('GET /api/gdpr/privacy-settings', () => {
    it('200 — returns privacy settings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gdpr/privacy-settings')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body).toHaveProperty('consent');
    });
  });

  // ── Account deletion ──────────────────────────────────────────────────────

  describe('DELETE /api/gdpr/account', () => {
    it('200 — anonymizes and deactivates account', async () => {
      const victim = await registerUser(app, `deleteme${SUFFIX}`, 'Delete Me');

      const res = await request(app.getHttpServer())
        .delete('/api/gdpr/account')
        .set(bearer(victim.accessToken))
        .expect(200);

      expect(res.body.message).toBeDefined();

      const user = await prisma.user.findUnique({ where: { id: victim.userId } });
      expect(user?.isActive).toBe(false);
      expect(user?.name).toBe('Deleted User');
    });
  });
});
