-- ==========================================================
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
values ('00000000-0000-0000-0000-000000000001', 'MB Bank Competitive Intelligence Unit');

-- Banks
insert into public.banks (id, org_id, name, code, is_mb, active, display_order)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'BIZ MBBank', 'MB', true, true, 0),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Techcombank Business', 'TCB', false, true, 1),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'VietinBank eFAST', 'CTG', false, true, 2),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'BIDV (BIDV Direct)', 'BIDV', false, true, 3),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'VPBank NEOBiz', 'VPB', false, true, 4);

-- Source Pairs
insert into public.source_pairs (id, org_id, bank_id, facebook_url, website_url, facebook_verified, website_verified, display_order)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'https://www.facebook.com/techcombank', 'https://www.techcombank.com.vn', true, true, 0),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'https://www.facebook.com/vietinbank', 'https://www.vietinbank.vn', true, true, 1),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'https://www.facebook.com/vpbank', 'https://www.vpbank.com.vn', true, true, 2),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'https://www.facebook.com/bidv', 'https://www.bidv.com.vn', true, true, 3);

-- Benchmark Groups
insert into public.benchmark_groups (id, org_id, name, display_order, active)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'A. ONBOARDING', 0, true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'B. TÀI KHOẢN & THANH TOÁN', 1, true),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'C. TIỀN GỬI VÀ ĐẦU TƯ', 2, true),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'C. TÀI TRỢ THƯƠNG MẠI', 3, true),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'D. TÍN DỤNG', 4, true),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'E. QUẢN TRỊ TÀI CHÍNH', 5, true);

