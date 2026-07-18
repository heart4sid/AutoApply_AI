// ============================================================
// AutoApply AI — API Entry Point
// ============================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: config.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get('API_PORT', 4000);
  await app.listen(port);
  console.log(`\n🚀 AutoApply AI API running on http://localhost:${port}/api/v1`);
  console.log(`📡 WebSocket gateway on ws://localhost:${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/api/v1/health\n`);
}

bootstrap();
