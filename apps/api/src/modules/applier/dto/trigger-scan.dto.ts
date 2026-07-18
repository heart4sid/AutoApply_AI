// ============================================================
// AutoApply AI — Trigger Scan DTO
// ============================================================

import { IsString } from 'class-validator';

export class TriggerScanDto {
  @IsString()
  aggregatorId: string;
}
