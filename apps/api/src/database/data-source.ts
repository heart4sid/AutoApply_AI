// ============================================================
// AutoApply AI — TypeORM CLI DataSource Config
// ============================================================

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental parameters
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const useSqlite = process.env.USE_SQLITE === 'true';

export const AppDataSource = useSqlite
  ? new DataSource({
      type: 'sqlite',
      database: './database.sqlite',
      entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, './migrations/*{.ts,.js}')],
      synchronize: false,
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'autoapply',
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME || 'autoapply_db',
      entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, './migrations/*{.ts,.js}')],
      synchronize: false,
    });
