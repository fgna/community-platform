import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  process.env.THROTTLE_LIMIT = '10000';
  process.env.THROTTLE_DISABLE = 'true';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use(helmet());
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const prisma = moduleRef.get(PrismaService);
  return { app, prisma };
}

export async function cleanupByEmailSuffix(
  prisma: PrismaService,
  suffix: string,
): Promise<void> {
  await prisma.user.deleteMany({ where: { email: { endsWith: suffix } } });
}

// The refresh token is issued as an httpOnly `refresh_token` cookie (HAR-001) rather
// than in the response body. httpOnly only blocks browser JS access — the raw
// Set-Cookie header is still readable here, which is how integration tests get the
// token value to exercise /auth/refresh and /auth/logout.
export function extractRefreshTokenCookie(res: request.Response): string | undefined {
  const setCookie = res.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const match = cookies.map((c) => /refresh_token=([^;]+)/.exec(c)).find(Boolean);
  return match?.[1];
}

export async function registerUser(
  app: INestApplication,
  email: string,
  name: string,
  password = 'Password123!',
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, name, password });
  return {
    accessToken: res.body.accessToken,
    refreshToken: extractRefreshTokenCookie(res) ?? '',
    userId: res.body.user?.id,
  };
}

export async function createAdminUser(
  prisma: PrismaService,
  app: INestApplication,
  email: string,
  password = 'Password123!',
): Promise<{ accessToken: string; userId: string }> {
  const argon2 = await import('argon2');
  const passwordHash = await argon2.hash(password);
  await prisma.user.create({
    data: { email, name: 'Admin', passwordHash, role: 'ADMIN' },
  });
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return { accessToken: res.body.accessToken, userId: res.body.user?.id };
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
