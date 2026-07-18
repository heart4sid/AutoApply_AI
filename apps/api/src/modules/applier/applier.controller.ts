// ============================================================
// AutoApply AI — Applier Controller
// ============================================================

import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApplierService } from './applier.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('applier')
@UseGuards(JwtAuthGuard)
export class ApplierController {
  constructor(private readonly applierService: ApplierService) {}

  @Post('scan')
  async triggerScan(@Request() req: any, @Body('aggregatorId') aggregatorId: string) {
    return this.applierService.triggerScan(req.user.id, aggregatorId);
  }

  @Get('applications')
  async getApplications(@Request() req: any) {
    return this.applierService.getApplications(req.user.id);
  }

  @Get('applications/:id')
  async getDetail(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.applierService.getDetail(req.user.id, id);
  }
}
