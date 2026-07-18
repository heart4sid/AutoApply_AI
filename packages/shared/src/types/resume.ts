// ============================================================
// AutoApply AI — Shared Types: Resume & Assets
// ============================================================

export interface ResumeVariant {
  id: string;
  userId: string;
  name: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  atsScore: number;
  isPrimary: boolean;
  version: number;
  applicationCount: number;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ParsedProfile {
  id: string;
  variantId: string;
  userId: string;
  version: number;
  data: ParsedProfileData;
  createdAt: string;
}

export interface ParsedProfileData {
  name: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  location?: string;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: SkillEntry[];
  certifications: Certification[];
  projects: Project[];
  languages: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface SkillEntry {
  name: string;
  category: 'technical' | 'soft' | 'tool' | 'language';
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface CoverLetter {
  id: string;
  userId: string;
  applicationId?: string;
  content: string;
  mode: 'auto' | 'template' | 'manual';
  createdAt: string;
}

export type CoverLetterMode = 'full_auto' | 'review_queue' | 'template_only';

export interface ATSScoreBreakdown {
  overall: number;
  format: number;
  keywords: number;
  structure: number;
  issues: ATSIssue[];
}

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
}
