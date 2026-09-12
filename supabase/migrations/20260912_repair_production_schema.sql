-- ==============================================================================
-- Repair and Synchronize Production Database Schema
-- Migration: 20260912_repair_production_schema.sql
-- Fixes missing scan_jobs columns (date_from, date_to), missing tables,
-- foreign keys, RLS policies, and reloads PostgREST schema cache.
-- ==============================================================================

create extension if not exists pgcrypto;

-- 1. BANKS TABLE (Ensure exists and updated)
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

-- 2. BANK_SOURCES TABLE
create table if not exists public.bank_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  bank_id uuid not null references public.banks(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, bank_id)
);

alter table public.bank_sources add column if not exists website_url text;
alter table public.bank_sources add column if not exists business_hub_url text;
alter table public.bank_sources add column if not exists news_urls text[] not null default array[]::text[];
alter table public.bank_sources add column if not exists promotion_urls text[] not null default array[]::text[];
alter table public.bank_sources add column if not exists sitemap_url text;
alter table public.bank_sources add column if not exists rss_url text;
alter table public.bank_sources add column if not exists allowed_domains text[] not null default array[]::text[];
alter table public.bank_sources add column if not exists render_mode text not null default 'raw';
alter table public.bank_sources add column if not exists adaptor_name text not null default 'generic';
alter table public.bank_sources add column if not exists facebook_url text;
alter table public.bank_sources add column if not exists facebook_page_id text;
alter table public.bank_sources add column if not exists enterprise_keywords text[] not null default array['doanh nghiệp','sme','corporate','khách hàng tổ chức'];
alter table public.bank_sources add column if not exists exclusion_keywords text[] not null default array['cá nhân','tuyển dụng','cổ đông','báo cáo tài chính'];
alter table public.bank_sources add column if not exists website_verified boolean not null default false;
alter table public.bank_sources add column if not exists facebook_verified boolean not null default false;
alter table public.bank_sources add column if not exists is_active boolean not null default true;
alter table public.bank_sources add column if not exists display_order int not null default 0;
alter table public.bank_sources add column if not exists last_scanned_at timestamptz;

-- Populate bank_sources from source_pairs if available
do $$
begin
  if to_regclass('public.source_pairs') is not null then
    insert into public.bank_sources (
      id, org_id, bank_id, website_url, business_hub_url, facebook_url,
      facebook_page_id, website_verified, facebook_verified, display_order,
      is_active, created_at, updated_at
    )
    select
      sp.id, sp.org_id, sp.bank_id, sp.website_url, sp.website_url,
      sp.facebook_url,
      nullif(regexp_replace(sp.facebook_url, '^.*/([^/?]+).*$','\1'), ''),
      sp.website_verified, false, sp.display_order, true,
      coalesce(sp.created_at, now()), coalesce(sp.updated_at, now())
    from public.source_pairs sp
    on conflict (org_id, bank_id) do update set
      website_url = coalesce(public.bank_sources.website_url, excluded.website_url),
      business_hub_url = coalesce(public.bank_sources.business_hub_url, excluded.business_hub_url),
      facebook_url = coalesce(public.bank_sources.facebook_url, excluded.facebook_url),
      facebook_page_id = coalesce(public.bank_sources.facebook_page_id, excluded.facebook_page_id),
      display_order = excluded.display_order,
      updated_at = now();
  end if;
end $$;

-- Update allowed_domains & adaptor_name for bank_sources
update public.bank_sources bs
set
  allowed_domains = array[regexp_replace(lower(split_part(coalesce(bs.business_hub_url, bs.website_url), '/', 3)), '^www\.', '')],
  adaptor_name = lower(b.code)
from public.banks b
where b.id = bs.bank_id
  and coalesce(array_length(bs.allowed_domains, 1), 0) = 0;

-- 3. SCAN_JOBS TABLE (Contains critical date_from and date_to)
create table if not exists public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  date_from date not null default current_date,
  date_to date not null default current_date,
  selected_banks text[] not null default array[]::text[],
  source_types text[] not null default array['website','facebook'],
  status text not null default 'queued',
  progress_percent int not null default 0,
  current_stage text,
  current_bank_name text,
  metrics jsonb not null default '{}'::jsonb,
  total_found int not null default 0,
  error_summary text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist on scan_jobs
