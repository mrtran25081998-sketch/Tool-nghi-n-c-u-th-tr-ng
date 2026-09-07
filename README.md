# MB Competitive Product Intelligence Tool

Hệ thống thu thập, phân tích và so sánh năng lực cạnh tranh sản phẩm/tính năng số giữa BIZ MBBank và các ngân hàng đối thủ (Techcombank, VietinBank, BIDV, VPBank, Vietcombank, ACB...).

---

## 1. Cấu trúc tổng thể & Kiến trúc hệ thống

```
├── frontend/                        # Next.js App Router (TypeScript Strict + Tailwind CSS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── summary/             # LV1: Tổng hợp dữ liệu (Nguồn Facebook + Website, Discovery Table)
│   │   │   ├── products/            # LV2: SP/Tính năng MB so với đối thủ (Benchmark Grid Excel)
│   │   │   ├── matrix/              # LV2: Ma trận chấm điểm vị thế & Radar đa chiều
│   │   │   └── api/                 # Next.js BFF Endpoints (CRUD, Import, Analytics)
│   │   ├── components/
│   │   │   ├── layout/              # AppSidebar, Topbar
│   │   │   ├── sources/             # SourcePairPanel, CrawlResultsTable, AddSourceModal
│   │   │   ├── benchmark/           # BenchmarkGrid, GroupRow, ComponentRow, BankHeader, Modals
│   │   │   └── matrix/              # PositionRankingCard, RadarComparisonCard, MatrixDetailTable
│   │   ├── lib/                     # scoring.ts, excelUtils.ts, store.ts, supabase.ts
│   │   └── types/                   # TypeScript interfaces
│   └── package.json
│
├── backend/                         # FastAPI Crawler Worker (Python 3.10+)
│   ├── app/
│   │   ├── crawlers/                # base.py (SSRF Validator), website.py, facebook.py
│   │   ├── classifier.py            # Heuristic & NLP Banking Product Feature Classifier
│   │   ├── worker.py                # Background Crawl Pipeline & Deduplication (SHA-256)
│   │   └── main.py                  # FastAPI Application Endpoints (/health, /internal/process-job)
│   ├── tests/                       # Unit tests for SSRF validation and classifier
│   └── requirements.txt
│
├── supabase/                        # Database Architecture
│   ├── schema.sql                   # Tables (RLS, Multi-tenancy, Indexes, Dynamic Banks) & Views
│   └── seed.sql                     # Initial Benchmark Seed Data & Source Pairs
│
├── docs/                            # Specs & Scoring Rules
└── prototype_reference.html         # UI/UX Source of Truth
```

---

## 2. Quy tắc chấm điểm (Scoring Rules & Formulas)

- **Thang điểm**:
  - `NULL`: Chưa đánh giá (không persist thành `0`).
  - `0`: Chưa có tính năng.
  - `1`: Bán tự động / chưa toàn trình.
  - `2`: 100% online.
  - `3`: Mới / nâng cao / vượt trội.
- **Công thức tính điểm**:
  - $\text{total\_score} = \sum (\text{non-null scores})$
  - $\text{max\_score} = \text{active\_component\_count} \times 3$
  - $\text{M3} = \text{count}(\text{score} = 3)$
  - $\text{score\_profile} = [\text{count}(3), \text{count}(2), \text{count}(1), \text{count}(0), \text{count}(\text{NULL})]$
  - $\text{group\_score} = \frac{\sum \text{COALESCE}(\text{score}, 0)}{\text{component\_count\_in\_group}}$
  - $\text{leader}(\text{group}) = \text{Bank có group\_score cao nhất}$
- **Quy tắc xếp hạng vị thế**:
  - Sắp xếp theo: `total_score DESC` $\rightarrow$ `M3 DESC` $\rightarrow$ `MBBank First` $\rightarrow$ `Bank Name ASC`.

---

## 3. Hướng dẫn chạy Local (Zero-Config Out-of-the-Box)

### Bước 1: Khởi chạy Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Truy cập giao diện: [http://localhost:3000](http://localhost:3000)

> **Lưu ý Dual-mode**: Ứng dụng tích hợp sẵn Initial Store mô phỏng đầy đủ dữ liệu từ `prototype_reference.html`. Nếu chưa cấu hình Supabase, app vẫn chạy 100% tính năng mượt mà.

### Bước 2: Khởi chạy Backend Worker (FastAPI)

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Kiểm tra API: [http://localhost:8000/health](http://localhost:8000/health)

---

## 4. Kiểm thử tự động (Automated Testing)

### Chạy kiểm thử Frontend (Scoring, Group Averages, Excel Parser):
```bash
node --experimental-strip-types frontend/src/__tests__/run-node-tests.mjs
```

### Chạy kiểm thử Backend (SSRF Protection & Classifier):
```bash
python backend/tests/run_tests.py
```

---

## 5. Hướng dẫn Deploy Production

### 1. Supabase Setup:
1. Tạo project trên [Supabase](https://supabase.com).
2. Chạy file `supabase/schema.sql` trong **SQL Editor**.
3. Chạy file `supabase/seed.sql` để nạp dữ liệu ban đầu.

### 2. Frontend (Vercel / Docker):
- Thiết lập Environment Variables:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  WORKER_URL=https://your-worker-service.com
  WORKER_INTERNAL_SECRET=your-secret
  ```

### 3. Crawler Worker (Railway / Render / AWS):
- Build Dockerfile hoặc deploy trực tiếp Python FastAPI.
- Thiết lập Environment Variables:
  ```env
  WORKER_INTERNAL_SECRET=your-secret
  FACEBOOK_PROVIDER=disabled (hoặc facebook_graph khi có access token)
  META_GRAPH_ACCESS_TOKEN=your-token
  ```

---

## 6. Giới hạn đã biết (Known Limitations)

1. **Facebook Crawler Adapter**: Do chính sách bảo mật của Meta, việc crawl Facebook fanpage yêu cầu `META_GRAPH_ACCESS_TOKEN` hợp lệ. Nếu chưa cấu hình, worker chuyển trạng thái sang `provider_not_configured` an toàn và tiếp tục pipeline website mà không gây lỗi crash.
2. **SSRF Protection**: Crawler chủ động chặn toàn bộ dải IP Private (`10.x`, `192.168.x`, `172.16.x`, `127.x`, `169.254.x`) và các giao thức nguy hiểm (`file://`, `gopher://`). Chỉ các URL public `http`/`https` mới được phép quét.
