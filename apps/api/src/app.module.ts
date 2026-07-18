// ============================================================
// AutoApply AI — Root Application Module
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// Load env variables synchronously before any NestJS module imports evaluate process.env
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
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

  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const sqlite = config.get('USE_SQLITE') === 'true';
      if (sqlite) {
        return {
          type: 'sqlite',
          database: './database.sqlite',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: config.get('NODE_ENV') === 'development' ? ['error'] : false,
        };
      }
      return {
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'autoapply'),
        password: config.get('DATABASE_PASSWORD', 'autoapply_dev_2026'),
        database: config.get('DATABASE_NAME', 'autoapply_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development' ? ['error'] : false,
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
})
export class AppModule {}
