// ============================================================
// AutoApply AI — Mock Aggregator Adapter
// ============================================================

import { IAggregatorAdapter } from './adapter.interface';
import { JobListing } from '@autoapply/shared';

export class MockAdapter implements IAggregatorAdapter {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  async login(credentials: Record<string, string>): Promise<boolean> {
    console.log(`[MockAdapter:${this.name}] Validating credentials for ${credentials.username}...`);
    // Standard mock latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    return credentials.password !== 'invalid_password';
  }

  async discoverJobs(queries: string[]): Promise<JobListing[]> {
    console.log(`[MockAdapter:${this.name}] Scanning listings for queries: [${queries.join(', ')}]...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const jobs: JobListing[] = [];
    const companies = ['Swiggy', 'Razorpay', 'Flipkart', 'Zomato', 'Paytm', 'PhonePe', 'Freshworks', 'Zoho'];
    const locations = ['Bengaluru, India', 'Pune, India', 'Remote, India', 'Delhi, India'];
    const titles = ['Senior Node Developer', 'Backend Software Engineer', 'Full-Stack Developer', 'DevOps Specialist'];

    // Generate 3 mock listings matching queries
    for (let i = 0; i < 3; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const id = `job-${this.id}-${Math.round(Math.random() * 1e5)}`;

      jobs.push({
        id,
        aggregatorId: this.id,
        title,
        company,
        location,
        salary: '15-25 LPA',
        jobType: 'full-time',
        remote: location.includes('Remote'),
        description: `We are looking for a ${title} to join our core backend engineering team at ${company}. You will build high-throughput systems, secure integrations, and work closely with senior designers. Core stack includes Node.js, NestJS, and PostgreSQL.`,
        requirements: ['2+ years of professional backend dev experience', 'Solid knowledge of Node.js and TypeScript', 'Familiarity with SQL databases'],
        skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'NestJS', 'Docker'],
        postedAt: new Date().toISOString(),
        url: `https://mockjob.autoapply.ai/listings/${id}`,
      });
    }

    return jobs;
  }

  async applyJob(job: JobListing, profile: any): Promise<{ success: boolean; reason?: string }> {
    console.log(`[MockAdapter:${this.name}] Automating application for job: ${job.title} at ${job.company}...`);
    // Simulating filling form steps
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 10% mock failure rate
    if (Math.random() < 0.1) {
      return {
        success: false,
        reason: 'Captcha check failed - anti-bot blocks submission',
      };
    }

    return { success: true };
  }
}
