// ============================================================
// AutoApply AI — Aggregator Connection Interface
// ============================================================

import { JobListing } from '@autoapply/shared';

export interface IAggregatorAdapter {
  id: string;
  name: string;
  login(credentials: Record<string, string>): Promise<boolean>;
  discoverJobs(queries: string[]): Promise<JobListing[]>;
  applyJob(job: JobListing, profile: any): Promise<{ success: boolean; reason?: string }>;
}