alter table public.scan_jobs add column if not exists org_id uuid not null default '00000000-0000-0000-0000-000000000001';
alter table public.scan_jobs add column if not exists date_from date not null default current_date;
alter table public.scan_jobs add column if not exists date_to date not null default current_date;
alter table public.scan_jobs add column if not exists selected_banks text[] not null default array[]::text[];
alter table public.scan_jobs add column if not exists source_types text[] not null default array['website','facebook'];
alter table public.scan_jobs add column if not exists progress_percent int not null default 0;
alter table public.scan_jobs add column if not exists current_stage text;
alter table public.scan_jobs add column if not exists current_bank_name text;
alter table public.scan_jobs add column if not exists metrics jsonb not null default '{}'::jsonb;
alter table public.scan_jobs add column if not exists total_found int not null default 0;
alter table public.scan_jobs add column if not exists error_summary text;
alter table public.scan_jobs add column if not exists started_at timestamptz;
alter table public.scan_jobs add column if not exists finished_at timestamptz;
alter table public.scan_jobs add column if not exists updated_at timestamptz not null default now();

-- Ensure status column is text and can accept all statuses
alter table public.scan_jobs alter column status drop default;
alter table public.scan_jobs alter column status type text using status::text;
alter table public.scan_jobs alter column status set default 'queued';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='scan_jobs' and column_name='progress'
  ) then
    execute 'update public.scan_jobs set progress_percent = coalesce(progress_percent, progress, 0)';
  end if;
end $$;

-- 4. SCAN_JOB_SOURCES TABLE
create table if not exists public.scan_job_sources (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  bank_id uuid references public.banks(id) on delete cascade,
  source_type text not null,
  status text not null default 'queued'
);

alter table public.scan_job_sources add column if not exists bank_name text;
alter table public.scan_job_sources add column if not exists items_found int not null default 0;
alter table public.scan_job_sources add column if not exists pages_discovered int not null default 0;
alter table public.scan_job_sources add column if not exists pages_fetched int not null default 0;
alter table public.scan_job_sources add column if not exists items_parsed int not null default 0;
alter table public.scan_job_sources add column if not exists items_rejected int not null default 0;
alter table public.scan_job_sources add column if not exists error_code text;
alter table public.scan_job_sources add column if not exists error_message text;
alter table public.scan_job_sources add column if not exists http_status int;
alter table public.scan_job_sources add column if not exists started_at timestamptz;
alter table public.scan_job_sources add column if not exists finished_at timestamptz;
alter table public.scan_job_sources add column if not exists created_at timestamptz not null default now();
alter table public.scan_job_sources add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_scan_job_sources_scan_bank_type
  on public.scan_job_sources(scan_id, bank_id, source_type);

-- 5. CRAWL_ITEMS TABLE
create table if not exists public.crawl_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default '00000000-0000-0000-0000-000000000001',
  scan_id uuid references public.scan_jobs(id) on delete cascade,
  bank_id text not null,
  bank_name text,
  canonical_url text,
  title text not null,
  summary text,
  category text,
  audience text default 'Doanh nghiệp',
  published_at date,
  effective_from date,
  effective_to date,
  date_source text,
  verification_status text default 'verified',
  confidence_score float default 0.95,
  evidence_text text,
  website_url text,
  facebook_url text,
  source_types text[] default array['website'],
  collected_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crawl_items add column if not exists scan_id uuid references public.scan_jobs(id) on delete cascade;
alter table public.crawl_items add column if not exists bank_name text;
alter table public.crawl_items add column if not exists category text;
alter table public.crawl_items add column if not exists audience text default 'Doanh nghiệp';
alter table public.crawl_items add column if not exists effective_from date;
alter table public.crawl_items add column if not exists effective_to date;
alter table public.crawl_items add column if not exists date_source text;
alter table public.crawl_items add column if not exists verification_status text default 'verified';
alter table public.crawl_items add column if not exists confidence_score float default 0.95;
alter table public.crawl_items add column if not exists evidence_text text;
alter table public.crawl_items add column if not exists website_url text;
alter table public.crawl_items add column if not exists facebook_url text;
alter table public.crawl_items add column if not exists source_types text[];
alter table public.crawl_items add column if not exists collected_at timestamptz not null default now();
alter table public.crawl_items add column if not exists is_demo boolean not null default false;
alter table public.crawl_items add column if not exists source_type text;
alter table public.crawl_items add column if not exists source_url text;
alter table public.crawl_items add column if not exists content_hash text;
alter table public.crawl_items add column if not exists status text not null default 'new';

-- Drop legacy unique constraint if present
alter table public.crawl_items
  drop constraint if exists crawl_items_org_id_bank_id_source_type_content_hash_key;

-- Backfill bank_name for legacy rows
update public.crawl_items ci
set bank_name = b.name
from public.banks b
where b.id::text = ci.bank_id::text and ci.bank_name is null;

-- Mark legacy rows without scan_id or URL as invalid
update public.crawl_items
set verification_status = 'invalid'
where verification_status is null
   or scan_id is null
   or (website_url is null and facebook_url is null and canonical_url is null);

