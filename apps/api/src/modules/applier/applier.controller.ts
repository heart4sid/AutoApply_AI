// ============================================================
// AutoApply AI — Applier Controller (Production Hardened)
// ============================================================

import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApplierService } from './applier.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TriggerScanDto } from './dto/trigger-scan.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Controller('applier')
@UseGuards(JwtAuthGuard)
export class ApplierController {
  constructor(private readonly applierService: ApplierService) {}

  @Post('scan')
  async triggerScan(@Request() req: any, @Body() dto: TriggerScanDto) {
    return this.applierService.triggerScan(req.user.id, dto.aggregatorId);
  }

  @Get('applications')
  async getApplications(@Request() req: any, @Query() pagination: PaginationQueryDto) {
    return this.applierService.getApplications(req.user.id, pagination);
  }

  @Get('applications/:id')
  async getDetail(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.applierService.getDetail(req.user.id, id);
  }
}
