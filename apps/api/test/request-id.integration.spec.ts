import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers';

describe('Request ID propagation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets a generated X-Request-Id header when the client sends none', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('echoes back a client-supplied X-Request-Id header', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('X-Request-Id', 'client-supplied-id-123')
      .expect(200);

    expect(res.headers['x-request-id']).toBe('client-supplied-id-123');
  });

  it('generates a different id for each request', async () => {
    const first = await request(app.getHttpServer()).get('/health').expect(200);
    const second = await request(app.getHttpServer()).get('/health').expect(200);

    expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);
  });
});
