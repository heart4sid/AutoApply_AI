// ============================================================
// AutoApply AI — Shared Zod Validation Schemas
// ============================================================

import { z } from 'zod';

// ── Auth Schemas ──

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Resume Schemas ──

export const createResumeVariantSchema = z.object({
  name: z.string().min(1, 'Resume name is required').max(100),
  isPrimary: z.boolean().optional().default(false),
});

export const updateParsedProfileSchema = z.object({
  data: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    location: z.string().optional(),
    summary: z.string(),
    workExperience: z.array(z.object({
      id: z.string(),
      company: z.string(),
      title: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean(),
      bullets: z.array(z.string()),
    })),
    education: z.array(z.object({
      id: z.string(),
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      gpa: z.string().optional(),
    })),
    skills: z.array(z.object({
      name: z.string(),
      category: z.enum(['technical', 'soft', 'tool', 'language']),
    })),
    certifications: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string().optional(),
      url: z.string().optional(),
    })),
    projects: z.array(z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      url: z.string().optional(),
    })),
    languages: z.array(z.string()),
  }),
});

// ── Aggregator Schemas ──

export const connectAggregatorSchema = z.object({
  aggregatorId: z.string().uuid(),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must authorize access to connect' }),
  }),
});

export const aggregatorConfigSchema = z.object({
  dailyLimit: z.number().int().min(1).max(50),
  searchQueries: z.array(z.string()).max(10),
  locationFilters: z.array(z.string()),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  excludedCompanies: z.array(z.string()),
});

// ── Preferences Schema ──

export const jobPreferencesSchema = z.object({
  targetRoles: z.array(z.string()).min(1, 'At least one target role is required').max(10),
  targetLocations: z.array(z.string()).min(1).max(20),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  experienceLevel: z.enum(['fresher', 'junior', 'mid', 'senior', 'lead', 'executive']),
  workType: z.array(z.enum(['remote', 'hybrid', 'onsite'])).min(1),
  excludedCompanies: z.array(z.string()).default([]),
  autoApplyThreshold: z.number().int().min(50).max(100).default(70),
  coverLetterMode: z.enum(['full_auto', 'review_queue', 'template_only']).default('review_queue'),
  dailyApplicationLimit: z.number().int().min(1).max(50).default(25),
});

// ── Type Inference ──

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateResumeVariantInput = z.infer<typeof createResumeVariantSchema>;
export type UpdateParsedProfileInput = z.infer<typeof updateParsedProfileSchema>;
export type ConnectAggregatorInput = z.infer<typeof connectAggregatorSchema>;
export type AggregatorConfigInput = z.infer<typeof aggregatorConfigSchema>;
export type JobPreferencesInput = z.infer<typeof jobPreferencesSchema>;
