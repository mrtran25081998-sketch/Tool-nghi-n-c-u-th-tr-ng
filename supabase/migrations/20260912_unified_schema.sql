-- ==============================================================================
-- Migration: 20260912_unified_schema.sql
-- Single Canonical Banking Market Research Intelligence Schema
-- Replaces all conflicting tables (source_pairs, intelligence_items, crawl_jobs)
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. Banks Table
create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  name text not null,
  code text not null,
  is_mb boolean not null default false,
  active boolean not null default true,
  display_order int not null default 0,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, code)
);

-- 2. Bank Sources Table (Official Website & Facebook configurations per bank)
create table if not exists public.bank_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  bank_id uuid not null references public.banks(id) on delete cascade,
  website_url text,
  business_hub_url text,
  news_urls text[] not null default array[]::text[],
  promotion_urls text[] not null default array[]::text[],
  sitemap_url text,
  rss_url text,
  allowed_domains text[] not null default array[]::text[],
  render_mode text not null default 'raw' check(render_mode in ('raw', 'browser', 'auto')),
  adaptor_name text not null default 'generic',
  facebook_url text,
  facebook_page_id text,
  enterprise_keywords text[] not null default array['doanh nghiệp', 'sme', 'corporate', 'khách hàng tổ chức'],
  exclusion_keywords text[] not null default array['cá nhân', 'tuyển dụng', 'cổ đông', 'báo cáo tài chính'],
  website_verified boolean not null default false,
  facebook_verified boolean not null default false,
  is_active boolean not null default true,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, bank_id)
);

-- 3. Scan Jobs Table (Historical crawl runs)
create table if not exists public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  date_from date not null,
  date_to date not null,
  selected_banks text[] not null default array[]::text[],
  source_types text[] not null default array['website', 'facebook'],
  status text not null default 'queued' check(status in ('queued', 'running', 'completed', 'partial', 'failed', 'cancelled', 'empty')),
  progress_percent int not null default 0 check(progress_percent between 0 and 100),
  current_stage text,
  current_bank_name text,
  metrics jsonb not null default '{}'::jsonb,
  total_found int not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- 4. Scan Job Sources Table (Granular status & progress per bank/source)
create table if not exists public.scan_job_sources (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  bank_id uuid references public.banks(id) on delete cascade,
  bank_name text,
  source_type text not null check(source_type in ('website', 'facebook')),
  status text not null default 'queued' check(status in ('queued', 'running', 'success', 'partial', 'failed', 'unavailable')),
  items_found int not null default 0,
  pages_discovered int not null default 0,
  pages_fetched int not null default 0,
  items_parsed int not null default 0,
  items_rejected int not null default 0,
  error_code text,
  error_message text,
  http_status int,
  started_at timestamptz,
  finished_at timestamptz,
  unique(scan_id, bank_id, source_type)
);

-- 5. Crawl Items Table (Verified corporate banking intelligence results)
-- Strictly linked to a fixed scan_id, unique(scan_id, bank_id, canonical_url)
create table if not exists public.crawl_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  bank_id text not null,
  bank_name text not null,
  canonical_url text not null,
  title text not null,
  summary text not null,
  category text not null,
  audience text not null default 'Doanh nghiệp',
  published_at date,
  effective_from date,
  effective_to date,
  date_source text,
  verification_status text not null default 'verified' check(verification_status in ('verified', 'review', 'invalid')),
  confidence_score float not null default 0.95 check(confidence_score between 0 and 1),
  evidence_text text,
  website_url text,
  facebook_url text,
  source_types text[] not null default array['website'],
  collected_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scan_id, bank_id, canonical_url)
);

-- 6. Crawl Item Sources Table (Detailed provenance links for Website and Facebook of the same item)
create table if not exists public.crawl_item_sources (
  id uuid primary key default gen_random_uuid(),
  crawl_item_id uuid not null references public.crawl_items(id) on delete cascade,
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  source_type text not null check(source_type in ('website', 'facebook')),
  url text not null,
  permalink_url text,
  title text,
  published_at timestamptz,
  evidence_text text,
  is_verified boolean not null default true,
  created_at timestamptz not null default now(),
  unique(crawl_item_id, source_type, url)
);

-- 7. Source Alerts Table (Track source connection errors and failures per scan)
create table if not exists public.source_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  scan_id uuid references public.scan_jobs(id) on delete cascade,
  bank_id text not null,
  bank_name text not null,
  source_type text not null check(source_type in ('website', 'facebook')),
  error_cause text not null,
  http_status int,
  checked_at timestamptz not null default now(),
  resolved boolean not null default false
);

-- 8. Candidate Audits Table (Full audit trail of all evaluated URLs per scan)
create table if not exists public.candidate_audits (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  bank_id text,
  bank_name text,
  source_type text not null check(source_type in ('website', 'facebook')),
  url text not null,
  title text,
  page_type text,
  accepted boolean not null default false,
  rejection_reason text,
  published_at text,
  effective_from text,
  effective_to text,
  date_source text,
  audience text,
  audience_reason text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_crawl_items_scan_id on public.crawl_items(scan_id);
create index if not exists idx_crawl_items_bank_id on public.crawl_items(bank_id);
create index if not exists idx_crawl_items_published_at on public.crawl_items(published_at);
create index if not exists idx_crawl_items_verification on public.crawl_items(verification_status);
create index if not exists idx_scan_job_sources_scan_id on public.scan_job_sources(scan_id);
create index if not exists idx_candidate_audits_scan_id on public.candidate_audits(scan_id);
create index if not exists idx_source_alerts_scan_id on public.source_alerts(scan_id);

-- Enable Row Level Security (RLS)
alter table public.banks enable row level security;
alter table public.bank_sources enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.scan_job_sources enable row level security;
alter table public.crawl_items enable row level security;
alter table public.crawl_item_sources enable row level security;
alter table public.source_alerts enable row level security;
alter table public.candidate_audits enable row level security;

-- Permissive prototype / authenticated policies
create policy "Allow all read banks" on public.banks for select using (true);
create policy "Allow all write banks" on public.banks for all using (true);

create policy "Allow all read bank_sources" on public.bank_sources for select using (true);
create policy "Allow all write bank_sources" on public.bank_sources for all using (true);

create policy "Allow all read scan_jobs" on public.scan_jobs for select using (true);
create policy "Allow all write scan_jobs" on public.scan_jobs for all using (true);

create policy "Allow all read scan_job_sources" on public.scan_job_sources for select using (true);
create policy "Allow all write scan_job_sources" on public.scan_job_sources for all using (true);

create policy "Allow all read crawl_items" on public.crawl_items for select using (true);
create policy "Allow all write crawl_items" on public.crawl_items for all using (true);

create policy "Allow all read crawl_item_sources" on public.crawl_item_sources for select using (true);
create policy "Allow all write crawl_item_sources" on public.crawl_item_sources for all using (true);

create policy "Allow all read source_alerts" on public.source_alerts for select using (true);
create policy "Allow all write source_alerts" on public.source_alerts for all using (true);

create policy "Allow all read candidate_audits" on public.candidate_audits for select using (true);
create policy "Allow all write candidate_audits" on public.candidate_audits for all using (true);
