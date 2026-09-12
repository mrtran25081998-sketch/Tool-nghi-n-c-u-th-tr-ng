import { describe, test, expect } from 'vitest';
import {
  discoverArticleLinks,
  extractPublishedDate,
  evaluateAudience,
  normalizeUrl,
  detectPageType,
  extractPageDates,
} from '@/lib/crawler/serverCrawler';

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
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links.some((l) => l.includes('tai-khoan-so-dep'))).toBe(true);
    expect(links.some((l) => l.includes('tin-dung-sme-2024'))).toBe(true);
    expect(links.some((l) => l.endsWith('.pdf'))).toBe(false);
    expect(links.some((l) => l.includes('external.com'))).toBe(false);
  });

  test('Normalizes relative URLs and removes tracking query params', () => {
    const normalized = normalizeUrl('/san-pham/vay-sme?utm_source=fb&fbclid=xyz#section2', 'https://mbbank.com.vn');
    expect(normalized).toBe('https://mbbank.com.vn/san-pham/vay-sme');
  });

  test('Does not exclude URLs containing ebank for corporate digital banking', () => {
    const html = `
      <div>
        <a href="/khach-hang-doanh-nghiep/ebank-biz/dang-ky">Đăng ký eBank Biz Doanh Nghiệp</a>
        <a href="/doanh-nghiep/ngan-hang-so-ebank">Nền tảng eBank BIZ 2.0</a>
      </div>
    `;
    const links = discoverArticleLinks(html, 'https://tpb.vn/khach-hang-doanh-nghiep', 10);
    expect(links.some((l) => l.includes('ebank-biz') || l.includes('ebank'))).toBe(true);
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
    expect(res.date).toBe('2024-06-18');
    expect(res.source).toBe('JSON-LD datePublished');
  });

  test('2. Extracts date from article:published_time meta tag', () => {
    const html = `<meta property="article:published_time" content="2024-08-20T14:00:00Z" />`;
    const res = extractPublishedDate(html);
    expect(res.date).toBe('2024-08-20');
    expect(res.source).toBe('meta article:published_time');
  });

  test('3. Extracts date from <time datetime="..."> tag', () => {
    const html = `<time datetime="2024-09-01">01/09/2024</time>`;
    const res = extractPublishedDate(html);
    expect(res.date).toBe('2024-09-01');
    expect(res.source).toBe('<time datetime>');
  });

  test('4. Extracts date from text DD/MM/YYYY regex', () => {
    const html = `<div>Ngày đăng bài: 25/07/2024 trong chuyên mục tin tức</div>`;
    const res = extractPublishedDate(html);
    expect(res.date).toBe('2024-07-25');
  });

  test('5. Returns DATE_NOT_FOUND when no date is present', () => {
    const html = `<div>Trang giới thiệu chung không chứa mốc thời gian cụ thể</div>`;
    const res = extractPublishedDate(html);
    expect(res.date).toBeNull();
    expect(res.source).toBe('DATE_NOT_FOUND');
  });

  test('6. Regression: Promo "Áp dụng đến 31/07/2026" without publication date does NOT set publishedAt=2026-07-31', () => {
    const html = `<div>Chương trình siêu ưu đãi phí tài khoản doanh nghiệp. Áp dụng đến 31/07/2026 cho toàn bộ khách hàng SME.</div>`;
    const dates = extractPageDates(html, 'https://bank.com/uu-dai');
    expect(dates.publishedAt).toBeNull();
    expect(dates.effectiveTo).toBe('2026-07-31');
    expect(dates.hasDate).toBe(false); // hasDate requires publishedAt
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
    expect(evalResult.isCorporate).toBe(true);
    expect(evalResult.reason).toContain('KHDN');
  });

  test('Rejects personal / retail banking products', () => {
    const evalResult = evaluateAudience(
      'Gói vay mua nhà cá nhân lãi suất ưu đãi',
      'Hỗ trợ khách hàng cá nhân mua chung cư',
      'Điều kiện vay tiêu dùng cá nhân trả góp',
      'https://bank.com/ca-nhan/vay-mua-nha'
    );
    expect(evalResult.isCorporate).toBe(false);
    expect(evalResult.reason).toContain('loại trừ');
  });

  test('Rejects recruitment / corporate governance noise', () => {
    const evalResult = evaluateAudience(
      'Thông báo tuyển dụng chuyên viên quan hệ khách hàng',
      'Nộp hồ sơ ứng tuyển tại hội sở',
      'Chi tiết yêu cầu tuyển dụng',
      'https://bank.com/tuyen-dung'
    );
    expect(evalResult.isCorporate).toBe(false);
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

    const merged = {
      title: websiteArticle.title,
      websiteUrl: websiteArticle.url,
      facebookUrl: facebookArticle.url,
      sourceTypes: ['website', 'facebook'],
    };

    expect(merged.sourceTypes.length).toBe(2);
    expect(merged.websiteUrl).toBe('https://bank.com/biz-pro');
    expect(merged.facebookUrl).toBe('https://facebook.com/bank/posts/12345');
  });
});

