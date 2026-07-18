// ============================================================
// AutoApply AI — Profile Matching Scorer
// ============================================================

import { Injectable } from '@nestjs/common';
import { JobListing } from '@autoapply/shared';
import * as crypto from 'crypto';

@Injectable()
export class ScorerService {
  // ── Calculate Match Score between Profile and Job Description ──
  calculateScore(profile: any, job: JobListing): { score: number; breakdown: { keyword: number; semantic: number; structure: number } } {
    let keywordScore = 0;
    let semanticScore = 70; // Mock base matching
    let structureScore = 100;

    // 1. Keyword check
    if (job.skills && job.skills.length > 0 && profile.skills) {
      const userSkills = new Set(profile.skills.map((s: any) => s.name.toLowerCase()));
      let matches = 0;
      
      job.skills.forEach(skill => {
        if (userSkills.has(skill.toLowerCase())) {
          matches++;
        }
      });
      keywordScore = Math.round((matches / job.skills.length) * 100);
    } else {
      keywordScore = 50;
    }

    // 2. Semantic matching simulation (Deterministic Hash-Based)
    const input = `${job.title}-${profile.name || ''}-${job.company || ''}`;
    const hash = crypto.createHash('md5').update(input).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const matchWeights = [75, 82, 88, 91, 65];
    semanticScore = matchWeights[hashInt % matchWeights.length];

    // 3. Structural matching checks
    if (job.location && profile.location) {
      // Mock geographical checks
      const isMatch = profile.location.toLowerCase().includes(job.location.split(',')[0].toLowerCase());
      if (!isMatch) structureScore -= 20;
    }

    const overallScore = Math.round((keywordScore * 0.3) + (semanticScore * 0.4) + (structureScore * 0.3));

    return {
      score: Math.min(overallScore, 100),
      breakdown: {
        keyword: keywordScore,
        semantic: semanticScore,
        structure: structureScore,
      },
    };
  }
}
