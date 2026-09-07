create extension if not exists pgcrypto;

create type app_role as enum ('owner','admin','editor','viewer');
create type crawl_status as enum ('queued','running','completed','partial','failed','cancelled');
create type source_type as enum ('facebook','website');
create type crawl_item_status as enum ('new','accepted','rejected','needs_review');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'viewer',
  primary key (org_id,user_id)
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
  unique(org_id,code)
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
  unique(org_id,bank_id)
);

create table public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid references auth.users(id),
  date_from date not null,
  date_to date not null,
  status crawl_status not null default 'queued',
  progress int not null default 0 check(progress between 0 and 100),
  error_summary text,
  created_at timestamptz not null default now(),
  started_at timestamptz, finished_at timestamptz
);

create table public.benchmark_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, display_order int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.benchmark_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.benchmark_groups(id) on delete cascade,
  name text not null, display_order int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.crawl_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.crawl_jobs(id) on delete set null,
  bank_id uuid not null references public.banks(id) on delete cascade,
  source_type source_type not null,
  source_url text not null, canonical_url text, published_at timestamptz, detected_at timestamptz not null default now(),
  title text, raw_text text, summary text, content_hash text not null,
  status crawl_item_status not null default 'new',
  mapped_group_id uuid references public.benchmark_groups(id) on delete set null,
  mapped_component_id uuid references public.benchmark_components(id) on delete set null,
  feature_name text, confidence numeric(5,4), metadata jsonb not null default '{}'::jsonb,
  unique(org_id,bank_id,source_type,content_hash)
);

create table public.benchmark_cells (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  component_id uuid not null references public.benchmark_components(id) on delete cascade,
  bank_id uuid not null references public.banks(id) on delete cascade,
  description text not null default '',
  score smallint check(score is null or score between 0 and 3),
  evidence_url text, evidence_item_id uuid references public.crawl_items(id) on delete set null,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(org_id,component_id,bank_id)
);

create index idx_banks_org_order on public.banks(org_id,display_order);
create index idx_groups_org_order on public.benchmark_groups(org_id,display_order);
create index idx_components_group_order on public.benchmark_components(group_id,display_order);
create index idx_cells_component_bank on public.benchmark_cells(component_id,bank_id);
create index idx_crawl_items_org_detected on public.crawl_items(org_id,detected_at desc);

create or replace function public.is_org_member(target_org uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.org_id=target_org and m.user_id=auth.uid())
$$;
create or replace function public.can_edit_org(target_org uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.org_id=target_org and m.user_id=auth.uid() and m.role in ('owner','admin','editor'))
$$;

alter table public.banks enable row level security;
alter table public.source_pairs enable row level security;
alter table public.crawl_jobs enable row level security;
alter table public.crawl_items enable row level security;
alter table public.benchmark_groups enable row level security;
alter table public.benchmark_components enable row level security;
alter table public.benchmark_cells enable row level security;

do $$ declare t text; begin
  foreach t in array array['banks','source_pairs','crawl_jobs','crawl_items','benchmark_groups','benchmark_components','benchmark_cells'] loop
    execute format('create policy %I_read on public.%I for select using (public.is_org_member(org_id))',t,t);
    execute format('create policy %I_write on public.%I for all using (public.can_edit_org(org_id)) with check (public.can_edit_org(org_id))',t,t);
  end loop;
end $$;

create or replace view public.bank_position_summary as
select b.org_id,b.id bank_id,b.name bank_name,b.code,b.is_mb,
       count(c.id) filter(where c.active) component_count,
       coalesce(sum(cell.score) filter(where c.active),0)::int total_score,
       (count(c.id) filter(where c.active)*3)::int max_score,
       count(*) filter(where c.active and cell.score=3)::int m3_count,
       count(*) filter(where c.active and cell.score=2)::int m2_count,
       count(*) filter(where c.active and cell.score=1)::int m1_count,
       count(*) filter(where c.active and cell.score=0)::int m0_count,
       count(*) filter(where c.active and cell.score is null)::int null_count
from public.banks b
join public.benchmark_components c on c.org_id=b.org_id
left join public.benchmark_cells cell on cell.org_id=b.org_id and cell.component_id=c.id and cell.bank_id=b.id
where b.active
group by b.org_id,b.id,b.name,b.code,b.is_mb;

create or replace view public.group_bank_scores as
select b.org_id,g.id group_id,g.name group_name,b.id bank_id,b.name bank_name,avg(coalesce(cell.score,0)::numeric) group_score
from public.banks b
join public.benchmark_groups g on g.org_id=b.org_id and g.active
join public.benchmark_components c on c.org_id=b.org_id and c.group_id=g.id and c.active
left join public.benchmark_cells cell on cell.org_id=b.org_id and cell.component_id=c.id and cell.bank_id=b.id
where b.active
group by b.org_id,g.id,g.name,b.id,b.name;