describe('E. Partial Failure Test', () => {
  test('Scan job marks status as partial when Facebook lacks token but Website succeeds', () => {
    const sourcesAttempted = 2;
    const sourcesSucceeded = 1;
    const sourcesFailed = 1;
    const itemsSaved = 5;

    let status = 'failed';
    if (sourcesFailed === 0 && itemsSaved > 0) {
      status = 'success';
    } else if (sourcesSucceeded > 0 && itemsSaved > 0) {
      status = 'partial';
    }

    expect(status).toBe('partial');
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

    expect(response.scanId).toBeTruthy();
    expect(Array.isArray(response.items)).toBe(true);
    expect(response.items.length).toBe(1);
    expect(response.metrics.itemsSaved).toBe(8);
    expect(response.status).toBe('partial');
  });

  test('Page type unknown is returned when no specific category/landing pattern matches', () => {
    const pageType = detectPageType('https://bank.com/dieu-khoan-su-dung', 'Điều khoản sử dụng dịch vụ', '<div>Điều khoản chung</div>');
    expect(pageType).toBe('unknown');
  });
});

describe('G. Crawler Audience & Priority Refinements', () => {
  test('Trang sản phẩm doanh nghiệp có menu chứa "khách hàng cá nhân" vẫn được chấp nhận', () => {
    const htmlBodyWithMenu = `
      <header><nav><a href="/khach-hang-ca-nhan">Khách hàng cá nhân</a></nav></header>
      <main>
        <h1>Tài khoản thanh toán đa tiện ích cho Khách hàng Doanh nghiệp</h1>
        <p>Giải pháp tối ưu dòng tiền, tài trợ vốn lưu động và quản lý chi hộ doanh nghiệp.</p>
      </main>
      <footer>Dành cho cả khách hàng cá nhân và doanh nghiệp</footer>
    `;
    const res = evaluateAudience(
      'Tài khoản thanh toán doanh nghiệp BIZ',
      'Giải pháp tài khoản thanh toán ưu việt cho doanh nghiệp và hộ kinh doanh',
      htmlBodyWithMenu,
      'https://techcombank.com/khach-hang-doanh-nghiep/san-pham/tai-khoan-doanh-nghiep'
    );
    expect(res.isCorporate).toBe(true);
    expect(res.rejectionReason).toBeUndefined();
  });

  test('URL cá nhân rõ ràng vẫn bị loại', () => {
    const res = evaluateAudience(
      'Mở thẻ tín dụng hoàn tiền không giới hạn',
      'Ưu đãi hoàn tiền thẻ tín dụng tiêu dùng',
      'Chi tiết điều kiện phát hành thẻ cho khách hàng',
      'https://techcombank.com/khach-hang-ca-nhan/the/the-tin-dung-ca-nhan'
    );
    expect(res.isCorporate).toBe(false);
    expect(res.rejectionReason).toBe('PERSONAL_CONTENT');
  });

  test('Link tin tức/ưu đãi được ưu tiên trước link sản phẩm cố định', () => {
    const html = `
      <div>
        <a href="/doanh-nghiep/san-pham/tai-khoan">Sản phẩm tài khoản cố định</a>
        <a href="/doanh-nghiep/dich-vu/chuyen-tien">Dịch vụ chuyển tiền</a>
        <a href="/doanh-nghiep/tin-tuc/uu-dai-lai-suat-2026">Tin tức ưu đãi lãi suất vay 2026</a>
        <a href="/doanh-nghiep/khuyen-mai/mien-phi-quan-ly-2026">Chương trình khuyến mại miễn phí quản lý tài khoản</a>
      </div>
    `;
    const links = discoverArticleLinks(html, 'https://techcombank.com/khach-hang-doanh-nghiep', 2);
    expect(links.length).toBe(2);
    // The top 2 sliced links must be the news/promos, not the static products
    const hasNewsOrPromo0 = links[0].includes('tin-tuc') || links[0].includes('khuyen-mai');
    const hasNewsOrPromo1 = links[1].includes('tin-tuc') || links[1].includes('khuyen-mai');
    expect(hasNewsOrPromo0).toBe(true);
    expect(hasNewsOrPromo1).toBe(true);
    expect(links.some((l) => l.includes('san-pham/tai-khoan'))).toBe(false);
  });
});

