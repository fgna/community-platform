import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

function validateRequiredSecrets() {
  const logger = new Logger('Bootstrap');
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.fatal(`Missing required environment variables: ${missing.join(', ')}. Refusing to start.`);
    process.exit(1);
  }
}

async function bootstrap() {
  validateRequiredSecrets();

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  app.enableShutdownHooks();

  // Ensure uploads directory exists and serve as static files
  const uploadsDir = join(process.cwd(), 'uploads');
  fs.mkdirSync(join(uploadsDir, 'avatars'), { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // Security
  app.use(helmet());

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
    exposedHeaders: ['X-New-Access-Token'],
  });

  // Global prefix (health excluded so infra/Docker can probe /health directly)
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter — prevents stack traces leaking in production
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Community Platform API')
      .setDescription('API for the Community Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger UI available at /api/docs');
  }

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}

bootstrap();
