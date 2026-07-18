// ============================================================
// AutoApply AI — Connect Aggregator DTO
// ============================================================

import { IsString, IsBoolean, IsOptional, IsObject, MinLength } from 'class-validator';

export class ConnectAggregatorDto {
  @IsString()
  aggregatorId: string;

  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