-- Benchmark Components
insert into public.benchmark_components (id, org_id, group_id, name, display_order, active)
values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Mở TK online', 0, true),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Homepage', 1, true),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Sao kê/sổ phụ', 2, true),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Chuyển tiền 24/7 & theo lô', 3, true),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Nộp thuế / hải quan / hóa đơn', 4, true),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Thẻ doanh nghiệp online', 5, true),
  ('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Thanh toán quốc tế online', 6, true),
  ('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Tiền gửi CKH online', 7, true),
  ('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Sinh lời tự động', 8, true),
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'CDs', 9, true),
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Sản phẩm đầu tư khác', 10, true),
  ('40000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Mua bán ngoại tệ online', 11, true),
  ('40000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'L/C online', 12, true),
  ('40000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Cấp hạn mức', 13, true),
  ('40000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Ký kết văn kiện tín dụng', 14, true),
  ('40000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Giải ngân online', 15, true),
  ('40000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Bảo lãnh online', 16, true),
  ('40000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', '360 Độ doanh nghiệp', 17, true),
  ('40000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'SME Grow', 18, true);

-- Benchmark Cells (95 records)
insert into public.benchmark_cells (org_id, component_id, bank_id, score, description)
values
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 3, 'Có — ~3 phút, chọn TK số đẹp
Mở tài khoản xong có thể giao dịch được ngay.
Hồ sơ mở tài khoản thiếu có thể bổ sung online'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'Có — ~10 phút, chọn số TK đẹp.
Mở tài khoản online cần xác minh tại quầy trước khi giao dịch
Hồ sơ thiếu cần bổ sung tại quầy'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 1, 'Có.
Mở tài khoản online cần xác minh tại quầy trước khi giao dịch
Hồ sơ thiếu cần bổ sung tại quầy'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 1, 'Có
Mở tài khoản online cần xác minh tại quầy trước khi giao dịch
Hồ sơ thiếu cần bổ sung tại quầy'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 1, 'Có - ~5 phút
Mở tài khoản online cần xác minh tại quầy trước khi giao dịch
Hồ sơ thiếu cần bổ sung tại quầy'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 2, 'Có — có số dư (bao gồm VNĐ + ngoại tệ)
Có dòng tiền
Có danh sách giao dịch gần đây của Maker và Checker'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 2, 'Có — dashboard có:
- số dư (bao gồm VNĐ + ngoại tệ)
- Tổng tiền gửi
- Tổng khoản vay
- có dòng tiền'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 2, 'Có số dư, biểu đồ thu-chi theo tháng
như các ví điện tử'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 2, 'Có — dashboard có:
- số dư (bao gồm VNĐ + ngoại tệ)
- Tổng tiền gửi
- Tổng khoản vay
- Dòng tiền vào - ra, SK giao dịch'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 2, 'Có số dư, tiền gửi, khoản vay, sao kê GD gần nhất
Chưa có biểu đồ thu chi, dòng tiền'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 3, 'Có, thêm các tính năng
- Sao kê/sổ phụ
- Xác nhận số dư từ ngân hàng
- Đối chiếu tài khoản'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 2, 'Có — chuyển tiền nhanh 24/7, theo lô, mã citad
Chuyển ngoại tệ trong nước
Chuyển lương VND
Chưa có chuyển lương ngoại tệ
Chưa có đặt lệnh giao dịch trong tương lai
Chưa có tra soát online'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 3, 'Có — chuyển tiền nhanh 24/7 và theo lô,
có tính năng đặt lịch chuyển tiền, có tính năng yêu cầu tra soát chuyển tiền,
có đặt lệnh giao dịch trong tương lai'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 2, 'Có — qua TK 24/7 (new), tối đa 5000 GD/file, số tiền tối đa 1 GD đi ngoài hệ thống trên file 500trđ'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 3, 'Có — chuyển tiền nhanh 24/7 và theo lô,
có tính năng đặt lịch chuyển tiền, có tính năng yêu cầu tra soát chuyển tiền,
có đặt lệnh giao dịch trong tương lai'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 3, 'Có chuyển tiền 24/7/lương/lô (giới hạn 10,000 giao dịch/file chuyển tiền theo lô)
Có tính năng chuyển tiền định kỳ'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 2, 'Có phát hành thẻ
Có quản trị thẻ online
Chưa có thanh toán thẻ'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 3, 'Có phát hành thẻ
Có quản trị thẻ online
Có thanh toán thẻ'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 1, 'Chưa có phát hành thẻ
Có quản trị thẻ online'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 1, 'Chưa có phát hành thẻ
Có quản trị thẻ online
Có thanh toán thẻ'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 0, 'Không có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 2, 'Có — chuyển tiền quốc tế online, truy vấn, tra soát, bổ sung chứng từ online
Chưa cho phép thanh toán nhiều đối tác cùng lúc'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 3, 'Có — CTQT online, không giới hạn COT
Cho phép CTQT nhiều đối tác cùng lúc
Bổ sung chứng từ không qua cấp duyệt'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 2, 'Có — chuyển tiền quốc tế online, truy vấn, tra soát, bổ sung chứng từ online
Chưa cho phép thanh toán nhiều đối tác cùng lúc'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 3, 'Chuyển tiền quốc tế online, truy vấn, tra soát
Bổ sung chứng từ online
Cho phép CTQT nhiều đối tác cùng lúc'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 2, 'Chuyển tiền quốc tế online, truy vấn, tra soát, bổ sung chứng từ online'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000004', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 3, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', 3, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 2, 'Có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 3, 'Có khóa tỷ giá cố định
Có mbeechat tỷ giá ngay trên BIZ'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 2, 'Có khóa tỷ giá cố định
Không có mbeechat realtime'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 3, 'Có module bảng giá giao dịch để KH theo dõi biến động tỷ giá
Không có mbeechat realtime'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 2, 'Có khóa tỷ giá cố định
Không có mbeechat realtime'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', 2, 'Có khóa tỷ giá cố định
Không có mbeechat realtime'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 3, 'Có tư vấn, phát hành, thanh toán LC online'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 1, 'Có phát hành LC trong khoảng 1 giờ, chưa có tư vấn, thanh toán LC'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', 1, 'Có phát hành LC theo hạn mức, chưa có tư vấn và thanh toán LC'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004', 1, 'Có phát hành LC theo hạn mức, chưa có tư vấn và thanh toán LC'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 1, 'Có phát hành LC theo hạn mức, chưa có tư vấn và thanh toán LC'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 3, '1. Có đề nghị cấp hạn mức/điều chỉnh hạn mức online.
2. Có cấp tín dụng theo quy trình preapproved trọn luồng kênh số.
3. Có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 2, '1. Có đề nghị cấp hạn mức online
2. Có hạn mức pre-approved tới 20 tỷ
3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', 2, '1. Có cấp hạn mức online
2. Không có luồng pre tín chấp online
3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004', 0, '1. Không có cấp hạn mức online
2. Không có luồng Preapproved online
3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 2, '1. Có cấp hạn mức online
2. Không có luồng pre tín chấp online
3. Chưa có luồng ngân hàng chủ động tái cấp khi đến hạn hạn mức'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 3, 'Có ký số các loại văn kiện tín dụng với doanh nghiệp (trừ văn kiện thế chấp cần công chứng) với tất cả các phương án'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000004', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005', 1, 'Có ký số văn kiện tín dụng doanh nghiệp tuy nhiên chỉ ký được với HĐTD của sản phẩm thấu chi tín chấp'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 3, '1. Có giải ngân online
2. Có giải ngân tự động, khách hàng nhận tiền ngay sau khi khách hàng duyệt trên nền tảng ebanking.'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000002', 3, '1. Có giải ngân online
2. Có giải ngân tự động, khách hàng nhận tiền ngay sau khi khách hàng duyệt trên nền tảng ebanking.'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000003', 2, '1. Có giải ngân online
2. Không có giải ngân tự động'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000004', 2, '1. Có giải ngân online
2. Không có giải ngân tự động'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000005', 3, '1. Có giải ngân online
2. Có giải ngân tự động, khách hàng nhận tiền ngay sau khi khách hàng duyệt trên nền tảng ebanking.'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001', 2, '1. Có bảo lãnh online
2. Có bảo lãnh tích hợp eGP'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000002', 2, 'Có phát hành bảo lãnh online trong 1–2 giờ
Có bảo lãnh tích hợp eGP'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000003', 2, 'Có bảo lãnh online
Có bảo lãnh tích hợp eGP'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000004', 2, 'Có bảo lãnh online
Có bảo lãnh tích hợp eGP'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000005', 2, 'Có bảo lãnh online
Có bảo lãnh tích hợp eGP'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000001', 2, 'Giai đoạn 1: Xem thông tin doanh nghiệp: thông tin chung, danh sách người dùng BIZ, thay đổi hạn mức giao dịch
Giai đoạn 2 (dự kiến): Upload, lưu trữ hồ sơ tài chính/pháp lý, thay đổi thông tin DN, quản trị khóa/mở user BIZ'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000002', 2, 'Xem thông tin doanh nghiệp: thông tin chung, danh sách người dùng BIZ, thay đổi hạn mức giao dịch'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000003', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000004', 2, 'Xem thông tin doanh nghiệp: thông tin chung, danh sách người dùng BIZ, thay đổi hạn mức giao dịch'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000005', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001', 3, 'SME Grow & phân tích thị trường
Health check BCTC'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000002', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000003', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000004', 0, 'Chưa có'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000005', 0, 'Chưa có');

-- Sample Discovery Crawl Items
insert into public.crawl_items (id, org_id, bank_id, source_type, source_url, detected_at, title, feature_name, content_hash, status)
values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'facebook', 'https://www.facebook.com/techcombank', now() - interval '1 day', 'Ra mắt tính năng thanh toán...', 'Apple Pay trên Techcombank', 'hash-tcb-1', 'new'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'facebook', 'https://www.facebook.com/vietinbank', now() - interval '2 day', 'Ưu đãi phí chuyển tiền quốc tế', 'Chuyển tiền quốc tế', 'hash-ctg-1', 'new'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'website', 'https://www.vpbank.com.vn', now() - interval '3 day', 'Giải pháp tài trợ chuỗi cung ứng', 'Cấp hạn mức tín dụng', 'hash-vpb-1', 'new'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'website', 'https://www.bidv.com.vn', now() - interval '4 day', 'Dịch vụ nộp thuế doanh nghiệp', 'Nộp thuế / hóa đơn', 'hash-bidv-1', 'new');
