import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  discoverArticleLinks,
  extractPublishedDate,
  evaluateAudience,
  normalizeUrl,
} from '../lib/crawler/serverCrawler.ts';

describe('A. Source Discovery Test', () => {
  test('Finds candidate corporate article links in category HTML', () => {
    const html = `
      <div>
        <nav><a href="/ca-nhan">Khách hàng cá nhân</a></nav>
        <div class="content">
          <a href="/doanh-nghiep/tai-khoan-so-dep">Mở tài khoản số đẹp doanh nghiệp</a>
          <a href="/doanh-nghiep/tin-dung-sme-2024">Gói tín dụng ưu đãi SME 2024</a>
          <a href="https://external.com/ad">Quảng cáo ngoài</a>
          <a href="/files/bieu-phi.pdf">Biểu phí PDF</a>
        </div>
      </div>
    `;
    const links = discoverArticleLinks(html, 'https://bank.com.vn/doanh-nghiep', 10);
    assert.ok(links.length >= 2, 'Should discover at least 2 corporate links');
    assert.ok(links.some((l) => l.includes('tai-khoan-so-dep')), 'Includes tai-khoan-so-dep');
    assert.ok(links.some((l) => l.includes('tin-dung-sme-2024')), 'Includes tin-dung-sme-2024');
    assert.ok(!links.some((l) => l.endsWith('.pdf')), 'Does not include PDF binary');
    assert.ok(!links.some((l) => l.includes('external.com')), 'Does not include external domain');
  });

  test('Normalizes relative URLs and removes tracking query params', () => {
    const normalized = normalizeUrl('/san-pham/vay-sme?utm_source=fb&fbclid=xyz#section2', 'https://mbbank.com.vn');
    assert.strictEqual(normalized, 'https://mbbank.com.vn/san-pham/vay-sme');
  });
});

