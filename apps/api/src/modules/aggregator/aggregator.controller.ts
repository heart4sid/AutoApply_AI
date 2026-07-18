// ============================================================
// AutoApply AI — Aggregator Controller
// ============================================================

import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AGGREGATORS } from '@autoapply/shared';

@Controller('aggregators')
@UseGuards(JwtAuthGuard)
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  @Get('registry')
  async getRegistry() {
    return AGGREGATORS;
  }

  @Get('connections')
  async getConnections(@Request() req: any) {
    return this.aggregatorService.getConnections(req.user.id);
  }

  @Post('connect')
  async connect(@Request() req: any, @Body() body: any) {
    return this.aggregatorService.connect(req.user.id, body);
  }

  @Delete('connections/:id')
  async disconnect(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    await this.aggregatorService.disconnect(req.user.id, id);
    return { success: true, message: 'Disconnected successfully' };
  }
}
