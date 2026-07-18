// ============================================================
// AutoApply AI — Aggregator Module
// ============================================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AggregatorController } from './aggregator.controller';
import { AggregatorService } from './aggregator.service';
import { CredentialVaultService } from './credential-vault.service';
import { AggregatorConnectionEntity } from './entities/aggregator-connection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AggregatorConnectionEntity])],
  controllers: [AggregatorController],
  providers: [AggregatorService, CredentialVaultService],
  exports: [AggregatorService, CredentialVaultService],
})
export class AggregatorModule {}