create unique index if not exists uq_crawl_items_scan_bank_url
  on public.crawl_items(scan_id, bank_id, canonical_url)
  where scan_id is not null and canonical_url is not null;

-- 6. CRAWL_ITEM_SOURCES TABLE
create table if not exists public.crawl_item_sources (
  id uuid primary key default gen_random_uuid(),
  crawl_item_id uuid not null references public.crawl_items(id) on delete cascade,
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  source_type text not null,
  url text not null,
  permalink_url text,
  title text,
  published_at timestamptz,
  evidence_text text,
  is_verified boolean not null default true,
  created_at timestamptz not null default now(),
  unique(crawl_item_id, source_type, url)
);

-- 7. SOURCE_ALERTS TABLE
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
alter table public.source_alerts add column if not exists scan_id uuid references public.scan_jobs(id) on delete cascade;

-- 8. CANDIDATE_AUDITS TABLE
create table if not exists public.candidate_audits (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_jobs(id) on delete cascade,
  bank_id text,
  bank_name text,
  source_type text not null,
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

-- Indexes
create index if not exists idx_scan_jobs_created_at on public.scan_jobs(created_at desc);
create index if not exists idx_scan_job_sources_scan_id on public.scan_job_sources(scan_id);
create index if not exists idx_crawl_items_scan_id on public.crawl_items(scan_id);
create index if not exists idx_crawl_items_published_at on public.crawl_items(published_at);
create index if not exists idx_candidate_audits_scan_id on public.candidate_audits(scan_id);
create index if not exists idx_source_alerts_scan_id on public.source_alerts(scan_id);

-- Enable RLS and Permissive Policies for Web Application
alter table public.banks enable row level security;
alter table public.bank_sources enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.scan_job_sources enable row level security;
alter table public.crawl_items enable row level security;
alter table public.crawl_item_sources enable row level security;
alter table public.source_alerts enable row level security;
alter table public.candidate_audits enable row level security;

-- Policies for banks
drop policy if exists "Allow all read banks" on public.banks;
drop policy if exists "Allow all write banks" on public.banks;
create policy "Allow all read banks" on public.banks for select using (true);
create policy "Allow all write banks" on public.banks for all using (true) with check (true);

-- Policies for bank_sources
drop policy if exists "Allow all read bank_sources" on public.bank_sources;
drop policy if exists "Allow all write bank_sources" on public.bank_sources;
create policy "Allow all read bank_sources" on public.bank_sources for select using (true);
create policy "Allow all write bank_sources" on public.bank_sources for all using (true) with check (true);

-- Policies for scan_jobs
drop policy if exists "Allow all read scan_jobs" on public.scan_jobs;
drop policy if exists "Allow all write scan_jobs" on public.scan_jobs;
create policy "Allow all read scan_jobs" on public.scan_jobs for select using (true);
create policy "Allow all write scan_jobs" on public.scan_jobs for all using (true) with check (true);

-- Policies for scan_job_sources
drop policy if exists "Allow all read scan_job_sources" on public.scan_job_sources;
drop policy if exists "Allow all write scan_job_sources" on public.scan_job_sources;
create policy "Allow all read scan_job_sources" on public.scan_job_sources for select using (true);
create policy "Allow all write scan_job_sources" on public.scan_job_sources for all using (true) with check (true);

-- Policies for crawl_items
drop policy if exists "Allow all read crawl_items" on public.crawl_items;
drop policy if exists "Allow all write crawl_items" on public.crawl_items;
create policy "Allow all read crawl_items" on public.crawl_items for select using (true);
create policy "Allow all write crawl_items" on public.crawl_items for all using (true) with check (true);

-- Policies for crawl_item_sources
drop policy if exists "Allow all read crawl_item_sources" on public.crawl_item_sources;
drop policy if exists "Allow all write crawl_item_sources" on public.crawl_item_sources;
create policy "Allow all read crawl_item_sources" on public.crawl_item_sources for select using (true);
create policy "Allow all write crawl_item_sources" on public.crawl_item_sources for all using (true) with check (true);

-- Policies for source_alerts
drop policy if exists "Allow all read source_alerts" on public.source_alerts;
drop policy if exists "Allow all write source_alerts" on public.source_alerts;
create policy "Allow all read source_alerts" on public.source_alerts for select using (true);
create policy "Allow all write source_alerts" on public.source_alerts for all using (true) with check (true);

-- Policies for candidate_audits
drop policy if exists "Allow all read candidate_audits" on public.candidate_audits;
drop policy if exists "Allow all write candidate_audits" on public.candidate_audits;
create policy "Allow all read candidate_audits" on public.candidate_audits for select using (true);
create policy "Allow all write candidate_audits" on public.candidate_audits for all using (true) with check (true);

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
