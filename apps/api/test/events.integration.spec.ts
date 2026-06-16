import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanupByEmailSuffix, registerUser, createAdminUser, bearer } from './helpers';

const SUFFIX = '@events.int.test';

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();
const dayAfterTomorrow = () => new Date(Date.now() + 172_800_000).toISOString();

describe('Events — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let memberToken: string;
  let memberUserId: string;
  let eventId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanupByEmailSuffix(prisma, SUFFIX);

    const admin = await createAdminUser(prisma, app, `admin${SUFFIX}`);
    adminToken = admin.accessToken;

    const member = await registerUser(app, `member${SUFFIX}`, 'Member User');
    memberToken = member.accessToken;
    memberUserId = member.userId;

    const eventRes = await request(app.getHttpServer())
      .post('/api/events')
      .set(bearer(adminToken))
      .send({
        title: 'Integration Event',
        description: 'Test event for integration tests',
        startsAt: tomorrow(),
        endsAt: dayAfterTomorrow(),
        location: 'Online',
      });
    eventId = eventRes.body.id;
  });

  afterAll(async () => {
    if (eventId) {
      await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    }
    await cleanupByEmailSuffix(prisma, SUFFIX);
    await app.close();
  });

  // ── List ──────────────────────────────────────────────────────────────────

  describe('GET /api/events', () => {
    it('200 — returns paginated events list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/events')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/events').expect(401);
    });
  });

  // ── Detail ────────────────────────────────────────────────────────────────

  describe('GET /api/events/:id', () => {
    it('200 — returns event detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body.id).toBe(eventId);
      expect(res.body.title).toBe('Integration Event');
      expect(res.body.location).toBe('Online');
    });

    it('404 — non-existent event', async () => {
      await request(app.getHttpServer())
        .get('/api/events/nonexistent-id')
        .set(bearer(memberToken))
        .expect(404);
    });
  });

  // ── RSVP ─────────────────────────────────────────────────────────────────

  describe('POST /api/events/:id/rsvp', () => {
    it('201 — GOING sets RSVP', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventId}/rsvp`)
        .set(bearer(memberToken))
        .send({ status: 'GOING' })
        .expect(201);

      expect(res.body.status).toBe('GOING');
      expect(res.body.userId).toBe(memberUserId);
    });

    it('201 — changes RSVP to MAYBE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventId}/rsvp`)
        .set(bearer(memberToken))
        .send({ status: 'MAYBE' })
        .expect(201);

      expect(res.body.status).toBe('MAYBE');
    });

    it('201 — changes RSVP to NOT_GOING', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/events/${eventId}/rsvp`)
        .set(bearer(memberToken))
        .send({ status: 'NOT_GOING' })
        .expect(201);

      expect(res.body.status).toBe('NOT_GOING');
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${eventId}/rsvp`)
        .send({ status: 'GOING' })
        .expect(401);
    });
  });

  // ── Admin event management ────────────────────────────────────────────────

  describe('Admin event management', () => {
    it('201 — admin creates an event', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/events')
        .set(bearer(adminToken))
        .send({
          title: 'Admin Created Event',
          description: 'Created in test',
          startDate: tomorrow(),
          endDate: dayAfterTomorrow(),
          location: 'Virtual',
        })
        .expect(201);

      expect(res.body.title).toBe('Admin Created Event');
      await prisma.event.delete({ where: { id: res.body.id } });
    });

    it('403 — member cannot create an event', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .set(bearer(memberToken))
        .send({
          title: 'Sneaky Event',
          description: 'Not allowed',
          startDate: tomorrow(),
          endDate: dayAfterTomorrow(),
        })
        .expect(403);
    });
  });
});
