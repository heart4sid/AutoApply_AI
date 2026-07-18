// ============================================================
// AutoApply AI — BullMQ Background Job Worker
// ============================================================

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationRecordEntity } from './entities/application-record.entity';
import { AggregatorService } from '../aggregator/aggregator.service';
import { AssetService } from '../asset/asset.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationService } from '../notification/notification.service';

@Processor('applier')
export class ApplierProcessor extends WorkerHost {
  constructor(
    @InjectRepository(ApplicationRecordEntity)
    private readonly recordRepo: Repository<ApplicationRecordEntity>,
    private readonly aggregatorService: AggregatorService,
    private readonly assetService: AssetService,
    private readonly wsGateway: NotificationGateway,
    private readonly notifService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { recordId } = job.data;
    const record = await this.recordRepo.findOne({ where: { id: recordId } });
    if (!record) return;

    console.log(`[Queue Worker] Processing application for: ${record.jobTitle} at ${record.company}`);

    try {
      // 1. Transition to filling state
      record.status = 'filling';
      record.statusLabel = 'Filling form details...';
      record.progress = { currentStep: 1, totalSteps: 4, stepLabel: 'Authenticating...', percentage: 25 };
      await this.recordRepo.save(record);
      this.wsGateway.emitToUser(record.userId, 'application:progress', record);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Load profile and configure details
      record.progress = { currentStep: 2, totalSteps: 4, stepLabel: 'Extracting profile parameters...', percentage: 50 };
      await this.recordRepo.save(record);
      this.wsGateway.emitToUser(record.userId, 'application:progress', record);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Fill form steps
      record.progress = { currentStep: 3, totalSteps: 4, stepLabel: 'Entering candidate information...', percentage: 75 };
      await this.recordRepo.save(record);
      this.wsGateway.emitToUser(record.userId, 'application:progress', record);

      const resumeDetail = await this.assetService.getResumeDetail(record.userId, record.resumeVariantId!);
      const adapter = this.aggregatorService.getAdapter(record.aggregatorId);
      
      // Execute adapter application call
      const jobListingMock = {
        id: 'job-id',
        aggregatorId: record.aggregatorId,
        title: record.jobTitle,
        company: record.company,
        location: record.location || 'Bengaluru',
        jobType: 'full-time' as const,
        remote: false,
        description: '',
        requirements: [],
        skills: [],
        postedAt: '',
        url: record.jobUrl || '',
      };

      const result = await adapter.applyJob(jobListingMock, resumeDetail.profile);

      // 4. Update outcome
      if (result.success) {
        record.status = 'submitted';
        record.statusLabel = 'Submitted successfully';
        record.progress = { currentStep: 4, totalSteps: 4, stepLabel: 'Finished', percentage: 100 };
        record.appliedAt = new Date();
        
        await this.recordRepo.save(record);
        this.wsGateway.emitToUser(record.userId, 'application:submitted', record);
        
        // Push notification
        await this.notifService.create(
          record.userId,
          'application_submitted',
          'Application Submitted!',
          `Successfully applied to ${record.jobTitle} at ${record.company}.`,
          `/activity/${record.id}`,
        );
      } else {
        record.status = 'failed';
        record.statusLabel = 'Application failed';
        record.failureReason = result.reason || 'Unexpected platform error';
        record.progress = null;

        await this.recordRepo.save(record);
        this.wsGateway.emitToUser(record.userId, 'application:failed', record);

        // Push notification
        await this.notifService.create(
          record.userId,
          'application_failed',
          'Application Failed',
          `Could not apply to ${record.jobTitle} at ${record.company}. Reason: ${record.failureReason}`,
          `/activity/${record.id}`,
        );
      }
    } catch (e) {
      console.error('[Worker Error] Processing failure:', e);
      record.status = 'failed';
      record.statusLabel = 'Application crashed';
      record.failureReason = e.message;
      record.progress = null;
      await this.recordRepo.save(record);
      this.wsGateway.emitToUser(record.userId, 'application:failed', record);
    }
  }
}
