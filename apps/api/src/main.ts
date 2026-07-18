// ============================================================
// AutoApply AI — API Entry Point (Production Hardened)
// ============================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);

  // ── Security Headers ──
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // ── Global Prefix ──
  app.setGlobalPrefix('api/v1');

  // ── CORS — Locked to FRONTEND_URL ──
  const frontendUrl = config.get('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? frontendUrl
      : [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global Pipes ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Filters ──
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global Interceptors ──
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(30_000),
  );

  // ── Graceful Shutdown ──
  app.enableShutdownHooks();

  const port = config.get('API_PORT', 4000);
  await app.listen(port);

  logger.log(`🚀 AutoApply AI API running on http://localhost:${port}/api/v1`);
  logger.log(`📡 WebSocket gateway on ws://localhost:${port}`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/v1/health`);
  logger.log(`🔒 Environment: ${config.get('NODE_ENV', 'development')}`);
}

bootstrap();