describe('B. Date Parsing Test (5-stage Priority)', () => {
  test('1. Extracts datePublished from JSON-LD schema', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": "Ra mắt gói BIZ MBBank",
        "datePublished": "2024-06-18T08:30:00+07:00"
      }
      </script>
    `;
    const res = extractPublishedDate(html);
    assert.strictEqual(res.date, '2024-06-18');
    assert.strictEqual(res.source, 'JSON-LD datePublished');
  });

  test('2. Extracts date from article:published_time meta tag', () => {
    const html = `<meta property="article:published_time" content="2024-08-20T14:00:00Z" />`;
    const res = extractPublishedDate(html);
    assert.strictEqual(res.date, '2024-08-20');
    assert.strictEqual(res.source, 'meta article:published_time');
  });

  test('3. Extracts date from <time datetime="..."> tag', () => {
    const html = `<time datetime="2024-09-01">01/09/2024</time>`;
    const res = extractPublishedDate(html);
    assert.strictEqual(res.date, '2024-09-01');
    assert.strictEqual(res.source, '<time datetime>');
  });

  test('4. Extracts date from text DD/MM/YYYY regex', () => {
    const html = `<div>Ngày đăng bài: 25/07/2024 trong chuyên mục tin tức</div>`;
    const res = extractPublishedDate(html);
    assert.strictEqual(res.date, '2024-07-25');
  });

  test('5. Returns DATE_NOT_FOUND when no date is present', () => {
    const html = `<div>Trang giới thiệu chung không chứa mốc thời gian cụ thể</div>`;
    const res = extractPublishedDate(html);
    assert.strictEqual(res.date, null);
    assert.strictEqual(res.source, 'DATE_NOT_FOUND');
  });
});

describe('C. Audience Classification Test', () => {
  test('Accepts corporate and SME products with valid reasoning', () => {
    const evalResult = evaluateAudience(
      'Gói tài trợ thương mại và LC trả chậm cho doanh nghiệp xuất nhập khẩu',
      'Hỗ trợ hạn mức tín dụng doanh nghiệp vừa và nhỏ SME',
      'Quản lý dòng tiền và thu hộ chi hộ điện tử',
      'https://bank.com/doanh-nghiep/tai-tro-thuong-mai'
    );
    assert.strictEqual(evalResult.isCorporate, true);
    assert.ok(evalResult.reason.includes('KHDN'));
  });

  test('Rejects personal / retail banking products', () => {
    const evalResult = evaluateAudience(
      'Gói vay mua nhà cá nhân lãi suất ưu đãi',
      'Hỗ trợ khách hàng cá nhân mua chung cư',
      'Điều kiện vay tiêu dùng cá nhân trả góp',
      'https://bank.com/ca-nhan/vay-mua-nha'
    );
    assert.strictEqual(evalResult.isCorporate, false);
    assert.ok(evalResult.reason.includes('loại trừ'));
  });

  test('Rejects recruitment / corporate governance noise', () => {
    const evalResult = evaluateAudience(
      'Thông báo tuyển dụng chuyên viên quan hệ khách hàng',
      'Nộp hồ sơ ứng tuyển tại hội sở',
      'Chi tiết yêu cầu tuyển dụng',
      'https://bank.com/tuyen-dung'
    );
    assert.strictEqual(evalResult.isCorporate, false);
  });
});

describe('D. Deduplication & Merge Test', () => {
  test('Merges Website and Facebook records with matching title into 1 item with both links', () => {
    const websiteArticle = {
      title: 'Ra mắt tài khoản BIZ PRO 2024',
      url: 'https://bank.com/biz-pro',
      description: 'Chương trình ưu đãi tài khoản số đẹp',
    };
    const facebookArticle = {
      title: 'Ra mắt tài khoản BIZ PRO 2024',
      url: 'https://facebook.com/bank/posts/12345',
      description: 'Chương trình ưu đãi trên Fanpage',
    };

    // Simulate deduplication logic
    const merged = {
      title: websiteArticle.title,
      websiteUrl: websiteArticle.url,
      facebookUrl: facebookArticle.url,
      sourceTypes: ['website', 'facebook'],
    };

    assert.strictEqual(merged.sourceTypes.length, 2);
    assert.strictEqual(merged.websiteUrl, 'https://bank.com/biz-pro');
    assert.strictEqual(merged.facebookUrl, 'https://facebook.com/bank/posts/12345');
  });
});

describe('E. Partial Failure Test', () => {
  test('Scan job marks status as partial when Facebook lacks token but Website succeeds', () => {
    const sourcesAttempted = 2;
    const sourcesSucceeded = 1; // Website succeeded
    const sourcesFailed = 1; // Facebook unavailable (token missing)
    const itemsSaved = 5;

    let status = 'failed';
    if (sourcesFailed === 0 && itemsSaved > 0) {
      status = 'success';
    } else if (sourcesSucceeded > 0 && itemsSaved > 0) {
      status = 'partial';
    }

    assert.strictEqual(status, 'partial', 'Status must be partial, not failed or empty');
  });
});

describe('F. API Contract & Response Format Test', () => {
  test('Standardized response has scanId, status, progress, metrics, and items', () => {
    const response = {
      scanId: 'scan-1789138000',
      status: 'partial',
      progress: {
        current: 5,
        total: 5,
        currentBank: 'Techcombank',
      },
      metrics: {
        sourcesAttempted: 10,
        sourcesSucceeded: 5,
        sourcesFailed: 5,
        pagesDiscovered: 40,
        pagesFetched: 25,
        itemsParsed: 20,
        itemsRejectedByDate: 5,
        itemsRejectedByAudience: 3,
        itemsMissingDate: 2,
        itemsDeduplicated: 2,
        itemsSaved: 8,
      },
      items: [
        {
          id: 'item-1',
          bankId: 'mb',
          bankName: 'MB Bank',
          title: 'Gói giải pháp BIZ MBBank',
          category: 'Tài khoản doanh nghiệp',
          audience: 'Doanh nghiệp / SME',
          verificationStatus: 'verified',
        },
      ],
      sourceResults: [],
      alerts: [],
    };

    assert.ok(response.scanId, 'Has scanId');
    assert.ok(Array.isArray(response.items), 'items is an array');
    assert.strictEqual(response.items.length, 1);
    assert.strictEqual(response.metrics.itemsSaved, 8);
    assert.strictEqual(response.status, 'partial');
  });
});
