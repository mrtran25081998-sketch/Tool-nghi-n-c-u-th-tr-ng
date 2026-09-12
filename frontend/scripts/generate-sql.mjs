import * as fs from 'fs';
import * as path from 'path';
import {
  INITIAL_BANKS,
  INITIAL_SOURCE_PAIRS,
  INITIAL_GROUPS,
  INITIAL_COMPONENTS,
  INITIAL_CELLS,
  INITIAL_CRAWL_ITEMS,
  DEFAULT_ORG_ID,
} from '../src/lib/initialData.ts';

const bankIdMap = {
  'bank-mb': '10000000-0000-0000-0000-000000000001',
  'bank-tcb': '10000000-0000-0000-0000-000000000002',
  'bank-ctg': '10000000-0000-0000-0000-000000000003',
  'bank-bidv': '10000000-0000-0000-0000-000000000004',
  'bank-vpb': '10000000-0000-0000-0000-000000000005',
};

const groupIdMap = {
  'group-a': '30000000-0000-0000-0000-000000000001',
  'group-b': '30000000-0000-0000-0000-000000000002',
  'group-c1': '30000000-0000-0000-0000-000000000003',
  'group-c2': '30000000-0000-0000-0000-000000000004',
  'group-d': '30000000-0000-0000-0000-000000000005',
  'group-e': '30000000-0000-0000-0000-000000000006',
};

function formatCompUUID(index) {
  const padded = String(index).padStart(12, '0');
  return `40000000-0000-0000-0000-${padded}`;
}

function formatSourcePairUUID(index) {
  const padded = String(index).padStart(12, '0');
  return `20000000-0000-0000-0000-${padded}`;
}

function formatCrawlItemUUID(index) {
  const padded = String(index).padStart(12, '0');
  return `50000000-0000-0000-0000-${padded}`;
}

const compIdMap = {};
INITIAL_COMPONENTS.forEach((c, idx) => {
  compIdMap[c.id] = formatCompUUID(idx + 1);
});

function escapeSql(str) {
  if (!str) return "''";
  return `'${str.replace(/'/g, "''")}'`;
}

