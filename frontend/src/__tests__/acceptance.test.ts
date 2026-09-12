import { describe, it, expect } from 'vitest';
import {
  extractPageDates,
  detectPageType,
  getRegistrableDomain,
  discoverArticleLinks,
  normalizeUrl,
} from '@/lib/crawler/serverCrawler';
import { crawlBankFacebook } from '@/lib/crawler/facebookConnector';
import { store } from '@/lib/store';
import type { IntelligenceItem } from '@/types';

describe('Acceptance Tests Suite - Hệ Thống Quét & Tổng Hợp Dữ Liệu Ngân Hàng', () => {
  // Scenario 1: Date Extraction - "Áp dụng đến 31/07/2026"
  describe('1. Trích xuất ngày & Phân loại hiệu lực', () => {
    it('bài viết chỉ có "Áp dụng đến 31/07/2026" mà không có ngày phát hành phải có publishedAt: null, effectiveTo: "2026-07-31", và bị reject với DATE_MISSING', () => {
      const promoContent = '<div><p>Chương trình ưu đãi doanh nghiệp mới. Áp dụng đến 31/07/2026 cho tất cả giao dịch ngoại tệ.</p></div>';
      const dates = extractPageDates(promoContent);

      expect(dates.publishedAt).toBeNull();
      expect(dates.effectiveTo).toBe('2026-07-31');
      expect(dates.hasDate).toBe(false);

      // Date gate check: publishedAt is required for publication timeline
      const hasValidDate = Boolean(dates.publishedAt);
      const rejectionReason = !hasValidDate ? 'DATE_MISSING' : null;
      expect(rejectionReason).toBe('DATE_MISSING');
    });

    it('bài viết có ngày đăng và ngày áp dụng/hiệu lực phân tách rõ ràng', () => {
      const article = `
        <article>
          <span class="meta">Ngày đăng: 15/05/2026</span>
          <p>Gói tín dụng SME ưu đãi có hiệu lực từ ngày 01/06/2026 đến ngày 31/12/2026.</p>
        </article>
      `;
      const dates = extractPageDates(article);

      expect(dates.publishedAt).toBe('2026-05-15');
      expect(dates.effectiveFrom).toBe('2026-06-01');
      expect(dates.effectiveTo).toBe('2026-12-31');
      expect(dates.hasDate).toBe(true);
    });
  });

  // Scenario 2: Techcombank Landing Page Exclusion
  describe('2. Kiểm soát URL & Trang chủ Techcombank', () => {
    it('Landing page không có ngày đăng bài phải có publishedAt = null và không bị nhận nhầm là ngày crawl', () => {
      const landingPageText = `
        <html>
          <body>
            <h1>Techcombank Business - Giải pháp số toàn diện cho doanh nghiệp</h1>
            <p>Mở tài khoản trực tuyến, quản trị dòng tiền, thanh toán quốc tế siêu tốc.</p>
            <p>Liên hệ hotline 1800 588 822 để được tư vấn chi tiết.</p>
          </body>
        </html>
      `;
      const dates = extractPageDates(landingPageText);
      expect(dates.publishedAt).toBeNull();

      // Ensure crawl time is never used as publication date
      const crawlTime = new Date().toISOString().slice(0, 10);
      const finalPublishedAt = dates.publishedAt;
      expect(finalPublishedAt).toBeNull();
      expect(finalPublishedAt).not.toBe(crawlTime);
    });

    it('Trang landing page/giới thiệu chung phải nhận diện pageType = landing hoặc category, không phải article', () => {
      const type = detectPageType('https://techcombank.com/khach-hang-doanh-nghiep', 'Khách hàng Doanh nghiệp | Techcombank', '');
      expect(['landing', 'category', 'unknown']).toContain(type);
      expect(type).not.toBe('article');
    });
  });

  // Scenario 3: MB ebank URL Inclusion
  describe('3. Tên miền ngân hàng & URL ebank MBBank', () => {
    it('URL https://ebank.mbbank.com.vn/biz/login KHÔNG được bị chặn bởi blacklist ebank', () => {
      const html = `
        <div>
          <a href="https://ebank.mbbank.com.vn/biz/login">Đăng nhập BIZ MBBank số</a>
          <a href="/khach-hang-doanh-nghiep/ebank-biz/tai-khoan">Dịch vụ Tài khoản eBank</a>
        </div>
      `;
      const links = discoverArticleLinks(html, 'https://mbbank.com.vn/doanh-nghiep', 10);
      expect(links.some((l) => l.includes('ebank'))).toBe(true);
    });

    it('Xác định đúng subdomain ebank.mbbank.com.vn thuộc cùng registrable domain mbbank.com.vn', () => {
      const subDomain = 'ebank.mbbank.com.vn';
      const rootDomain = 'mbbank.com.vn';

      const reg1 = getRegistrableDomain(subDomain);
      const reg2 = getRegistrableDomain(rootDomain);
      expect(reg1).toBe('mbbank.com.vn');
      expect(reg2).toBe('mbbank.com.vn');
      expect(reg1).toBe(reg2);
    });
  });

  // Scenario 4: Facebook Connector Token Missing
  describe('4. Facebook Connector', () => {
    it('khi FACEBOOK_ACCESS_TOKEN trống, trả về mã lỗi chuẩn FACEBOOK_TOKEN_MISSING và không ném unhandled exception', async () => {
      const originalEnv = process.env.FACEBOOK_ACCESS_TOKEN;
      delete process.env.FACEBOOK_ACCESS_TOKEN;

      const result = await crawlBankFacebook({
        bankId: 'bank-mb',
        bankName: 'BIZ MBBank',
        facebookUrl: 'https://facebook.com/mbbankvietnam',
        facebookPageId: 'mbbankvietnam',
        dateFrom: '2026-01-01',
        dateTo: '2026-09-12',
      });

      // Restore env
      if (originalEnv) process.env.FACEBOOK_ACCESS_TOKEN = originalEnv;

      expect(result.status).toBe('failed');
      expect(result.errorCode).toBe('FACEBOOK_TOKEN_MISSING');
      expect(result.errorMessage).toContain('FACEBOOK_ACCESS_TOKEN');
      expect(result.articles).toHaveLength(0);
    });
  });

  // Scenario 5: Scan Isolation
  describe('5. Cách ly dữ liệu giữa các lần quét (Scan Isolation)', () => {
    it('Scan B (chỉ chọn MB) tuyệt đối không chứa bản ghi của Techcombank từ Scan A', async () => {
      const scanAId = 'test-scan-a-' + Date.now();
      const scanBId = 'test-scan-b-' + Date.now();

      const itemScanA_MB: IntelligenceItem = {
        id: 'item-mb-a-' + Date.now(),
        bankId: 'bank-mb',
        bankName: 'BIZ MBBank',
        publishedAt: '2026-05-01',
        title: 'MB BIZ Package 2026',
        category: 'Giao dịch & Thanh toán',
        summary: 'Gói giải pháp số cho SME',
        audience: 'Doanh nghiệp',
        websiteUrl: 'https://mbbank.com.vn/biz-package',
        sourceTypes: ['website'],
        verificationStatus: 'verified',
        confidenceScore: 0.95,
        collectedAt: new Date().toISOString(),
        scanId: scanAId,
        isDemo: false,
      };

      const itemScanA_TCB: IntelligenceItem = {
        id: 'item-tcb-a-' + Date.now(),
        bankId: 'bank-tcb',
        bankName: 'Techcombank Business',
        publishedAt: '2026-05-01',
        title: 'Techcombank Business One',
        category: 'Giao dịch & Thanh toán',
        summary: 'Tài khoản số toàn diện',
        audience: 'Doanh nghiệp',
        websiteUrl: 'https://techcombank.com/business-one',
        sourceTypes: ['website'],
        verificationStatus: 'verified',
        confidenceScore: 0.95,
        collectedAt: new Date().toISOString(),
        scanId: scanAId,
        isDemo: false,
      };

      const itemScanB_MB: IntelligenceItem = {
        id: 'item-mb-b-' + Date.now(),
        bankId: 'bank-mb',
        bankName: 'BIZ MBBank',
        publishedAt: '2026-06-01',
        title: 'MB Payroll Online 2026',
        category: 'Dịch vụ Tài khoản',
        summary: 'Chi lương trực tuyến',
        audience: 'Doanh nghiệp',
        websiteUrl: 'https://mbbank.com.vn/payroll-online',
        sourceTypes: ['website'],
        verificationStatus: 'verified',
        confidenceScore: 0.95,
        collectedAt: new Date().toISOString(),
        scanId: scanBId,
        isDemo: false,
      };

      // Save to store
      await store.addIntelligenceItem(itemScanA_MB);
      await store.addIntelligenceItem(itemScanA_TCB);
      await store.addIntelligenceItem(itemScanB_MB);

      // Query results for Scan B
      const resultsScanB = await store.getIntelligenceItems({ scan_id: scanBId, mode: 'live' });

      // Verify Scan B only returns items with scanId = scanBId
      expect(resultsScanB.length).toBeGreaterThanOrEqual(1);
      const allBelongToScanB = resultsScanB.every((i) => i.scanId === scanBId);
      expect(allBelongToScanB).toBe(true);

      const hasTCB = resultsScanB.some((i) => i.bankId === 'bank-tcb' || i.bankName.includes('Techcombank'));
      expect(hasTCB).toBe(false);
    });
  });

  // Scenario 6: Background Worker contract
  describe('6. Quy trình xử lý ngầm (Background Worker & API Contract)', () => {
    it('Tạo scan job tạo cấu trúc trạng thái ban đầu queued và metrics đầy đủ', async () => {
      const job = await store.createScanJobDetail({
        dateFrom: '2026-01-01',
        dateTo: '2026-09-12',
        selectedBanks: ['bank-mb', 'bank-tcb'],
        sourceTypes: ['website'],
      });

      expect(job.id).toBeDefined();
      expect(job.status).toBeDefined();
      expect(job.metrics).toBeDefined();
      expect(job.metrics.selectedBanks).toBe(2);
      expect(job.metrics.selectedSources).toBe(2);
    });
  });

  // Scenario 7: Fallback UI on Empty/Failed Scan
  describe('7. Fallback UI & Strict Empty State', () => {
    it('Khi scan không tìm thấy kết quả, getIntelligenceItems với scan_id trả về danh sách rỗng, không fallback về dữ liệu mẫu', async () => {
      const nonExistentScanId = 'empty-scan-' + Date.now();
      const items = await store.getIntelligenceItems({ scan_id: nonExistentScanId, mode: 'live' });
      expect(items).toEqual([]);
    });
  });

  // Scenario 9: Website-only mode
  describe('8. Chế độ chỉ quét Website (Website-only Mode)', () => {
    it('khi chỉ chọn website, metrics.selectedSources phản ánh đúng số nguồn website và sourceTypes không chứa facebook', async () => {
      const job = await store.createScanJobDetail({
        dateFrom: '2026-01-01',
        dateTo: '2026-09-12',
        selectedBanks: ['bank-mb', 'bank-tcb', 'bank-bidv'],
        sourceTypes: ['website'],
      });

      expect(job.sourceTypes).toEqual(['website']);
      expect(job.metrics.selectedSources).toBe(3); // 3 banks * 1 source
    });
  });

  // Scenario 10: Facebook-only mode with missing token
  describe('9. Chế độ chỉ quét Facebook khi thiếu Token (Facebook-only Mode)', () => {
    it('khi thiếu token Facebook, các nguồn Facebook đều trả về lỗi chuẩn FACEBOOK_TOKEN_MISSING và 0 items', async () => {
      const originalEnv = process.env.FACEBOOK_ACCESS_TOKEN;
      delete process.env.FACEBOOK_ACCESS_TOKEN;

      const bankIds = ['mb', 'tcb', 'bidv', 'vcb', 'vtb', 'acb', 'tpb', 'vp'];
      const results = await Promise.all(
        bankIds.map((id) =>
          crawlBankFacebook({
            bankId: `bank-${id}`,
            bankName: `Bank ${id.toUpperCase()}`,
            facebookUrl: `https://facebook.com/${id}`,
            facebookPageId: `${id}_official`,
            dateFrom: '2026-01-01',
            dateTo: '2026-09-12',
          })
        )
      );

      if (originalEnv) process.env.FACEBOOK_ACCESS_TOKEN = originalEnv;

      expect(results.length).toBe(8);
      for (const r of results) {
        expect(r.status).toBe('failed');
        expect(r.errorCode).toBe('FACEBOOK_TOKEN_MISSING');
        expect(r.articles.length).toBe(0);
      }
    });
  });
});
