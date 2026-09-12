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
  is_active?: boolean;
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

export type SourceRole =
  | 'FACEBOOK_PRIMARY'
  | 'BUSINESS_HUB'
  | 'PRODUCT_HUB'
  | 'PRODUCT_DETAIL'
  | 'DIGITAL_BANKING'
  | 'NEWS'
  | 'PROMOTION'
  | 'PROGRAM'
  | 'GUIDE'
  | 'FAQ'
  | 'LOGIN'
  | 'OTHER'
  | 'IRRELEVANT';

export type SeedVerificationStatus = 'VERIFIED' | 'MANUAL_VERIFY' | 'FAILED';
export type SourceStatus = 'TRACKING' | 'DISCOVERED' | 'REVIEW' | 'IGNORE';
export type RenderMode = 'HTTP_HTML' | 'JS_BROWSER' | 'META_API_OR_BROWSER';

export type ContentType =
  | 'NEW_PRODUCT'
  | 'NEW_FEATURE'
  | 'ENHANCEMENT'
  | 'PROMOTION'
  | 'PROGRAM'
  | 'NOT_RELEVANT';

export type TargetSegment =
  | 'BUSINESS'
  | 'SME'
  | 'CORPORATE'
  | 'MERCHANT'
  | 'HOUSEHOLD_BUSINESS'
  | 'RETAIL'
  | 'UNKNOWN';

export type NewnessStatus = 'NEW' | 'UPDATED' | 'EXISTING' | 'UNKNOWN';

export type DiscoveryReviewStatus =
  | 'APPROVED_DISCOVERY'
  | 'NEEDS_REVIEW'
  | 'REJECTED'
  | 'BENCHMARK_APPLIED';

export type MappingStatus = 'MATCHED' | 'NEW_COMPONENT_SUGGESTED' | 'UNMAPPED';

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