// Generate SQL statements
let sql = `-- ==========================================================
-- MB COMPETITIVE PRODUCT INTELLIGENCE - FULL DATABASE SETUP
-- (Includes Tables, Views, RLS Policies & Complete Seed Data)
-- ==========================================================

create extension if not exists pgcrypto;

-- 1. DROP EXISTING TABLES IF ANY (Clean Setup)
drop view if exists public.group_bank_scores cascade;
drop view if exists public.bank_position_summary cascade;
drop table if exists public.benchmark_cells cascade;
drop table if exists public.crawl_items cascade;
drop table if exists public.benchmark_components cascade;
drop table if exists public.benchmark_groups cascade;
drop table if exists public.crawl_jobs cascade;
drop table if exists public.source_pairs cascade;
drop table if exists public.banks cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;

-- 2. CREATE TABLES
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.banks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  is_mb boolean not null default false,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, code)
);

create table public.source_pairs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  bank_id uuid not null references public.banks(id) on delete cascade,
  facebook_url text,
  website_url text,
  facebook_verified boolean not null default false,
  website_verified boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, bank_id)
);

create table public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  date_from date not null,
  date_to date not null,
  status text not null default 'queued',
  progress int not null default 0 check(progress between 0 and 100),
  error_summary text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table public.benchmark_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.benchmark_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.benchmark_groups(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crawl_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.crawl_jobs(id) on delete set null,
  bank_id uuid not null references public.banks(id) on delete cascade,
  source_type text not null,
  source_url text not null,
  canonical_url text,
  published_at timestamptz,
  detected_at timestamptz not null default now(),
  title text,
  raw_text text,
  summary text,
  content_hash text not null,
  status text not null default 'new',
  mapped_group_id uuid references public.benchmark_groups(id) on delete set null,
  mapped_component_id uuid references public.benchmark_components(id) on delete set null,
  feature_name text,
  confidence numeric(5,4),
  metadata jsonb not null default '{}'::jsonb,
  unique(org_id, bank_id, source_type, content_hash)
);

create table public.benchmark_cells (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  component_id uuid not null references public.benchmark_components(id) on delete cascade,
  bank_id uuid not null references public.banks(id) on delete cascade,
  description text not null default '',
  score smallint check(score is null or score between 0 and 3),
  evidence_url text,
  evidence_item_id uuid references public.crawl_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, component_id, bank_id)
);

-- 3. INDEXES
create index idx_banks_org_order on public.banks(org_id, display_order);
create index idx_groups_org_order on public.benchmark_groups(org_id, display_order);
create index idx_components_group_order on public.benchmark_components(group_id, display_order);
create index idx_cells_component_bank on public.benchmark_cells(component_id, bank_id);
create index idx_crawl_items_org_detected on public.crawl_items(org_id, detected_at desc);

-- 4. VIEWS
create or replace view public.bank_position_summary as
select b.org_id, b.id as bank_id, b.name as bank_name, b.code, b.is_mb,
       count(c.id) filter(where c.active) as component_count,
       coalesce(sum(cell.score) filter(where c.active), 0)::int as total_score,
       (count(c.id) filter(where c.active) * 3)::int as max_score,
       count(*) filter(where c.active and cell.score = 3)::int as m3_count,
       count(*) filter(where c.active and cell.score = 2)::int as m2_count,
       count(*) filter(where c.active and cell.score = 1)::int as m1_count,
       count(*) filter(where c.active and cell.score = 0)::int as m0_count,
       count(*) filter(where c.active and cell.score is null)::int as null_count
from public.banks b
join public.benchmark_components c on c.org_id = b.org_id
left join public.benchmark_cells cell on cell.org_id = b.org_id and cell.component_id = c.id and cell.bank_id = b.id
where b.active
group by b.org_id, b.id, b.name, b.code, b.is_mb;

create or replace view public.group_bank_scores as
select b.org_id, g.id as group_id, g.name as group_name, b.id as bank_id, b.name as bank_name,
       round(avg(coalesce(cell.score, 0)::numeric), 2) as group_score
from public.banks b
cross join public.benchmark_groups g
left join public.benchmark_components c on c.group_id = g.id and c.org_id = b.org_id and c.active
left join public.benchmark_cells cell on cell.component_id = c.id and cell.bank_id = b.id
where b.active and g.active
group by b.org_id, g.id, g.name, b.id, b.name;

-- 5. ENABLE ROW LEVEL SECURITY & PERMISSIVE POLICIES
alter table public.organizations enable row level security;
alter table public.banks enable row level security;
alter table public.source_pairs enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.crawl_items enable row level security;
alter table public.benchmark_groups enable row level security;
alter table public.benchmark_components enable row level security;
alter table public.benchmark_cells enable row level security;

create policy "Allow all on organizations" on public.organizations for all using (true) with check (true);
create policy "Allow all on banks" on public.banks for all using (true) with check (true);
create policy "Allow all on source_pairs" on public.source_pairs for all using (true) with check (true);
create policy "Allow all on crawl_jobs" on public.crawl_jobs for all using (true) with check (true);
create policy "Allow all on crawl_items" on public.crawl_items for all using (true) with check (true);
create policy "Allow all on benchmark_groups" on public.benchmark_groups for all using (true) with check (true);
create policy "Allow all on benchmark_components" on public.benchmark_components for all using (true) with check (true);
create policy "Allow all on benchmark_cells" on public.benchmark_cells for all using (true) with check (true);

-- 6. SEED DATA
-- Organization
insert into public.organizations (id, name)
values ('${DEFAULT_ORG_ID}', 'MB Bank Competitive Intelligence Unit');

-- Banks
insert into public.banks (id, org_id, name, code, is_mb, active, display_order)
values
${INITIAL_BANKS.map((b) => `  ('${bankIdMap[b.id]}', '${DEFAULT_ORG_ID}', ${escapeSql(b.name)}, ${escapeSql(b.code)}, ${b.is_mb}, ${b.active}, ${b.display_order})`).join(',\n')};

-- Source Pairs
insert into public.source_pairs (id, org_id, bank_id, facebook_url, website_url, facebook_verified, website_verified, display_order)
values
${INITIAL_SOURCE_PAIRS.filter((s) => bankIdMap[s.bank_id]).map((s, idx) => `  ('${formatSourcePairUUID(idx + 1)}', '${DEFAULT_ORG_ID}', '${bankIdMap[s.bank_id]}', ${escapeSql(s.facebook_url)}, ${escapeSql(s.website_url)}, ${s.facebook_verified}, ${s.website_verified}, ${s.display_order})`).join(',\n')};

-- Benchmark Groups
insert into public.benchmark_groups (id, org_id, name, display_order, active)
values
${INITIAL_GROUPS.map((g) => `  ('${groupIdMap[g.id]}', '${DEFAULT_ORG_ID}', ${escapeSql(g.name)}, ${g.display_order}, ${g.active})`).join(',\n')};

-- Benchmark Components
insert into public.benchmark_components (id, org_id, group_id, name, display_order, active)
values
${INITIAL_COMPONENTS.map((c) => `  ('${compIdMap[c.id]}', '${DEFAULT_ORG_ID}', '${groupIdMap[c.group_id]}', ${escapeSql(c.name)}, ${c.display_order}, ${c.active})`).join(',\n')};

-- Benchmark Cells (${INITIAL_CELLS.length} records)
insert into public.benchmark_cells (org_id, component_id, bank_id, score, description)
values
${INITIAL_CELLS.map((cell) => `  ('${DEFAULT_ORG_ID}', '${compIdMap[cell.component_id]}', '${bankIdMap[cell.bank_id]}', ${cell.score === null ? 'null' : cell.score}, ${escapeSql(cell.description)})`).join(',\n')};

-- Sample Discovery Crawl Items
insert into public.crawl_items (id, org_id, bank_id, source_type, source_url, detected_at, title, feature_name, content_hash, status)
values
${INITIAL_CRAWL_ITEMS.slice(0, 4).map((item, idx) => `  ('${formatCrawlItemUUID(idx + 1)}', '${DEFAULT_ORG_ID}', '${bankIdMap[item.bank_id] || bankIdMap['bank-tcb']}', ${escapeSql(item.source_type)}, ${escapeSql(item.source_url)}, now() - interval '${idx + 1} day', ${escapeSql(item.title)}, ${escapeSql(item.feature_name)}, ${escapeSql(item.content_hash)}, 'new')`).join(',\n')};
`;

const outAllInOne = path.resolve(process.cwd(), '../supabase/all_in_one.sql');
fs.writeFileSync(outAllInOne, sql, 'utf8');
console.log('✅ Successfully generated supabase/all_in_one.sql');
