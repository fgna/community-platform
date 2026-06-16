import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanupByEmailSuffix, registerUser } from './helpers';

const SUFFIX = '@auth.int.test';

describe('Auth — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanupByEmailSuffix(prisma, SUFFIX);
  });

  afterAll(async () => {
    await cleanupByEmailSuffix(prisma, SUFFIX);
    await app.close();
  });

  // ── Register ──────────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('201 — creates user and returns tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `new${SUFFIX}`, name: 'New User', password: 'Password123!' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(`new${SUFFIX}`);
      expect(res.body.user.role).toBe('MEMBER');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('409 — duplicate email', async () => {
      const email = `dupe${SUFFIX}`;
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, name: 'First', password: 'Password123!' });

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, name: 'Second', password: 'Password123!' })
        .expect(409);
    });

    it('400 — password too short', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `short${SUFFIX}`, name: 'User', password: '123' })
        .expect(400);
    });

    it('400 — invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', name: 'User', password: 'Password123!' })
        .expect(400);
    });

    it('400 — missing name', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `noname${SUFFIX}`, password: 'Password123!' })
        .expect(400);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    const email = `login${SUFFIX}`;

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, name: 'Login User', password: 'Password123!' });
    });

    it('200 — valid credentials return tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Password123!' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(email);
    });

    it('401 — wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword!' })
        .expect(401);
    });

    it('401 — unknown email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `ghost${SUFFIX}`, password: 'Password123!' })
        .expect(401);
    });
  });

  // ── Refresh ───────────────────────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('200 — returns new access token', async () => {
      const { refreshToken } = await registerUser(app, `refresh${SUFFIX}`, 'Refresh User');

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('401 — invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'not-a-real-token' })
        .expect(401);
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('200 — invalidates refresh token', async () => {
      const { refreshToken } = await registerUser(app, `logout${SUFFIX}`, 'Logout User');

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
