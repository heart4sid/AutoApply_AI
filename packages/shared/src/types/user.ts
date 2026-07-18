// ============================================================
// AutoApply AI — Shared Types: User
// ============================================================

export type UserRole = 'user' | 'admin' | 'security';
export type UserTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tier: UserTier;
  avatarUrl?: string;
  timezone: string;
  locale: string;
  onboardingComplete: boolean;
  mfaEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  targetRoles: string[];
  targetLocations: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  workType: ('remote' | 'hybrid' | 'onsite')[];
  excludedCompanies: string[];
  autoApplyThreshold: number; // 0-100 match score
  coverLetterMode: 'full_auto' | 'review_queue' | 'template_only';
  dailyApplicationLimit: number;
  notificationEmail: boolean;
  notificationFrequency: 'realtime' | 'daily' | 'weekly';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
