// ============================================================
// AutoApply AI — Insight Service (Skill-Gap Engine)
// ============================================================

import { Injectable } from '@nestjs/common';
import { AssetService } from '../asset/asset.service';
import { SkillGap, ResumeSuggestion } from '@autoapply/shared';

@Injectable()
export class InsightService {
  constructor(private readonly assetService: AssetService) {}

  // ── Calculate User Skill Gaps ──
  async getSkillGaps(userId: string): Promise<SkillGap[]> {
    const resumes = await this.assetService.getResumes(userId);
    if (resumes.length === 0) return [];

    const primary = resumes.find(r => r.isPrimary) || resumes[0];
    const resumeDetail = await this.assetService.getResumeDetail(userId, primary.id);
    const profileData = resumeDetail.profile as any;
    const userSkills = new Set(
      profileData?.skills?.map((s: any) => s.name.toLowerCase()) || []
    );

    // Baseline required target skills for software developers
    const targetSkills = [
      { name: 'Node.js', demand: 85, hours: 20, cost: 'free' as const },
      { name: 'TypeScript', demand: 75, hours: 15, cost: 'free' as const },
      { name: 'PostgreSQL', demand: 68, hours: 10, cost: 'paid' as const },
      { name: 'Docker', demand: 82, hours: 8, cost: 'free' as const },
      { name: 'Kubernetes', demand: 74, hours: 40, cost: 'paid' as const },
      { name: 'GraphQL', demand: 55, hours: 12, cost: 'free' as const },
      { name: 'CI/CD', demand: 48, hours: 15, cost: 'free' as const },
    ];

    const gaps: SkillGap[] = [];
    targetSkills.forEach(skill => {
      const hasSkill = userSkills.has(skill.name.toLowerCase());
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';

      if (!hasSkill) {
        if (skill.demand > 80) severity = 'critical';
        else if (skill.demand > 60) severity = 'high';
        else severity = 'medium';
      }

      gaps.push({
        skill: skill.name,
        demandPercentage: skill.demand,
        userHasSkill: hasSkill,
        severity,
        learningResource: !hasSkill ? {
          title: `${skill.name} Masterclass & Practical Projects`,
          provider: skill.cost === 'free' ? 'YouTube / Official Docs' : 'Udemy / Coursera',
          url: 'https://learning.autoapply.ai/recommendations',
          estimatedHours: skill.hours,
          cost: skill.cost,
        } : undefined,
      });
    });

    return gaps.sort((a, b) => b.demandPercentage - a.demandPercentage);
  }

  // ── Get Resume Suggestions ──
  async getSuggestions(userId: string): Promise<ResumeSuggestion[]> {
    const gaps = await this.getSkillGaps(userId);
    const missingCritical = gaps.filter(g => !g.userHasSkill && g.severity === 'critical');

    const suggestions: ResumeSuggestion[] = [
      {
        id: 'sug-1',
        impact: 'high',
        category: 'rewrite_bullet',
        title: 'Quantify impact in work experience',
        description: 'Update your bullet points to specify percentage growth, transaction volumes, latency decreases, or database scaling indices.',
        currentText: 'Developed REST APIs for user management.',
        suggestedText: 'Developed 12 REST APIs serving 50K+ daily requests with 99.9% uptime, reducing response latency by 40%.',
        dataReason: 'JDs in your profile tier value metric-focused candidates 64% more.',
        dismissed: false,
      },
    ];

    missingCritical.forEach((gap, index) => {
      suggestions.push({
        id: `sug-gap-${index}`,
        impact: 'high',
        category: 'add_keyword',
        title: `Add "${gap.skill}" to skills section`,
        description: `This keyword is highly demanded in job listings matching your profile description.`,
        suggestedText: `"${gap.skill}"`,
        dataReason: `${gap.demandPercentage}% of job listings matching your role search require "${gap.skill}".`,
        dismissed: false,
      });
    });

    return suggestions;
  }
}
