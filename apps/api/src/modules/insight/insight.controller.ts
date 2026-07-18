// ============================================================
// AutoApply AI — Insight Controller
// ============================================================

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { InsightService } from './insight.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightController {
  constructor(private readonly insightService: InsightService) {}

  @Get('skill-gap')
  async getSkillGaps(@Request() req: any) {
    return this.insightService.getSkillGaps(req.user.id);
  }

  @Get('suggestions')
  async getSuggestions(@Request() req: any) {
    return this.insightService.getSuggestions(req.user.id);
  }
}
