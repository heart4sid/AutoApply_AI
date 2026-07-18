// ============================================================
// AutoApply AI — Profile Matching Scorer Unit Tests
// ============================================================

import { Test, TestingModule } from '@nestjs/testing';
import { ScorerService } from './scorer.service';
import { JobListing } from '@autoapply/shared';

describe('ScorerService', () => {
  let service: ScorerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScorerService],
    }).compile();

    service = module.get<ScorerService>(ScorerService);
  });

  it('should calculate matching scores deterministically', () => {
    const profile = {
      name: 'Priya Sharma',
      skills: [
        { name: 'TypeScript', category: 'technical' },
        { name: 'Node.js', category: 'technical' },
        { name: 'PostgreSQL', category: 'technical' },
      ],
      location: 'Bengaluru, India',
    };

    const job: JobListing = {
      id: 'job-1',
      aggregatorId: 'agg-naukri',
      title: 'Senior Node.js Developer',
      company: 'Razorpay',
      location: 'Bengaluru, India',
      jobType: 'full-time',
      remote: false,
      description: 'We are looking for a Node.js developer specialized in TypeScript.',
      requirements: ['TypeScript', 'Node.js'],
      skills: ['TypeScript', 'Node.js'],
      postedAt: '2026-07-18',
      url: 'https://naukri.com/jobs/1',
    };

    // Calculate multiple times to verify determinism (removing Math.random dependency)
    const result1 = service.calculateScore(profile, job);
    const result2 = service.calculateScore(profile, job);
    const result3 = service.calculateScore(profile, job);

    expect(result1.score).toBe(result2.score);
    expect(result2.score).toBe(result3.score);
    expect(result1.breakdown.keyword).toBe(100); // 2 out of 2 matched
  });

  it('should penalize structural match if geographical location mismatches', () => {
    const profile = {
      name: 'Priya Sharma',
      skills: [{ name: 'React', category: 'technical' }],
      location: 'Delhi, India',
    };

    const job: JobListing = {
      id: 'job-2',
      aggregatorId: 'agg-naukri',
      title: 'React Developer',
      company: 'TCS',
      location: 'Bengaluru, India',
      jobType: 'full-time',
      remote: false,
      description: 'React developer',
      requirements: ['React'],
      skills: ['React'],
      postedAt: '2026-07-18',
      url: 'https://naukri.com/jobs/2',
    };

    const result = service.calculateScore(profile, job);
    expect(result.breakdown.structure).toBe(80); // 20 points penalty for location mismatch
  });
});
