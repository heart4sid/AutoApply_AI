// ============================================================
// AutoApply AI — Applier Service
// ============================================================

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApplicationRecordEntity } from './entities/application-record.entity';
import { AggregatorService } from '../aggregator/aggregator.service';
import { AssetService } from '../asset/asset.service';
import { ScorerService } from './scorer.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ApplierService {
  constructor(
    @InjectRepository(ApplicationRecordEntity)
    private readonly recordRepo: Repository<ApplicationRecordEntity>,
    @InjectQueue('applier')
    private readonly applierQueue: Queue,
    private readonly aggregatorService: AggregatorService,
    private readonly assetService: AssetService,
    private readonly scorerService: ScorerService,
    private readonly wsGateway: NotificationGateway,
    private readonly notifService: NotificationService,
  ) {}

  // ── Trigger Job Discovery Scan ──
  async triggerScan(userId: string, aggregatorId: string) {
    const connections = await this.aggregatorService.getConnections(userId);
    const conn = connections.find(c => c.aggregatorId === aggregatorId);
    
    if (!conn || conn.status !== 'connected') {
      throw new BadRequestException('Aggregator must be connected to run scan');
    }

    // Get user resumes to run matching
    const resumes = await this.assetService.getResumes(userId);
    if (resumes.length === 0) {
      throw new BadRequestException('Please upload a resume first to evaluate job matches');
    }

    const primaryResume = resumes.find(r => r.isPrimary) || resumes[0];
    const resumeDetail = await this.assetService.getResumeDetail(userId, primaryResume.id);

    const adapter = this.aggregatorService.getAdapter(aggregatorId);
    const queries = conn.config?.searchQueries || ['Node.js'];
    
    const jobs = await adapter.discoverJobs(queries);

    const results = [];
    for (const job of jobs) {
      // Run Match Scorer
      const match = this.scorerService.calculateScore(resumeDetail.profile, job);

      // Create record
      const record = this.recordRepo.create({
        userId,
        aggregatorId,
        aggregatorName: adapter.name,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        jobUrl: job.url,
        matchScore: match.score,
        matchBreakdown: match.breakdown,
        resumeVariantId: primaryResume.id,
        resumeVariantName: primaryResume.name,
        status: match.score >= 70 ? 'queued' : 'skipped',
        statusLabel: match.score >= 70 ? 'Queued' : 'Skipped (low score)',
      });

      const saved = await this.recordRepo.save(record);
      results.push(saved);

      // Queue for execution if match score passes threshold
      if (saved.status === 'queued') {
        // Emit WS update
        this.wsGateway.emitToUser(userId, 'application:progress', saved);
        
        // Add to BullMQ
        await this.applierQueue.add('apply', { recordId: saved.id }, { delay: 1000 });
      }
    }

    return results;
  }

  // ── Get User Applications (Paginated) ──
  async getApplications(userId: string, pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'DESC';

    const [data, total] = await this.recordRepo.findAndCount({
      where: { userId },
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Get Single Application Detail ──
  async getDetail(userId: string, id: string): Promise<ApplicationRecordEntity> {
    const record = await this.recordRepo.findOne({ where: { id, userId } });
    if (!record) {
      throw new NotFoundException('Application record not found');
    }
    return record;
  }
}
