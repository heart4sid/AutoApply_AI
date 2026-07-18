// ============================================================
// AutoApply AI — Asset Module
// ============================================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { ParserService } from './parser.service';
import { ResumeVariantEntity } from './entities/resume-variant.entity';
import { ParsedProfileEntity } from './entities/parsed-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResumeVariantEntity, ParsedProfileEntity]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AssetController],
  providers: [AssetService, ParserService],
  exports: [AssetService, ParserService],
})
export class AssetModule {}
