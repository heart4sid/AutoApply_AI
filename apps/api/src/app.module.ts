// ============================================================
// AutoApply AI — Root Application Module (Production Hardened)
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// Load env variables synchronously before any NestJS module imports evaluate process.env
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const key = match[1];
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val.trim();
      }
    }
  });
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AssetModule } from './modules/asset/asset.module';
import { AggregatorModule } from './modules/aggregator/aggregator.module';
import { ApplierModule } from './modules/applier/applier.module';
import { InsightModule } from './modules/insight/insight.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthController } from './health.controller';

const useRedis = process.env.USE_REDIS !== 'false';

const importsList: any[] = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '../../.env',
  }),

  // ── Rate Limiting ──
  ThrottlerModule.forRoot([
    {
      name: 'short',
      ttl: 1000,   // 1 second window
      limit: 10,   // 10 requests per second
    },
    {
      name: 'medium',
      ttl: 60000,  // 1 minute window
      limit: 100,  // 100 requests per minute
    },
    {
      name: 'long',
      ttl: 3600000, // 1 hour window
      limit: 1000,  // 1000 requests per hour
    },
  ]),

  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const sqlite = config.get('USE_SQLITE') === 'true';
      const isDev = config.get('NODE_ENV') !== 'production';

      if (sqlite) {
        return {
          type: 'sqlite',
          database: './database.sqlite',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: isDev, // NEVER synchronize in production
          logging: isDev ? ['error'] : false,
        };
      }
      return {
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'autoapply'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME', 'autoapply_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Always use migrations in production
        logging: isDev ? ['error'] : false,
        // Connection pool settings for production
        ...(!isDev && {
          extra: {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          },
        }),
      };
    },
  }),
];

if (useRedis) {
  importsList.push(
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
        },
      }),
    }),
  );
}

importsList.push(
  AuthModule,
  UserModule,
  AssetModule,
  AggregatorModule,
  ApplierModule,
  InsightModule,
  NotificationModule,
);

@Module({
  imports: importsList,
  controllers: [HealthController],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
