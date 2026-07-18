// ============================================================
// AutoApply AI — Applier Module
// ============================================================

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ApplierController } from './applier.controller';
import { ApplierService } from './applier.service';
import { ApplierProcessor } from './queue.processor';
import { ScorerService } from './scorer.service';
import { ApplicationRecordEntity } from './entities/application-record.entity';
import { AggregatorModule } from '../aggregator/aggregator.module';
import { AssetModule } from '../asset/asset.module';
import { NotificationModule } from '../notification/notification.module';
import { LocalQueueProvider } from './local-queue.provider';

const useRedis = process.env.USE_REDIS !== 'false';

const importsList: any[] = [
  TypeOrmModule.forFeature([ApplicationRecordEntity]),
  AggregatorModule,
  AssetModule,
  NotificationModule,
];

const providersList: Provider[] = [
  ApplierService,
  ApplierProcessor,
  ScorerService,
];

if (useRedis) {
  importsList.push(
    BullModule.registerQueue({
      name: 'applier',
    }),
  );
} else {
  providersList.push(LocalQueueProvider);
}

@Module({
  imports: importsList,
  controllers: [ApplierController],
  providers: providersList,
  exports: [ApplierService, ScorerService],
})
export class ApplierModule {}