export interface CrawlSource {
  id: string;
  org_id?: string;
  bank_id: string;
  bank_name?: string;
  source_type: SourceType;
  source_role: SourceRole;
  url: string;
  crawl_source_url?: string;
  discovered_from_url?: string | null;
  priority: number;
  relevance_score: number;
  crawl_frequency_hours: number;
  render_mode: RenderMode;
  verification_status: VerificationStatus;
  status: SourceStatus;
  content_hash?: string | null;
  last_crawled_at?: string | null;
  last_changed_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SourceDiscoveredUrl {
  id: string;
  bank_id: string;
  bank_name?: string;
  parent_source_id?: string | null;
  url: string;
  page_title?: string | null;
  h1?: string | null;
  classification: SourceRole;
  relevance_score: number;
  reason?: string | null;
  status: 'TRACKING' | 'REVIEW' | 'IGNORE';
  discovered_at: string;
  reviewed_at?: string | null;
}

export type UrlValidationStatus =
  | 'VALID'
  | 'BROKEN'
  | 'UNCONFIRMED_EXTERNAL'
  | 'SOURCE_EVIDENCE_MISMATCH'
  | 'MISSING';

export type ExtractionMethod =
  | 'SITEMAP'
  | 'ANCHOR'
  | 'API_PERMALINK'
  | 'DOM_PERMALINK'
  | 'BROWSER_CURRENT_URL';

export type SourceLineageStatus = 'VERIFIED' | 'MISSING';

export interface CrawlContent {
  id: string;
  bank_id?: string | null;
  source_id?: string | null;
  crawl_source_id?: string | null;
  source_type: SourceType;
  seed_url?: string | null;
  crawl_source_url?: string | null;
  raw_href?: string | null;
  resolved_url?: string | null;
  final_url?: string | null;
  exact_content_url: string; // IMMUTABLE: Primary source of truth
  content_url?: string; // alias/backward compatibility
  canonical_url?: string | null;
  canonical_content_url?: string | null;
  url_validation_status?: UrlValidationStatus;
  url_validation_reason?: string | null;
  extraction_method?: ExtractionMethod;
  title?: string | null;
  published_at?: string | null;
  raw_text?: string | null;
  clean_text?: string | null;
  evidence_text?: string | null;
  content_hash?: string | null;
  created_at: string;
}

export interface CrawlSnapshot {
  id: string;
  source_id?: string | null;
  url: string;
  content_hash: string;
  clean_content: string;
  created_at: string;
}

export interface DiscoverySourceItem {
  id?: string;
  discovery_id?: string;
  crawl_content_id: string; // Foreign key to crawl_contents
  source_type: SourceType;
  type?: SourceType; // alias for API response
  url: string; // Immutable exact_content_url
  exact_content_url?: string;
  content_url?: string | null; // backward compatibility
  seed_url?: string | null;
  crawl_source_url?: string | null;
  raw_href?: string | null;
  resolved_url?: string | null;
  final_url?: string | null;
  canonical_url?: string | null;
  url_validation_status?: UrlValidationStatus;
  url_validation_reason?: string | null;
  extraction_method?: ExtractionMethod;
  title?: string | null;
  published_at?: string | null;
  evidence_text?: string | null;
  evidence?: string | null; // alias
}

export interface DiscoverySource {
  id: string;
  discovery_id: string;
  crawl_content_id: string;
  created_at?: string;
}

export interface ProductDiscovery {
  id: string;
  org_id?: string;
  bank_id: string;
  bank_name: string;
  platform_name?: string;
  product_name: string;
  feature_name: string;
  content_type: ContentType;
  journey: string;
  benchmark_component_id?: string | null;
  benchmark_component_name?: string | null;
  suggested_component?: string | null;
  suggested_score?: ScoreValue;
  suggested_description?: string | null;
  mapping_status: MappingStatus;
  change_summary: string;
  newness: NewnessStatus;
  evidence: string;
  target_segment?: TargetSegment;
  classification_confidence: number;
  evidence_strength: number;
  newness_confidence: number;
  mapping_confidence: number;
  source_reliability: number;
  final_confidence: number;
  published_at?: string | null;
  detected_at: string;
  review_status: DiscoveryReviewStatus;
  review_reason?: string | null;
  source_lineage_status?: SourceLineageStatus;
  sources: DiscoverySourceItem[];
  source_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewAction {
  id: string;
  discovery_id: string;
  user_id?: string | null;
  action_type: 'APPROVE' | 'REJECT' | 'NEEDS_REVIEW' | 'MAP_COMPONENT' | 'SUGGEST_COMPONENT' | 'APPLY_BENCHMARK';
  old_score?: ScoreValue;
  new_score?: ScoreValue;
  old_description?: string | null;
  new_description?: string | null;
  notes?: string | null;
  created_at: string;
}

/* ─────────────────────────── Banking Intelligence Domain (Specification) ─────────────────────────── */

export type IntelligenceCategory =
  | 'Sản phẩm mới'
  | 'Tính năng mới'
  | 'Ưu đãi/khuyến mại mới'
  | 'Chương trình mới'
  | 'Ngân hàng số doanh nghiệp'
  | 'Tài khoản doanh nghiệp'
  | 'Tín dụng và khoản vay'
  | 'Thẻ doanh nghiệp'
  | 'Thanh toán'
  | 'Quản lý dòng tiền'
  | 'Thu hộ/chi hộ'
  | 'POS/QR'
  | 'Chuyển tiền quốc tế'
  | 'Tài trợ thương mại'
  | 'LC và bảo lãnh';

export type VerificationStatus = 'verified' | 'review' | 'invalid';

export interface IntelligenceItem {
  id: string;
  bankId: string;
  bankName: string;
  publishedAt: string; // ISO date YYYY-MM-DD or ISO string
  title: string;
  category: IntelligenceCategory | string;
  summary: string;
  audience: string; // e.g. 'SME', 'Doanh nghiệp lớn', 'Hộ kinh doanh', 'Corporate'
  audienceReason?: string;
  dateReason?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  sourceTypes: ('website' | 'facebook')[];
  verificationStatus: VerificationStatus;
  confidenceScore: number; // 0.0 - 1.0
  collectedAt: string;
  scanId?: string;
  isDemo?: boolean;
}

export interface SourceAlert {
  id: string;
  scanId?: string;
  bankId: string;
  bankName: string;
  sourceType: 'website' | 'facebook';
  errorCode?: string;
  errorMessage?: string;
  errorCause?: string; // e.g. 'HTTP 403 Forbidden', 'Yêu cầu đăng nhập Facebook', 'Không lấy được permalink'
  httpStatus?: number;
  sourceUrl?: string;
  checkedAt: string;
  resolved?: boolean;
}

export interface ScanMetrics {
  selectedBanks: number;
  selectedSources: number;
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  pagesDiscovered: number;
  pagesFetched: number;
  itemsParsed: number;
  itemsAccepted: number;
  itemsRejectedByDate: number;
  itemsRejectedByAudience: number;
  itemsMissingDate: number;
  itemsDeduplicated: number;
  itemsSaved: number;
  itemsReturned?: number;
  itemsRendered?: number;
}

export interface SourceExecutionResult {
  bankId: string;
  bankName: string;
  sourceType: 'website' | 'facebook';
  status: 'pending' | 'running' | 'success' | 'partial' | 'failed' | 'unavailable';
  url: string;
  httpStatus: number;
  discoveredCount: number;
  savedCount: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface ScanJobDetail {
  id: string;
  dateFrom: string;
  dateTo: string;
  selectedBanks: string[]; // Bank IDs
  sourceTypes: ('website' | 'facebook')[];
  status: 'queued' | 'running' | 'completed' | 'cancelled' | 'failed' | 'success' | 'partial' | 'empty' | 'data_contract_error';
  progressPercent: number;
  currentStage: string; // e.g. 'Đang quét ngân hàng 3/15 – Vietcombank'
  currentBankName?: string;
  totalFound: number;
  metrics?: ScanMetrics;
  sourceResults?: SourceExecutionResult[];
  errorSummary?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface BankConfig {
  id: string;
  name: string;
  code: string;
  logo?: string;
  active: boolean;
  websiteUrl: string;
  enterpriseHubUrl: string;
  subUrls?: string[];
  sitemapUrl?: string;
  facebookUrl: string;
  facebookPageId?: string;
  enterpriseKeywords?: string[];
  exclusionKeywords?: string[];
  lastScannedAt?: string;
  websiteStatus: 'VERIFIED' | 'MANUAL_VERIFY' | 'FAILED';
  facebookStatus: 'VERIFIED' | 'MANUAL_VERIFY' | 'FAILED';
}

