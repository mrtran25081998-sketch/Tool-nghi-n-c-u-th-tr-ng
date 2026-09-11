-- Migration: Complete Banking Intelligence Schema (2026-09-11)
-- Supports strictly 2 menus: "Tổng hợp dữ liệu" and "Cấu hình nguồn"

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

-- 2. Bank Sources Table (Combines Website and Facebook)
create table if not exists public.bank_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  bank_id uuid not null references public.banks(id) on delete cascade,
  website_url text,
  enterprise_hub_url text,
  sitemap_url text,
  facebook_url text,
  facebook_page_id text,
  enterprise_keywords text[] default array['doanh nghiệp', 'sme', 'corporate', 'khách hàng tổ chức'],
  exclusion_keywords text[] default array['cá nhân', 'tuyển dụng', 'cổ đông', 'báo cáo tài chính'],
  website_verified boolean not null default false,
  facebook_verified boolean not null default false,
  is_active boolean not null default true,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, bank_id)
);

-- 3. Scan Jobs Table
create type if not exists scan_status as enum ('queued', 'running', 'completed', 'cancelled', 'failed');

create table if not exists public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  date_from date not null,
  date_to date not null,
  selected_banks text[] not null default array[]::text[],
  source_types text[] not null default array['website', 'facebook'],
  status text not null default 'queued',
  progress_percent int not null default 0 check(progress_percent between 0 and 100),
  current_stage text,
  current_bank_name text,
  total_found int not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- 4. Scan Job Sources Table (Progress per bank/source)
create table if not exists public.scan_job_sources (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  bank_id uuid references public.banks(id) on delete cascade,
  source_type text not null check(source_type in ('website', 'facebook')),
  status text not null default 'queued',
  items_found int not null default 0,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz
);

-- 5. Intelligence Items Table (Discovered Products / Features / Promos)
create table if not exists public.intelligence_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  scan_id uuid references public.scan_jobs(id) on delete set null,
  bank_id text not null,
  bank_name text not null,
  published_at date,
  title text not null,
  category text not null,
  summary text not null,
  audience text not null default 'Doanh nghiệp',
  website_url text,
  facebook_url text,
  source_types text[] not null default array['website'],
  verification_status text not null default 'verified' check(verification_status in ('verified', 'review', 'invalid')),
  confidence_score float not null default 0.95 check(confidence_score between 0 and 1),
  collected_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Item Sources Table (Detailed provenance links)
create table if not exists public.item_sources (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.intelligence_items(id) on delete cascade,
  source_type text not null check(source_type in ('website', 'facebook')),
  url text not null,
  title text,
  published_at timestamptz,
  evidence_text text,
  is_verified boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. Source Alerts Table
create table if not exists public.source_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  bank_id text not null,
  bank_name text not null,
  source_type text not null check(source_type in ('website', 'facebook')),
  error_cause text not null,
  http_status int,
  checked_at timestamptz not null default now(),
  resolved boolean not null default false
);

-- Indexes for ultra-fast filtering
create index if not exists idx_intelligence_published_at on public.intelligence_items(published_at);
create index if not exists idx_intelligence_bank on public.intelligence_items(bank_id);
create index if not exists idx_intelligence_category on public.intelligence_items(category);
create index if not exists idx_intelligence_verification on public.intelligence_items(verification_status);
create index if not exists idx_scan_jobs_status on public.scan_jobs(status);
create index if not exists idx_bank_sources_bank on public.bank_sources(bank_id);

-- Enable Row Level Security (RLS)
alter table public.banks enable row level security;
alter table public.bank_sources enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.intelligence_items enable row level security;
alter table public.source_alerts enable row level security;

-- Permissive policies for prototype / authenticated users
create policy "Allow all read banks" on public.banks for select using (true);
create policy "Allow all write banks" on public.banks for all using (true);

create policy "Allow all read bank_sources" on public.bank_sources for select using (true);
create policy "Allow all write bank_sources" on public.bank_sources for all using (true);

create policy "Allow all read scan_jobs" on public.scan_jobs for select using (true);
create policy "Allow all write scan_jobs" on public.scan_jobs for all using (true);

create policy "Allow all read intelligence_items" on public.intelligence_items for select using (true);
create policy "Allow all write intelligence_items" on public.intelligence_items for all using (true);

create policy "Allow all read source_alerts" on public.source_alerts for select using (true);
create policy "Allow all write source_alerts" on public.source_alerts for all using (true);
