import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, cleanupByEmailSuffix, registerUser, createAdminUser, bearer } from './helpers';

const SUFFIX = '@posts.int.test';

describe('Posts — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let memberToken: string;
  let memberUserId: string;
  let adminToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await cleanupByEmailSuffix(prisma, SUFFIX);

    const member = await registerUser(app, `member${SUFFIX}`, 'Member User');
    memberToken = member.accessToken;
    memberUserId = member.userId;

    const admin = await createAdminUser(prisma, app, `admin${SUFFIX}`);
    adminToken = admin.accessToken;
  });

  afterAll(async () => {
    await cleanupByEmailSuffix(prisma, SUFFIX);
    await app.close();
  });

  // ── Feed ──────────────────────────────────────────────────────────────────

  describe('GET /api/posts', () => {
    it('200 — returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/posts')
        .set(bearer(memberToken))
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/posts').expect(401);
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────

  describe('POST /api/posts', () => {
    it('201 — creates a post', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/posts')
        .set(bearer(memberToken))
        .send({ content: 'Hello integration test #test' })
        .expect(201);

      expect(res.body.content).toBe('Hello integration test #test');
      expect(res.body.authorId).toBe(memberUserId);
      expect(res.body).toHaveProperty('id');
    });

    it('401 — unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/posts')
        .send({ content: 'Anon post' })
        .expect(401);
    });
  });

  // ── Comments ──────────────────────────────────────────────────────────────

  describe('POST /api/posts/:id/comments', () => {
    let postId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/posts')
        .set(bearer(memberToken))
        .send({ content: 'Post for comments' });
      postId = res.body.id;
    });

    it('201 — adds a comment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/posts/${postId}/comments`)
        .set(bearer(memberToken))
        .send({ content: 'Great post!' })
        .expect(201);

      expect(res.body.content).toBe('Great post!');
      expect(res.body.postId).toBe(postId);
      expect(res.body.authorId).toBe(memberUserId);
    });

    it('400 — empty comment content', async () => {
      await request(app.getHttpServer())
        .post(`/api/posts/${postId}/comments`)
        .set(bearer(memberToken))
        .send({ content: '' })
        .expect(400);
    });
  });

  // ── Reactions ─────────────────────────────────────────────────────────────

  describe('POST /api/posts/:id/reactions/:type', () => {
    let postId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/posts')
        .set(bearer(memberToken))
        .send({ content: 'Post for reactions' });
      postId = res.body.id;
    });

    it('adds a LIKE reaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/posts/${postId}/reactions/LIKE`)
        .set(bearer(memberToken))
        .expect(201);

      expect(res.body).toHaveProperty('added');
    });

    it('toggling same reaction removes it', async () => {
      const first = await request(app.getHttpServer())
        .post(`/api/posts/${postId}/reactions/HEART`)
        .set(bearer(memberToken))
        .expect(201);

      expect(first.body).toHaveProperty('added');

      const second = await request(app.getHttpServer())
        .post(`/api/posts/${postId}/reactions/HEART`)
        .set(bearer(memberToken))
        .expect(201);

      expect(second.body).toHaveProperty('removed');
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  describe('DELETE /api/posts/:id', () => {
    it('200 — author can delete own post', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/posts')
        .set(bearer(memberToken))
        .send({ content: 'Ephemeral post' });
      const postId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/posts/${postId}`)
        .set(bearer(memberToken))
        .expect(200);
    });

    it('admin can delete any post', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/posts')
        .set(bearer(memberToken))
        .send({ content: 'Member post for admin delete' });
      const postId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/api/posts/${postId}`)
        .set(bearer(adminToken))
        .expect(200);
    });
  });

  // ── Pin (admin only) ──────────────────────────────────────────────────────

  describe('GET /api/posts/trending', () => {
    it('200 — returns trending posts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/posts/trending')
        .set(bearer(memberToken))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
