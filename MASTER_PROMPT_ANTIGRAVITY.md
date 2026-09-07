# MASTER PROMPT — BUILD MB COMPETITIVE PRODUCT INTELLIGENCE TOOL

Bạn là Senior Full-stack Engineer + Product Engineer + Data Engineer. Hãy build production-ready tool dựa trên `prototype_reference.html`.

## Source of truth
- UI/UX: `prototype_reference.html`
- Data model: `supabase/schema.sql`
- Rules/spec: `docs/*`
- Không tự redesign. Có thể refactor, responsive, accessibility, nhưng phải giữ information architecture và interaction logic.

# 1. INFORMATION ARCHITECTURE

## LV1 — Tổng hợp dữ liệu
- Quản lý nguồn Facebook + Website theo ngân hàng.
- 1 ngân hàng = 1 source pair row, gồm Facebook URL + Website URL.
- Add source = thêm 1 row pair.
- Delete source = xóa cả Facebook + Website trong row đó.
- Verify 2 URL độc lập nhưng map cùng bank.
- Date range từ ngày → đến ngày.
- Trigger crawl.
- Bảng crawl result hiển thị 10 record rồi scroll dọc; header sticky.

## LV1 — Dữ liệu Sản phẩm/Tính năng

### LV2 — Sản phẩm/Tính năng MB so với đối thủ
Benchmark grid dạng Excel:
- Group/Journey rows
- Component rows
- Dynamic bank columns
- Mỗi bank/component cell: `description`, `score`
- Score: NULL/0/1/2/3
- Add/Edit/Delete Group, Row, Column
- Drag reorder Group, Row, Column và persist DB
- Drag component sang group khác
- Expand/Collapse group
- Import Excel + preview + confirm
- Export CSV/XLSX
- Sticky left `Nhóm / Tính năng`
- Sticky right `Thao tác`
- Row action menu `...`
- Edit component modal: description trái, score phải
- Delete group cascade components + cells
- Delete bank cascade cells, MB không được xóa

### LV2 — Ma trận chấm điểm MB so với đối thủ
Layout desktop:
- Left stack: `Xếp hạng vị thế` + `Radar`
- Right: `Ma trận chi tiết`
- Matrix fit card, tránh horizontal scroll ở desktop phổ biến
- Full platform names in headers
- Radar: MB luôn hiển thị, chọn tối đa 3 đối thủ, optional leader overlay, hover tooltip

# 2. SCORE RULES
- NULL = chưa đánh giá
- 0 = chưa có
- 1 = bán tự động / chưa toàn trình
- 2 = 100% online
- 3 = mới / nâng cao / vượt trội

Không persist NULL thành 0.

# 3. POSITION FORMULAS
- `total_score = SUM(non-null score)`
- `max_score = active_component_count * 3`
- `M3 = count(score=3)`
- profile = counts của 3/2/1/0/NULL
- `group_score = SUM(COALESCE(score,0)) / component_count_in_group`
- leader(group) = bank có group_score cao nhất

# 4. FRONTEND STACK
- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- TanStack Query
- TanStack Table
- dnd-kit
- Recharts
- React Hook Form + Zod
- Supabase SSR auth

Routes:
- `/summary`
- `/products`
- `/matrix`

Không hardcode bank columns.

# 5. BACKEND
## Next.js BFF
- Auth/session
- CRUD
- Supabase queries
- trigger crawl job
- import preview/commit
- analytics endpoints

## FastAPI worker
- website crawl
- Facebook provider adapter
- extraction
- dedupe
- relevance/classification
- background job processing

Không chạy crawl dài trực tiếp trong Vercel request.

# 6. SUPABASE
Dùng Postgres/Auth/Storage/RLS. Tất cả business rows có `org_id`. Service role chỉ server/worker.

# 7. SOURCE MODEL
Dùng bảng `source_pairs`: `bank_id`, `facebook_url`, `website_url`, verify flags. Không lưu FB và website thành 2 row độc lập ở UI/data model.

# 8. CRAWLER
Website pipeline:
1. source URL
2. sitemap/RSS discovery
3. fetch
4. main-content extraction
5. canonicalize
6. content hash
7. dedupe
8. relevance filter
9. map group/component/feature
10. save evidence

Facebook: không hardcode scrape HTML Facebook. Dùng adapter `facebook_graph` hoặc approved provider. Nếu provider chưa cấu hình, source status `provider_not_configured`, job vẫn tiếp tục.

# 9. EXCEL IMPORT
- Header col1 = Nhóm/Tính năng, col2..N = bank names
- Group row = chỉ col1 có dữ liệu
- Component row = col1 tên component, các bank col là description
- Flow: upload → parse → preview → confirm → transaction upsert
- score default NULL nếu file không có score

# 10. DRAG & DROP PERSISTENCE
- bank -> `banks.display_order`
- group -> `benchmark_groups.display_order`
- component -> `benchmark_components.display_order`
- moving component across group updates `group_id` + order

# 11. ACCEPTANCE CRITERIA
## Source
- Add source = 1 paired row
- Delete = delete pair
- Verify independently
- Crawl only non-empty URLs

## Benchmark
- Dynamic columns
- Group/row/column CRUD
- DnD persists
- Group cascade delete
- Bank cascade delete
- MB cannot delete
- Excel import works
- Sticky left/right columns

## Matrix
- total/max/M3/profile correct
- radar correct
- competitor selection max 3
- exact group names
- full platform names
- no horizontal scroll desktop normal viewport

## Security
- RLS enabled
- service role server only
- org membership validation
- SSRF protection crawler
- sanitize evidence
- crawl rate limiting

# 12. DELIVERY
Trả đầy đủ source code, SQL migration, seed, `.env.example`, local run README, deploy README, tests, screenshots 3 main screens, known limitations.
