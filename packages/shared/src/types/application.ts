// ============================================================
// AutoApply AI — Shared Types: Application
// ============================================================

export type ApplicationStatus =
  | 'queued'
  | 'filling'
  | 'submitted'
  | 'failed'
  | 'needs_review'
  | 'needs_manual'
  | 'skipped'
  | 'ambiguous';

export interface ApplicationRecord {
  id: string;
  userId: string;
  aggregatorId: string;
  aggregatorName: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  matchScore: number;
  matchBreakdown?: MatchBreakdown;
  resumeVariantId: string;
  resumeVariantName: string;
  coverLetterText?: string;
  coverLetterMode: string;
  status: ApplicationStatus;
  statusLabel: string;
  failureReason?: string;
  progress?: ApplicationProgress;
  screenshotUrl?: string;
  appliedAt?: string;
  createdAt: string;
}

export interface MatchBreakdown {
  keyword: number;    // 0-100
  semantic: number;   // 0-100
  structural: number; // 0-100
}

export interface ApplicationProgress {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  percentage: number;
}

export interface JobListing {
  id: string;
  aggregatorId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  description: string;
  requirements: string[];
  skills: string[];
  postedAt: string;
  url: string;
}

export interface DailySummary {
  date: string;
  totalSubmitted: number;
  totalFailed: number;
  totalPending: number;
  averageMatchScore: number;
  byAggregator: Record<string, number>;
  topApplications: ApplicationRecord[];
}

// ── Insight Types ──

export interface SkillGap {
  skill: string;
  demandPercentage: number;
  userHasSkill: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  learningResource?: LearningResource;
}

export interface LearningResource {
  title: string;
  provider: string;
  url: string;
  estimatedHours: number;
  cost: 'free' | 'paid';
}

export interface MarketTrend {
  skill: string;
  trend: 'rising' | 'stable' | 'declining';
  currentDemand: number;
  changePercent: number;
  dataPoints: { week: string; demand: number }[];
}

export interface ResumeSuggestion {
  id: string;
  impact: 'high' | 'medium' | 'low';
  category: 'add_keyword' | 'rewrite_bullet' | 'add_section' | 'remove_section' | 'format_fix';
  title: string;
  description: string;
  currentText?: string;
  suggestedText?: string;
  dataReason: string;
  dismissed: boolean;
}

// ── Notification Types ──

export type NotificationType =
  | 'application_submitted'
  | 'application_failed'
  | 'aggregator_disconnected'
  | 'insight_available'
  | 'system_announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

// ── WebSocket Event Types ──

export type WSEventType =
  | 'application:progress'
  | 'application:submitted'
  | 'application:failed'
  | 'application:review'
  | 'aggregator:status'
  | 'notification:new'
  | 'engine:status'
  | 'insight:updated';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: string;
}
