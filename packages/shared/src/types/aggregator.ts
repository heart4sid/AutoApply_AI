// ============================================================
// AutoApply AI — Shared Types: Aggregator
// ============================================================

export type AggregatorRegion = 'indian' | 'international';
export type AggregatorType = 'api' | 'browser' | 'hybrid';
export type ConnectionStatus = 'disconnected' | 'verifying' | 'connected' | 'error';

export interface Aggregator {
  id: string;
  name: string;
  slug: string;
  region: AggregatorRegion;
  type: AggregatorType;
  logoUrl: string;
  websiteUrl: string;
  enabled: boolean;
  requiredTier: 'free' | 'pro' | 'enterprise';
  supportsOAuth: boolean;
  description: string;
}

export interface AggregatorConnection {
  id: string;
  userId: string;
  aggregatorId: string;
  aggregator: Aggregator;
  status: ConnectionStatus;
  lastValidatedAt?: string;
  lastSyncAt?: string;
  applicationCount: number;
  dailyLimit: number;
  dailyUsed: number;
  errorMessage?: string;
  createdAt: string;
}

export interface AggregatorConfig {
  connectionId: string;
  dailyLimit: number;
  searchQueries: string[];
  locationFilters: string[];
  salaryMin?: number;
  salaryMax?: number;
  excludedCompanies: string[];
}

export interface ConnectAggregatorRequest {
  aggregatorId: string;
  username: string;
  password: string;
  consentGiven: boolean;
}
