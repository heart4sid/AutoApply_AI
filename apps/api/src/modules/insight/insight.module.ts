// ============================================================
// AutoApply AI — Insight Module
// ============================================================

import { Module } from '@nestjs/common';
import { InsightController } from './insight.controller';
import { InsightService } from './insight.service';
import { AssetModule } from '../asset/asset.module';

@Module({
  imports: [AssetModule],
  controllers: [InsightController],
  providers: [InsightService],
  exports: [InsightService],
})
export class InsightModule {}
