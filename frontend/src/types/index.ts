export type AppRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type CrawlStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type SourceType = 'facebook' | 'website';
export type CrawlItemStatus = 'new' | 'accepted' | 'rejected' | 'needs_review';

export type ScoreValue = 0 | 1 | 2 | 3 | null;

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
}

export interface Bank {
  id: string;
  org_id: string;
  name: string;
  code: string;
  is_mb: boolean;
  active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SourcePair {
  id: string;
  org_id: string;
  bank_id: string;
  bank_name?: string;
  facebook_url: string;
  website_url: string;
  facebook_verified: boolean;
  website_verified: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface BenchmarkGroup {
  id: string;
  org_id: string;
  name: string;
  display_order: number;
  active: boolean;
  side?: 'left' | 'right';
  created_at?: string;
  updated_at?: string;
}

export interface BenchmarkComponent {
  id: string;
  org_id: string;
  group_id: string;
  name: string;
  display_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BenchmarkCell {
  id: string;
  org_id: string;
  component_id: string;
  bank_id: string;
  description: string;
  score: ScoreValue;
  evidence_url?: string | null;
  evidence_item_id?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrawlJob {
  id: string;
  org_id: string;
  requested_by?: string | null;
  date_from: string;
  date_to: string;
  status: CrawlStatus;
  progress: number;
  error_summary?: string | null;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface CrawlItem {
  id: string;
  org_id: string;
  job_id?: string | null;
  bank_id: string;
  bank_name?: string;
  source_type: SourceType;
  source_url: string;
  canonical_url?: string | null;
  published_at?: string | null;
  detected_at: string;
  title?: string | null;
  raw_text?: string | null;
  summary?: string | null;
  content_hash: string;
  status: CrawlItemStatus;
  mapped_group_id?: string | null;
  mapped_component_id?: string | null;
  feature_name?: string | null;
  confidence?: number | null;
  metadata?: Record<string, any>;
}

export interface BankPositionSummary {
  org_id: string;
  bank_id: string;
  bank_name: string;
  code: string;
  is_mb: boolean;
  component_count: number;
  total_score: number;
  max_score: number;
  m3_count: number;
  m2_count: number;
  m1_count: number;
  m0_count: number;
  null_count: number;
}

export interface GroupBankScore {
  org_id: string;
  group_id: string;
  group_name: string;
  bank_id: string;
  bank_name: string;
  group_score: number;
}

// Composite Benchmark Grid State
export interface BenchmarkGridRow {
  component: BenchmarkComponent;
  cells: Record<string, BenchmarkCell>; // key = bank_id
}

export interface BenchmarkGridGroup {
  group: BenchmarkGroup;
  rows: BenchmarkGridRow[];
}

export interface FullBenchmarkData {
  banks: Bank[];
  groups: BenchmarkGroup[];
  components: BenchmarkComponent[];
  cells: BenchmarkCell[];
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  email?: string;
  role: 'admin' | 'strategist' | 'analyst';
  role_name?: string;
  department?: string;
  avatar_initials?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

