-- Repair the LIVE schema in-place.
-- The previous "unified" migration only used CREATE TABLE IF NOT EXISTS, so it
-- did not add the new columns to databases that already had the legacy tables.
begin;

create extension if not exists pgcrypto;

-- Source configuration -------------------------------------------------------
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

-- Copy the current production source configuration instead of falling back to
-- process memory. Keep the Facebook handle as a provisional page identifier;
-- it still has to be verified by Graph API before facebook_verified becomes true.
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
      website_url = excluded.website_url,
      business_hub_url = excluded.business_hub_url,
      facebook_url = excluded.facebook_url,
      facebook_page_id = coalesce(public.bank_sources.facebook_page_id, excluded.facebook_page_id),
      display_order = excluded.display_order,
      updated_at = now();
  end if;
end $$;

update public.bank_sources bs
set
  allowed_domains = array[regexp_replace(lower(split_part(coalesce(bs.business_hub_url, bs.website_url), '/', 3)), '^www\.', '')],
  adaptor_name = lower(b.code)
from public.banks b
where b.id = bs.bank_id
  and coalesce(array_length(bs.allowed_domains, 1), 0) = 0;

-- Scan jobs ------------------------------------------------------------------
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

-- Legacy deployments used an enum that cannot store partial/empty.
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

-- Per-source execution state -------------------------------------------------
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
create unique index if not exists uq_scan_job_sources_scan_bank_type
  on public.scan_job_sources(scan_id, bank_id, source_type);

-- Results --------------------------------------------------------------------
alter table public.crawl_items add column if not exists scan_id uuid references public.scan_jobs(id) on delete cascade;
alter table public.crawl_items add column if not exists bank_name text;
alter table public.crawl_items add column if not exists category text;
alter table public.crawl_items add column if not exists audience text;
alter table public.crawl_items add column if not exists effective_from date;
alter table public.crawl_items add column if not exists effective_to date;
alter table public.crawl_items add column if not exists date_source text;
alter table public.crawl_items add column if not exists verification_status text;
alter table public.crawl_items add column if not exists confidence_score float;
alter table public.crawl_items add column if not exists evidence_text text;
alter table public.crawl_items add column if not exists website_url text;
alter table public.crawl_items add column if not exists facebook_url text;
alter table public.crawl_items add column if not exists source_types text[];
alter table public.crawl_items add column if not exists collected_at timestamptz not null default now();
alter table public.crawl_items add column if not exists is_demo boolean not null default false;
-- Compatibility fields are still consumed by the older crawl-items APIs.
alter table public.crawl_items add column if not exists source_type text;
alter table public.crawl_items add column if not exists source_url text;
alter table public.crawl_items add column if not exists content_hash text;
alter table public.crawl_items add column if not exists status text not null default 'new';

-- Remove the legacy cross-scan uniqueness rule. It rejected a URL that had
-- already appeared in an older scan, even though the new contract is isolated
-- by scan_id.
alter table public.crawl_items
  drop constraint if exists crawl_items_org_id_bank_id_source_type_content_hash_key;

update public.crawl_items ci
set bank_name = b.name
from public.banks b
where b.id::text = ci.bank_id::text and ci.bank_name is null;

-- Existing rows were created under the broken contract. Preserve them for
-- audit, but never present them as verified market intelligence.
update public.crawl_items
set verification_status = 'invalid'
where verification_status is null
   or scan_id is null
   or (website_url is null and facebook_url is null);

create unique index if not exists uq_crawl_items_scan_bank_url
  on public.crawl_items(scan_id, bank_id, canonical_url);

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

alter table public.source_alerts add column if not exists scan_id uuid references public.scan_jobs(id) on delete cascade;

create index if not exists idx_scan_jobs_created_at on public.scan_jobs(created_at desc);
create index if not exists idx_scan_job_sources_scan_id on public.scan_job_sources(scan_id);
create index if not exists idx_crawl_items_scan_id on public.crawl_items(scan_id);
create index if not exists idx_crawl_items_published_at on public.crawl_items(published_at);
create index if not exists idx_candidate_audits_scan_id on public.candidate_audits(scan_id);

commit;
