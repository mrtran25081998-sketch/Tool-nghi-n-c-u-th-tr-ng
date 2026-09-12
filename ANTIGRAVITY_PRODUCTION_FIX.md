# Lệnh sửa triệt để menu “Tổng hợp dữ liệu”

Hãy áp dụng trực tiếp các thay đổi đang có trong working tree này. Không thay bằng mock data, dữ liệu seed hoặc fallback in-memory.

## Nguyên nhân đã được kiểm chứng trên production

1. `20260912_unified_schema.sql` dùng `CREATE TABLE IF NOT EXISTS`, nên các bảng legacy đang tồn tại không được bổ sung cột mới.
2. API vẫn trả HTTP 202 dù insert `scan_jobs`/`scan_job_sources` lỗi, làm lượt quét nằm mãi ở `queued`.
3. Khi đọc `bank_sources` lỗi hoặc rỗng, ứng dụng âm thầm dùng `INITIAL_SOURCE_PAIRS`, khiến màn hình trông có cấu hình nhưng dữ liệu không tồn tại trong Supabase.
4. Worker tăng `itemsSaved` trước khi Supabase ghi thành công và bỏ qua nhiều lỗi ghi dữ liệu.
5. Khi có `BACKEND_WORKER_URL`, code cũ chạy cả worker ngoài lẫn `after()`, gây chạy trùng.
6. `GET /api/scans` đọc `crawl_jobs`, trong khi phần chi tiết/worker dùng `scan_jobs`.
7. Các bản ghi cũ thiếu `bank_name`, URL nguồn và `verification_status` vẫn được hiển thị như kết quả thật.

## Thứ tự triển khai bắt buộc

### 1. Sửa database trước

Chạy toàn bộ file sau trong Supabase SQL Editor của đúng project production:

`supabase/migrations/20260912_repair_production_schema.sql`

Không chạy `supabase/all_in_one.sql`, vì file đó có lệnh `DROP TABLE` và sẽ xóa dữ liệu.

Sau khi chạy, kiểm tra các truy vấn sau không báo lỗi:

```sql
select id, status, progress_percent, metrics from public.scan_jobs order by created_at desc limit 5;
select bank_id, business_hub_url, facebook_page_id, allowed_domains from public.bank_sources;
select scan_id, bank_name, canonical_url, verification_status from public.crawl_items order by collected_at desc limit 10;
```

### 2. Deploy code hotfix

Deploy các file đã sửa:

- `frontend/src/lib/store.ts`
- `frontend/src/lib/crawler/scanWorker.ts`
- `frontend/src/app/api/scans/route.ts`
- `supabase/migrations/20260912_repair_production_schema.sql`

Không khôi phục fallback dữ liệu mẫu. Nếu schema hoặc ghi DB lỗi, API phải trả lỗi rõ ràng.

### 3. Cấu hình Vercel

Các biến bắt buộc cho production:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Để quét Facebook cần thêm:

```text
FACEBOOK_ACCESS_TOKEN
FACEBOOK_GRAPH_API_VERSION=v19.0
```

Token phải có quyền đọc Page/post phù hợp do Meta phê duyệt. Không được scrape HTML Facebook hoặc tự sinh bài viết khi thiếu token. Mỗi ngân hàng phải có `facebook_page_id` đã xác thực qua Graph API; handle lấy từ URL chỉ là giá trị tạm.

Chỉ đặt `BACKEND_WORKER_URL` nếu endpoint đó thực sự đọc/ghi cùng Supabase và xử lý đúng `job_id`. Nếu chưa có worker bền vững, xóa biến này để dùng duy nhất Next.js `after()`; không chạy đồng thời hai worker.

## Kiểm thử chấp nhận sau deploy

1. Vào **Cấu hình nguồn**, chọn Techcombank và xác thực Website. Trạng thái chỉ được thành công khi request thật trả HTTP 2xx.
2. Quét Website của đúng 1 ngân hàng, khoảng 30 ngày.
3. Ngay sau khi POST, `GET /api/scans/{scanId}` phải chuyển `queued → running` trong tối đa 10 giây.
4. Job phải kết thúc ở `completed`, `partial`, `empty` hoặc `failed`; không được nằm `queued` quá 30 giây.
5. Mỗi kết quả phải có: đúng ngân hàng, `publishedAt` trong khoảng ngày, `websiteUrl` hoặc `facebookUrl` là URL chi tiết thật, `verificationStatus` là `verified`/`review`.
6. Kết quả cũ thiếu URL/scan ID phải bị ẩn (`invalid`), không được gán mặc định thành Facebook.
7. Sau khi Website chạy ổn mới bật Facebook. Thiếu token/quyền/Page ID phải hiển thị `FACEBOOK_TOKEN_MISSING`, `FACEBOOK_PAGE_ID_MISSING` hoặc `FACEBOOK_PERMISSION_DENIED`, không trả 0 kết quả như thể quét thành công.
8. Sau cùng mới thử nhiều ngân hàng. Với tải lớn, chuyển worker sang queue/cron bền vững thay vì phụ thuộc một request serverless kéo dài.

## Điều kiện hoàn thành

- Không mock, không seed, không fallback in-memory trên production.
- Không báo “đã đồng bộ” nếu insert/update Supabase lỗi.
- Không tăng bộ đếm kết quả trước khi ghi DB thành công.
- Không gộp hai nội dung chỉ vì tiêu đề gần giống; chỉ gộp khi có bằng chứng cùng chương trình và giữ cả hai URL nguồn.
- Chỉ lấy nội dung dành cho Doanh nghiệp/SME/CIB, có ngày rõ ràng và nằm trong khoảng người dùng chọn.
