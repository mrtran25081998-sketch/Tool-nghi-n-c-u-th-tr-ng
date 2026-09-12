/**
 * Server-side Website Crawler & Intelligence Parser for Banking Enterprise Pages
 * Strictly runs in Node.js server environment (never in client browser)
 */

import { CandidateAuditItem, CandidateRejectionReason, PageType } from '@/types';

export interface CrawledArticle {
  url: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string | null; // ISO YYYY-MM-DD or null
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  hasDate: boolean;
  dateSource?: string;
  category: string;
  audience: string;
  isCorporate: boolean;
  audienceReason: string;
  dateReason?: string;
  verificationStatus?: 'verified' | 'review';
  confidenceScore: number;
}

export interface WebCrawlResult {
  sourceUrl: string;
  httpStatus: number;
  status: 'success' | 'partial' | 'failed';
  pagesDiscovered: number;
  pagesFetched: number;
  itemsParsed: number;
  itemsRejectedByDate: number;
  itemsRejectedByAudience: number;
  itemsMissingDate: number;
  articles: CrawledArticle[];
  candidateAudit?: CandidateAuditItem[];
  errorCode?: string;
  errorMessage?: string;
}

export interface BankCrawlConfig {
  bankId: string;
  bankName: string;
  corporateHomepageUrl: string;
  businessHubUrl?: string;
  newsUrls?: string[];
  promotionUrls?: string[];
  sitemapUrl?: string;
  rssUrl?: string;
  allowedDomains?: string[];
  renderMode?: 'raw' | 'browser' | 'auto';
  adaptorName?: string;
  dateFrom: string;
  dateTo: string;
  maxPages?: number;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const CORPORATE_KEYWORDS = [
  'doanh nghiệp',
  'doanh nghiệp vừa và nhỏ',
  'sme',
  'corporate',
  'business banking',
  'khách hàng tổ chức',
  'cib',
  'hộ kinh doanh',
  'quản lý dòng tiền',
  'tài trợ thương mại',
  'bảo lãnh',
  'lc',
  'thu hộ',
  'chi hộ',
  'tài khoản doanh nghiệp',
  'thẻ doanh nghiệp',
  'tín dụng doanh nghiệp',
  'ngân hàng số doanh nghiệp',
  'tiền gửi doanh nghiệp',
  'chuyển tiền quốc tế',
  'pos',
  'qr doanh nghiệp',
  'ebank',
  'biz',
  'efast',
];

const CORPORATE_NEWS_KEYWORDS = [
  "moody's",
  'moody’s',
  'moodys',
  'fitch ratings',
  'fitch',
  's&p global',
  'standard & poor',
  'xếp hạng tín nhiệm',
  'an sinh xã hội',
  'từ thiện',
  'hiến máu',
  'tài trợ giải chạy',
  'trao học bổng',
  'bổ nhiệm',
  'từ nhiệm',
  'nghị quyết hđqt',
  'hội đồng quản trị',
  'công bố thông tin',
  'quan hệ cổ đông',
  'báo cáo thường niên',
  'báo cáo tài chính',
  'đại hội đồng cổ đông',
  'cổ phiếu',
  'msci frontier',
];

const EXCLUSION_KEYWORDS = [
  'vay mua nhà cá nhân',
  'vay tiêu dùng cá nhân',
  'thẻ tín dụng cá nhân',
  'tiết kiệm cá nhân',
  'bảo hiểm nhân thọ cá nhân',
  'khách hàng cá nhân',
  'thông báo tuyển dụng',
  'nộp hồ sơ ứng tuyển',
  'cơ hội nghề nghiệp',
  'tuyển dụng',
];

/**
 * Strip HTML tags and entities
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize and canonicalize URL
 */
export function normalizeUrl(rawUrl: string, baseUrl: string): string {
  try {
    const resolved = new URL(rawUrl, baseUrl);
    resolved.hash = '';
    // Strip common tracking query params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'gclid', 'ref'];
    for (const p of trackingParams) {
      resolved.searchParams.delete(p);
    }
    return resolved.toString().replace(/\/+$/, '');
  } catch {
    return rawUrl;
  }
}

/**
 * Extract base registrable domain from a hostname
 */
export function getRegistrableDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return parts.join('.');
  // Special handling for .com.vn, .edu.vn, .gov.vn, .org.vn
  if (parts.length >= 3 && ['com', 'edu', 'gov', 'org', 'net'].includes(parts[parts.length - 2]) && parts[parts.length - 1] === 'vn') {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/**
 * Detect structural page type
 * Unknown page types must return 'unknown' (never default to 'article')
 */
export function detectPageType(url: string, title: string, html: string): PageType {
  const urlLower = (url || '').toLowerCase().replace(/\/+$/, '');
  const titleLower = (title || '').toLowerCase().trim();

  // Invalid checks
  if (!url || urlLower.includes('/404') || urlLower.includes('/error') || urlLower.includes('/login') || urlLower.includes('/dang-nhap')) {
    return 'invalid';
  }

  // Known Corporate Hub / Landing patterns
  const landingSlugs = [
    '/khach-hang-doanh-nghiep',
    '/doanh-nghiep',
    '/doanh-nghiep-nho',
    '/sme',
    '/corporate',
    '/business',
    '/khdn',
    '/biz',
    '/business-banking',
    '/dn-vnvn',
  ];

  for (const slug of landingSlugs) {
    if (urlLower.endsWith(slug) || urlLower.endsWith(slug + '.html') || urlLower.endsWith(slug + '/')) {
      return 'landing';
    }
  }

  // Landing Title Patterns
  if (
    titleLower.includes('trang thông tin dành cho doanh nghiệp') ||
    titleLower.includes('cổng thông tin doanh nghiệp') ||
    titleLower.includes('khách hàng doanh nghiệp vừa và nhỏ |') ||
    titleLower.includes('khách hàng doanh nghiệp |') ||
    /^(khách hàng doanh nghiệp|doanh nghiệp vừa và nhỏ|sme|corporate banking)$/i.test(titleLower)
  ) {
    return 'landing';
  }

  // Category listing patterns
  if (
    urlLower.includes('/danh-muc/') ||
    urlLower.includes('/chuyen-muc/') ||
    urlLower.includes('/category/') ||
    urlLower.endsWith('/tin-tuc') ||
    urlLower.endsWith('/san-pham-dich-vu') ||
    urlLower.endsWith('/uu-dai') ||
    urlLower.endsWith('/khuyen-mai') ||
    urlLower.endsWith('/giai-phap')
  ) {
    return 'category';
  }

  // Promotion detail patterns
  if (
    urlLower.includes('/uu-dai/') ||
    urlLower.includes('/khuyen-mai/') ||
    urlLower.includes('/promotion/') ||
    titleLower.includes('ưu đãi') ||
    titleLower.includes('khuyến mại') ||
    titleLower.includes('chương trình ưu đãi')
  ) {
    return 'promotion';
  }

  // Product detail patterns
  if (
    urlLower.includes('/san-pham') ||
    urlLower.includes('/giai-phap') ||
    urlLower.includes('/dich-vu') ||
    urlLower.includes('/tai-khoan') ||
    urlLower.includes('/tin-dung') ||
    urlLower.includes('/the-') ||
    urlLower.includes('/the.') ||
    urlLower.includes('/the/') ||
    urlLower.includes('the-doanh-nghiep') ||
    urlLower.includes('/bao-lanh') ||
    urlLower.includes('/tien-gui') ||
    urlLower.includes('/tai-tro') ||
    urlLower.includes('/quan-ly-dong-tien') ||
    urlLower.includes('/thau-chi') ||
    urlLower.includes('/vay-') ||
    urlLower.includes('/ebank') ||
    urlLower.includes('/biz') ||
    urlLower.includes('/ngan-hang-so') ||
    titleLower.includes('thẻ doanh nghiệp') ||
    titleLower.includes('bảo lãnh') ||
    titleLower.includes('tài trợ thương mại') ||
    titleLower.includes('ngân hàng số') ||
    titleLower.includes('ebank') ||
    titleLower.includes('tài khoản doanh nghiệp') ||
    titleLower.includes('quản lý dòng tiền') ||
    titleLower.includes('gói tín dụng') ||
    titleLower.includes('dịch vụ thấu chi')
  ) {
    return 'product';
  }

  // Article / News detail patterns
  if (
    urlLower.includes('/chi-tiet/') ||
    urlLower.includes('/tin-tuc/') ||
    urlLower.includes('/bai-viet/') ||
    urlLower.includes('/news/') ||
    urlLower.includes('/article/')
  ) {
    return 'article';
  }

  // Unknown page type: Must be unknown, not defaulted to article
  return 'unknown';
}

/**
 * Extract dates strictly:
 * Separates publishedAt (actual publication date) from effectiveFrom/effectiveTo (promotion duration)
 * Never uses effectiveTo as publishedAt
 */
export function extractPageDates(html: string, url?: string): {
  publishedAt: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  dateSource: string;
  hasDate: boolean;
} {
  let publishedAt: string | null = null;
  let effectiveFrom: string | null = null;
  let effectiveTo: string | null = null;
  let dateSource = 'DATE_NOT_FOUND';

  // 1. JSON-LD datePublished or dateModified
  const jsonLdMatch = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const content = match.replace(/<script\b[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(content);
        const obj = Array.isArray(data) ? data[0] : data;
        const candidate = obj?.datePublished || obj?.dateCreated || obj?.uploadDate || obj?.dateModified;
        if (candidate) {
          const iso = new Date(candidate).toISOString().split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            publishedAt = iso;
            dateSource = 'JSON-LD datePublished';
            break;
          }
        }
      } catch {}
    }
  }

  // 2. Meta article:published_time or similar
  if (!publishedAt) {
    const metaPatterns = [
      /<meta\b[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
      /<meta\b[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["']/i,
      /<meta\b[^>]*property=["']og:updated_time["'][^>]*content=["']([^"']+)["']/i,
      /<meta\b[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["']/i,
      /<meta\b[^>]*name=["']publishdate["'][^>]*content=["']([^"']+)["']/i,
      /<meta\b[^>]*name=["']last-modified["'][^>]*content=["']([^"']+)["']/i,
      /<meta\b[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i,
    ];
    for (const pat of metaPatterns) {
      const m = html.match(pat);
      if (m && m[1]) {
        try {
          const iso = new Date(m[1]).toISOString().split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            publishedAt = iso;
            dateSource = 'meta article:published_time';
            break;
          }
        } catch {}
      }
    }
  }

  // 3. <time datetime="...">
  if (!publishedAt) {
    const timeMatch = html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i);
    if (timeMatch && timeMatch[1]) {
      try {
        const iso = new Date(timeMatch[1]).toISOString().split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
          publishedAt = iso;
          dateSource = '<time datetime>';
        }
      } catch {}
    }
  }

  // 4. URL path date regex (e.g. /the-tin-dung-...-2025-4-23-14-15-19 or /2024-06-18)
  if (!publishedAt && url) {
    const urlDateMatch = url.match(/\b(202\d)[\/\-_]([0-1]?\d)[\/\-_]([0-3]?\d)\b/);
    if (urlDateMatch) {
      const year = urlDateMatch[1];
      const month = urlDateMatch[2].padStart(2, '0');
      const day = urlDateMatch[3].padStart(2, '0');
      const mNum = parseInt(month, 10);
      const dNum = parseInt(day, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        publishedAt = `${year}-${month}-${day}`;
        dateSource = 'URL pathname date YYYY-MM-DD';
      }
    }
  }

  // 5. Explicit "ngày đăng / ngày đăng bài / đăng ngày / ngày phát hành / cập nhật" in HTML text
  if (!publishedAt) {
    const publishTextMatch = html.match(
      /(?:ngày đăng(?:\s+bài)?|đăng ngày|ngày phát hành|xuất bản ngày|cập nhật ngày|cập nhật lúc|ngày hiệu lực|ngày áp dụng)\s*[:\-]?\s*([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](202\d)/i
    );
    if (publishTextMatch) {
      const day = publishTextMatch[1].padStart(2, '0');
      const month = publishTextMatch[2].padStart(2, '0');
      const year = publishTextMatch[3];
      const mNum = parseInt(month, 10);
      const dNum = parseInt(day, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        publishedAt = `${year}-${month}-${day}`;
        dateSource = 'text regex ngày đăng';
      }
    }
  }

  // 6. Promotion / Program validity dates (effectiveTo / effectiveFrom)
  // "Áp dụng đến 31/07/2026", "hiệu lực đến...", "thời hạn đến...", "hạn sử dụng đến...", "đến hết ngày 31/07/2026"
  // Note: NEVER assign effectiveTo to publishedAt!
  const expiryMatch = html.match(
    /(?:áp dụng đến|hiệu lực đến|thời hạn đến|hạn sử dụng đến|đến hết ngày|hạn chót)\s*(?:ngày\s*)?([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](202\d)/i
  );
  if (expiryMatch) {
    const day = expiryMatch[1].padStart(2, '0');
    const month = expiryMatch[2].padStart(2, '0');
    const year = expiryMatch[3];
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      effectiveTo = `${year}-${month}-${day}`;
      if (!publishedAt) {
        dateSource = 'promotion effectiveTo (áp dụng đến)';
      }
    }
  }

  // "từ ngày DD/MM/YYYY đến ngày DD/MM/YYYY"
  const rangeMatch = html.match(
    /(?:từ ngày|hiệu lực từ|áp dụng từ)\s*([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](202\d)\s*(?:đến|–|-)\s*(?:ngày\s*)?([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](202\d)/i
  );
  if (rangeMatch) {
    const fromD = rangeMatch[1].padStart(2, '0');
    const fromM = rangeMatch[2].padStart(2, '0');
    const fromY = rangeMatch[3];
    effectiveFrom = `${fromY}-${fromM}-${fromD}`;

    const toD = rangeMatch[4].padStart(2, '0');
    const toM = rangeMatch[5].padStart(2, '0');
    const toY = rangeMatch[6];
    effectiveTo = `${toY}-${toM}-${toD}`;
    if (!publishedAt) {
      dateSource = 'promotion effective range';
    }
  }

  // hasDate is strictly whether publishedAt exists
  const hasDate = Boolean(publishedAt);
  return { publishedAt, effectiveFrom, effectiveTo, dateSource, hasDate };
}

// Backward compatibility alias
export function extractPublishedDate(html: string, url?: string): { date: string | null; source: string } {
  const res = extractPageDates(html, url);
  return { date: res.publishedAt, source: res.dateSource };
}

/**
 * Evaluate whether an article is for Corporate / SME customers vs Personal
 */
export function evaluateAudience(
  title: string,
  description: string,
  content: string,
  url: string = ''
): {
  isCorporate: boolean;
  audience: string;
  reason: string;
  rejectionReason?: CandidateRejectionReason;
} {
  // Strip header, nav, footer from content so universal site menus don't poison audience check
  const cleanContent = (content || '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
  const combinedText = `${title} ${description} ${cleanContent}`.toLowerCase();
  const normalizedText = combinedText.replace(/[’‘`]/g, "'").replace(/[“”]/g, '"');
  const normalizedTitle = (title || '').toLowerCase().trim();
  const urlLower = (url || '').toLowerCase();

  // Root / generic homepage title exclusion
  const isGenericTitle =
    /^(mb\s*bank|mbbank|techcombank|vietinbank|bidv|vietcombank|vpbank|acb|sacombank|hdbank|tpbank|seabank|ocb|msb|agribank|lienvietpostbank|shb)(\s*[|–-].*)?$/i.test(normalizedTitle) ||
    /^(mb\s*ngân hàng quân đội|ngân hàng quân đội)(\s*[|–-].*)?$/i.test(normalizedTitle);
  if (isGenericTitle) {
    return {
      isCorporate: false,
      audience: 'Trang chủ / Cổng thông tin',
      reason: 'Tiêu đề là tên trang chủ hoặc cổng thông tin chung của ngân hàng',
      rejectionReason: 'TITLE_INVALID',
    };
  }

  // URL-path-based exclusion for personal banking sections and document directories
  const personalUrlPatterns = [
    '/khach-hang-ca-nhan',
    '/ca-nhan',
    '/personal',
    '/individual',
    '/retail',
    '/tiet-kiem-ca-nhan',
    '/the-tin-dung-ca-nhan',
    '/vay-ca-nhan',
    '/the-ca-nhan',
    '/tin-khuyen-mai-khcn',
    '/khcn',
    '-khcn',
    '/tin-mb/',
    '/quan-he-co-dong',
    '/documents',
    '/bieu-phi',
    '/bieu-mau',
    '/tools_slug',
    '/ve-vietcombank',
  ];
  for (const pat of personalUrlPatterns) {
    if (urlLower.includes(pat)) {
      return {
        isCorporate: false,
        audience: 'Cá nhân / Thông tin chung',
        reason: `Chứa từ khóa/dấu hiệu loại trừ sản phẩm cá nhân: "${pat}"`,
        rejectionReason: 'PERSONAL_CONTENT',
      };
    }
  }

  // Check Corporate News / PR / Ratings keywords - ONLY in the TITLE, not full content.
  // Reason: Bank page footers universally contain "Quan hệ cổ đông", "Công bố thông tin",
  // "Báo cáo tài chính" in their nav menus, which would cause false positive rejections
  // for perfectly valid corporate product pages.
  for (const kw of CORPORATE_NEWS_KEYWORDS) {
    const normalizedKw = kw.toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"');
    if (normalizedTitle.includes(normalizedKw)) {
      return {
        isCorporate: false,
        audience: 'Tin tức quan hệ công chúng / Cổ đông',
        reason: `Chứa nội dung tin tức PR/xếp hạng/nội bộ: "${kw}"`,
        rejectionReason: 'CORPORATE_NEWS',
      };
    }
  }

  // Determine if URL is within a corporate section
  const corporateUrlPatterns = [
    '/khach-hang-doanh-nghiep',
    '/doanh-nghiep',
    '/to-chuc',
    '/kh-dn',
    '/khdn',
    '/corporate',
    '/business',
    '/sme',
    '/smb',
    '/enterprise',
    '/ho-kinh-doanh',
    '/ebank',
    '/biz',
  ];
  const isCorporateUrl = corporateUrlPatterns.some((pat) => urlLower.includes(pat));

  // Check positive corporate keywords (title, description, and body content as supporting signal)
  const matchedCorporate: string[] = [];
  for (const kw of CORPORATE_KEYWORDS) {
    if (normalizedTitle.includes(kw) || normalizedText.includes(kw)) {
      matchedCorporate.push(kw);
    }
  }

  // If page is clearly Corporate (in corporate URL path OR corporate keywords in title)
  if (isCorporateUrl || matchedCorporate.some((k) => normalizedTitle.includes(k))) {
    // Only exclude if title explicitly targets retail consumer products or recruitment
    const strongPersonalTitle = [
      'vay mua nhà cá nhân',
      'vay tiêu dùng cá nhân',
      'thẻ tín dụng cá nhân',
      'tiết kiệm cá nhân',
      'bảo hiểm nhân thọ cá nhân',
      'thông báo tuyển dụng',
      'nộp hồ sơ ứng tuyển',
      'cơ hội nghề nghiệp',
      'tuyển dụng',
    ];
    for (const exc of strongPersonalTitle) {
      if (normalizedTitle.includes(exc)) {
        return {
          isCorporate: false,
          audience: 'Cá nhân / Tiêu dùng',
          reason: `Tiêu đề chứa từ khóa loại trừ: "${exc}"`,
          rejectionReason: 'PERSONAL_CONTENT',
        };
      }
    }

    const displayAudience = matchedCorporate.some((k) => k.includes('sme') || k.includes('vừa và nhỏ') || k.includes('hộ kinh doanh'))
      ? 'Doanh nghiệp / SME'
      : matchedCorporate.some((k) => k.includes('corporate') || k.includes('tổ chức') || k.includes('cib'))
      ? 'Doanh nghiệp lớn / Corporate'
      : 'Khách hàng Doanh nghiệp';

    return {
      isCorporate: true,
      audience: displayAudience,
      reason: `Khớp ${Math.max(1, matchedCorporate.length)} từ khóa sản phẩm KHDN: ${matchedCorporate.slice(0, 3).join(', ') || 'Cổng thông tin doanh nghiệp'}`,
    };
  }

  // Check strong personal exclusions for general pages ONLY on high confidence signals (title & meta description)
  // Never eliminate based on body/menu/footer text
  const highConfidenceSignals = `${normalizedTitle} ${(description || '').toLowerCase()}`;
  for (const exc of EXCLUSION_KEYWORDS) {
    const normalizedExc = exc.toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"');
    if (highConfidenceSignals.includes(normalizedExc)) {
      return {
        isCorporate: false,
        audience: 'Cá nhân / Tiêu dùng',
        reason: `Chứa từ khóa loại trừ sản phẩm cá nhân: "${exc}"`,
        rejectionReason: 'PERSONAL_CONTENT',
      };
    }
  }

  if (matchedCorporate.length > 0) {
    const displayAudience = matchedCorporate.some((k) => k.includes('sme') || k.includes('vừa và nhỏ'))
      ? 'Doanh nghiệp / SME'
      : matchedCorporate.some((k) => k.includes('corporate') || k.includes('tổ chức') || k.includes('cib'))
      ? 'Doanh nghiệp lớn / Corporate'
      : 'Khách hàng Doanh nghiệp';

    return {
      isCorporate: true,
      audience: displayAudience,
      reason: `Khớp ${matchedCorporate.length} từ khóa sản phẩm KHDN: ${matchedCorporate.slice(0, 3).join(', ')}`,
    };
  }

  return {
    isCorporate: false,
    audience: 'Chung / Không rõ phân khúc',
    reason: 'Không tìm thấy dấu hiệu sản phẩm hoặc chương trình dành cho KHDN',
    rejectionReason: 'PERSONAL_CONTENT',
  };
}

/**
 * Detect product / feature category
 */
export function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('tài khoản') || t.includes('số đẹp') || t.includes('gói tài khoản')) {
    return 'Tài khoản & Dịch vụ';
  }
  if (t.includes('ngân hàng số') || t.includes('ebank') || t.includes('app') || t.includes('portal') || t.includes('biz')) {
    return 'Ngân hàng số & Nền tảng';
  }
  if (t.includes('tín dụng') || t.includes('vay') || t.includes('hạn mức') || t.includes('thấu chi')) {
    return 'Tín dụng & Cho vay';
  }
  if (t.includes('thanh toán') || t.includes('thu hộ') || t.includes('chi hộ') || t.includes('qr') || t.includes('pos')) {
    return 'Thanh toán & Thu chi hộ';
  }
  if (t.includes('tài trợ thương mại') || t.includes('bảo lãnh') || t.includes('lc') || t.includes('nhập khẩu') || t.includes('xuất khẩu')) {
    return 'Tài trợ thương mại & Bảo lãnh';
  }
  if (t.includes('tiền gửi') || t.includes('tiết kiệm') || t.includes('sinh lời')) {
    return 'Tiền gửi & Quản lý dòng tiền';
  }
  if (t.includes('ưu đãi') || t.includes('khuyến mại') || t.includes('hoàn tiền') || t.includes('giảm phí') || t.includes('miễn phí')) {
    return 'Chương trình & Ưu đãi';
  }
  return 'Sản phẩm Doanh nghiệp';
}

/**
 * Score a candidate URL and link anchor text to prioritize news, promos, and fresh content
 */
export function scoreCandidateLink(urlStr: string, linkText: string = ''): number {
  let score = 0;
  const lowerUrl = urlStr.toLowerCase();
  const lowerText = (linkText || '').toLowerCase();
  const combined = `${lowerUrl} ${lowerText}`;

  // Tin tức, bài viết, sự kiện: +100
  if (
    combined.includes('tin-tuc') ||
    combined.includes('tin_tuc') ||
    combined.includes('tin tức') ||
    combined.includes('bai-viet') ||
    combined.includes('bài viết') ||
    combined.includes('su-kien') ||
    combined.includes('sự kiện') ||
    combined.includes('news') ||
    combined.includes('article') ||
    combined.includes('press') ||
    combined.includes('event')
  ) {
    score += 100;
  }

  // Ưu đãi, khuyến mại, chương trình: +95
  if (
    combined.includes('uu-dai') ||
    combined.includes('ưu đãi') ||
    combined.includes('khuyen-mai') ||
    combined.includes('khuyến mại') ||
    combined.includes('chuong-trinh') ||
    combined.includes('chương trình') ||
    combined.includes('promotion') ||
    combined.includes('offer') ||
    combined.includes('campaign')
  ) {
    score += 95;
  }

  // Chi tiết/detail: +70
  if (
    lowerUrl.includes('chi-tiet') ||
    lowerUrl.includes('detail') ||
    lowerUrl.includes('/post/') ||
    lowerUrl.includes('/view/')
  ) {
    score += 70;
  }

  // URL chứa ngày tháng năm 202x: +60
  if (/202\d/.test(lowerUrl)) {
    score += 60;
  }

  // Sản phẩm, giải pháp, dịch vụ cố định: +25
  if (
    combined.includes('san-pham') ||
    combined.includes('sản phẩm') ||
    combined.includes('giai-phap') ||
    combined.includes('giải pháp') ||
    combined.includes('dich-vu') ||
    combined.includes('dịch vụ') ||
    combined.includes('product') ||
    combined.includes('solution') ||
    combined.includes('service')
  ) {
    score += 25;
  }

  return score;
}

/**
 * Discover candidate article links from HTML page
 * Collects all candidate links, scores them by relevance and freshness, then slices top maxLinks
 */
export function discoverArticleLinks(html: string, baseUrl: string, maxLinks: number = 15): string[] {
  const candidates: { url: string; score: number }[] = [];
  const seen = new Set<string>();
  const baseObj = new URL(baseUrl);
  const baseDomain = getRegistrableDomain(baseObj.hostname);

  const hrefRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    const linkText = stripHtml(match[2] || '').toLowerCase();

    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      continue;
    }

    // Exclude static assets and binaries
    if (/\.(pdf|docx?|xlsx?|pptx?|zip|rar|png|jpe?g|gif|svg|webp|css|js)$/i.test(rawHref)) {
      continue;
    }

    const normalized = normalizeUrl(rawHref, baseUrl);
    if (seen.has(normalized)) continue;

    // Must be same registrable domain or official subdomain
    try {
      const parsed = new URL(normalized);
      const parsedDomain = getRegistrableDomain(parsed.hostname);
      if (parsedDomain !== baseDomain) {
        continue;
      }

      // Exclude generic roots, sitemaps, search, login pages, personal banking sections
      const path = parsed.pathname.toLowerCase().replace(/\/+$/, '');
      const cleanBase = baseObj.pathname.toLowerCase().replace(/\/+$/, '');
      if (
        !path ||
        path === '' ||
        path === cleanBase ||
        path === '/home' ||
        path.endsWith('/home') ||
        path === '/support' ||
        path.endsWith('/support') ||
        path === '/about' ||
        path.endsWith('/about') ||
        path === '/contact' ||
        path.endsWith('/contact') ||
        path.endsWith('/lien-he') ||
        path.endsWith('/gioi-thieu') ||
        path.includes('sitemap') ||
        path.includes('tim-kiem') ||
        path.includes('search') ||
        path.includes('login') ||
        path.includes('dang-nhap') ||
        path.includes('auth') ||
        // NOTE: Do NOT exclude 'ebank'! ebank is corporate digital banking.
        // Explicitly exclude personal banking paths only
        path.includes('/khach-hang-ca-nhan') ||
        path.includes('/ca-nhan/') ||
        path.includes('/the-ca-nhan') ||
        path.includes('/vay-ca-nhan') ||
        path.includes('/tiet-kiem-ca-nhan') ||
        path.includes('/personal') ||
        path.includes('/individual')
      ) {
        continue;
      }

      seen.add(normalized);
      const score = scoreCandidateLink(normalized, linkText);
      candidates.push({ url: normalized, score });
    } catch {}
  }

  // Sort by priority score descending so news, promotions and articles are crawled first
  candidates.sort((a, b) => b.score - a.score);

  return candidates.map((c) => c.url).slice(0, maxLinks);
}

/**
 * Helper to fetch with timeout and retry
 */
async function fetchWithRetry(
  url: string,
  timeoutMs: number = 12000,
  maxRetries: number = 1
): Promise<{ ok: boolean; status: number; text: string }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    } catch (err: any) {
      if (attempt === maxRetries) {
        return { ok: false, status: 0, text: '' };
      }
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return { ok: false, status: 0, text: '' };
}

/**
 * Bank-Specific Adapters
 */
export interface BankCrawlerAdapter {
  name: string;
  extractCandidateUrls: (html: string, baseUrl: string) => string[];
  cleanArticleDetails?: (url: string, title: string, html: string) => { title?: string; content?: string };
}

export const BANK_ADAPTERS: Record<string, BankCrawlerAdapter> = {
  mb: {
    name: 'MBBank Adapter',
    extractCandidateUrls: (html, baseUrl) => {
      const links = discoverArticleLinks(html, baseUrl, 30);
      return links.filter((l) => l.includes('mbbank.com.vn'));
    },
  },
  techcombank: {
    name: 'Techcombank Adapter',
    extractCandidateUrls: (html, baseUrl) => {
      const links = discoverArticleLinks(html, baseUrl, 30);
      return links.filter((l) => l.includes('techcombank.com'));
    },
  },
  bidv: {
    name: 'BIDV Adapter',
    extractCandidateUrls: (html, baseUrl) => {
      const links = discoverArticleLinks(html, baseUrl, 30);
      return links.filter((l) => l.includes('bidv.com.vn'));
    },
  },
  vietcombank: {
    name: 'Vietcombank Adapter',
    extractCandidateUrls: (html, baseUrl) => {
      const links = discoverArticleLinks(html, baseUrl, 30);
      return links.filter((l) => l.includes('vietcombank.com.vn'));
    },
  },
  vietinbank: {
    name: 'VietinBank Adapter',
    extractCandidateUrls: (html, baseUrl) => {
      const links = discoverArticleLinks(html, baseUrl, 30);
      return links.filter((l) => l.includes('vietinbank.vn'));
    },
  },
  generic: {
    name: 'Generic Bank Adapter',
    extractCandidateUrls: (html, baseUrl) => discoverArticleLinks(html, baseUrl, 30),
  },
};

/**
 * Main Bank Website Crawler
 */
export async function crawlBankWebsite(config: {
  bankId: string;
  bankName: string;
  corporateHomepageUrl: string;
  businessHubUrl?: string;
  newsUrls?: string[];
  promotionUrls?: string[];
  sitemapUrl?: string;
  rssUrl?: string;
  allowedDomains?: string[];
  renderMode?: 'raw' | 'browser' | 'auto';
  adaptorName?: string;
  dateFrom: string;
  dateTo: string;
  maxPages?: number;
}): Promise<WebCrawlResult> {
  const {
    bankId,
    bankName,
    corporateHomepageUrl,
    businessHubUrl,
    newsUrls = [],
    promotionUrls = [],
    sitemapUrl,
    dateFrom,
    dateTo,
    maxPages = 8,
    adaptorName = 'generic',
  } = config;

  const targetUrl = businessHubUrl || corporateHomepageUrl;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return {
      sourceUrl: targetUrl || '',
      httpStatus: 0,
      status: 'failed',
      pagesDiscovered: 0,
      pagesFetched: 0,
      itemsParsed: 0,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: 0,
      itemsMissingDate: 0,
      articles: [],
      candidateAudit: [],
      errorCode: 'INVALID_URL',
      errorMessage: 'URL trang chủ KHDN không hợp lệ hoặc chưa cấu hình',
    };
  }

  console.log(`[Crawler] 🌐 Starting crawl for ${bankName} at: ${targetUrl}`);

  const candidateAudit: CandidateAuditItem[] = [];
  const articles: CrawledArticle[] = [];
  const visitedUrls = new Set<string>();

  // Select adapter
  const adapter = BANK_ADAPTERS[adaptorName] || BANK_ADAPTERS.generic;

  // Step 1: Fetch root homepage / hub
  const rootFetch = await fetchWithRetry(targetUrl, 14000, 1);
  visitedUrls.add(targetUrl.replace(/\/+$/, '').toLowerCase());

  if (!rootFetch.ok || !rootFetch.text) {
    const errCode = rootFetch.status === 403 ? 'HTTP_403' : rootFetch.status === 404 ? 'HTTP_404' : 'FETCH_TIMEOUT';
    candidateAudit.push({
      id: crypto.randomUUID(),
      bankId,
      bankName,
      url: targetUrl,
      title: `${bankName} - Cổng Doanh Nghiệp`,
      pageType: 'landing',
      publishedAt: null,
      audience: 'Không thể truy cập',
      httpStatus: rootFetch.status,
      accepted: false,
      rejectionReason: 'SOURCE_URL_INVALID',
    });

    return {
      sourceUrl: targetUrl,
      httpStatus: rootFetch.status,
      status: 'failed',
      pagesDiscovered: 0,
      pagesFetched: 1,
      itemsParsed: 0,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: 0,
      itemsMissingDate: 0,
      articles: [],
      candidateAudit,
      errorCode: errCode,
      errorMessage: `Không thể truy cập trang nguồn ${targetUrl} (HTTP ${rootFetch.status || 'timeout'})`,
    };
  }

  // Audit root homepage as landing page (never an article item!)
  const rootTitleMatch = rootFetch.text.match(/<title\b[^>]*>([^<]+)<\/title>/i);
  const rootTitle = (rootTitleMatch?.[1] || `${bankName} - KHDN`).trim();
  const rootType = detectPageType(targetUrl, rootTitle, rootFetch.text);
  const rootDates = extractPageDates(rootFetch.text, targetUrl);

  candidateAudit.push({
    id: crypto.randomUUID(),
    bankId,
    bankName,
    url: targetUrl,
    title: rootTitle,
    pageType: rootType === 'invalid' ? 'landing' : rootType,
    publishedAt: rootDates.publishedAt,
    effectiveFrom: rootDates.effectiveFrom,
    effectiveTo: rootDates.effectiveTo,
    audience: 'Cổng thông tin KHDN',
    contentType: 'Landing Hub',
    httpStatus: rootFetch.status,
    accepted: false,
    rejectionReason: 'LANDING_PAGE',
  });

  // Step 2: Discover candidate links from root + configured news/promo pages
  const discoveryQueue: string[] = [];
  const initialLinks = adapter.extractCandidateUrls(rootFetch.text, targetUrl);
  discoveryQueue.push(...initialLinks);

  // Also discover from configured news_urls and promotion_urls
  // NOTE: Add the seed URLs themselves to the queue FIRST (they are likely category/product pages),
  // then also extract further links from each seed page.
  const auxSeeds = [...newsUrls, ...promotionUrls].filter((u) => u && u.startsWith('http'));
  for (const seed of auxSeeds.slice(0, 5)) {
    const normSeed = seed.replace(/\/+$/, '').toLowerCase();
    // Add the seed URL itself to queue (it may be a product/promo page)
    if (!visitedUrls.has(normSeed)) {
      discoveryQueue.push(seed);
    }

    if (visitedUrls.has(normSeed)) continue;
    visitedUrls.add(normSeed);

    const auxFetch = await fetchWithRetry(seed, 10000, 1);
    if (auxFetch.ok && auxFetch.text) {
      const auxLinks = adapter.extractCandidateUrls(auxFetch.text, seed);
      discoveryQueue.push(...auxLinks);
    }
  }

  // Deduplicate candidate queue
  const normalizedRoot = targetUrl.replace(/\/+$/, '').toLowerCase();
  const queue = Array.from(new Set(discoveryQueue))
    .filter((u) => u.replace(/\/+$/, '').toLowerCase() !== normalizedRoot)
    .slice(0, maxPages * 2); // Use 2x buffer so we don't cut too early after dedup

  let pagesFetched = 1;
  let itemsParsed = 0;
  let itemsRejectedByDate = 0;
  let itemsRejectedByAudience = 0;
  let itemsMissingDate = 0;

  // Step 3: Fetch detail pages
  for (const url of queue) {
    const normUrl = url.replace(/\/+$/, '').toLowerCase();
    if (visitedUrls.has(normUrl)) continue;
    visitedUrls.add(normUrl);

    pagesFetched++;
    const childFetch = await fetchWithRetry(url, 10000, 1);
    if (!childFetch.ok || !childFetch.text) {
      candidateAudit.push({
        id: crypto.randomUUID(),
        bankId,
        bankName,
        url,
        title: 'Lỗi tải trang',
        pageType: 'invalid',
        publishedAt: null,
        audience: 'Không xác định',
        httpStatus: childFetch.status,
        accepted: false,
        rejectionReason: 'SOURCE_URL_INVALID',
      });
      continue;
    }

    const html = childFetch.text;
    const titleMatch = html.match(/<title\b[^>]*>([^<]+)<\/title>/i);
    const rawTitle = (titleMatch?.[1] || '').trim();
    const title =
      rawTitle.replace(
        /\s*[|–-]\s*(MB\s*Bank|MBBank|Techcombank|Vietinbank|BIDV|Vietcombank|VPBank|ACB|Sacombank|HDBank|TPBank|SeABank|OCB|MSB|Agribank|LienVietPostBank|SHB)[^|]*/gi,
        ''
      ).trim() || rawTitle;

    const descMatch =
      html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = (descMatch?.[1] || '').trim();
    const cleanText = stripHtml(html).slice(0, 4000);

    const pageType = detectPageType(url, title, html);
    const dates = extractPageDates(html, url);
    const audienceEval = evaluateAudience(title, description, cleanText, url);
    const category = detectCategory(`${title} ${description} ${cleanText}`);

    itemsParsed++;

    const auditItem: CandidateAuditItem = {
      id: crypto.randomUUID(),
      bankId,
      bankName,
      url,
      title: title || `${bankName} - Trang chi tiết`,
      pageType,
      publishedAt: dates.publishedAt,
      effectiveFrom: dates.effectiveFrom,
      effectiveTo: dates.effectiveTo,
      audience: audienceEval.audience,
      contentType: category,
      httpStatus: childFetch.status,
      accepted: false,
      rejectionReason: null,
    };

    // 1. Landing & Category check: Must NEVER enter results!
    if (pageType === 'landing') {
      auditItem.rejectionReason = 'LANDING_PAGE';
      candidateAudit.push(auditItem);
      continue;
    }

    if (pageType === 'category') {
      auditItem.rejectionReason = 'CATEGORY_PAGE';
      candidateAudit.push(auditItem);
      continue;
    }

    // 2. Title validity check
    if (!title || auditItem.title === 'Lỗi tải trang') {
      auditItem.rejectionReason = 'TITLE_INVALID';
      candidateAudit.push(auditItem);
      continue;
    }

    // 3. Audience check: Must be corporate (B2B/SME/Corporate)
    if (!audienceEval.isCorporate) {
      itemsRejectedByAudience++;
      auditItem.rejectionReason = audienceEval.rejectionReason || 'PERSONAL_CONTENT';
      candidateAudit.push(auditItem);
      continue;
    }

    // 4. Date validity check:
    // If published date is missing, check if an effective start date was found on the page
    if (!dates.publishedAt) {
      if (dates.effectiveFrom) {
        dates.publishedAt = dates.effectiveFrom;
        dates.dateSource = `Ngày bắt đầu hiệu lực (${pageType})`;
        auditItem.publishedAt = dates.publishedAt;
        auditItem.effectiveFrom = dates.effectiveFrom;
        auditItem.effectiveTo = dates.effectiveTo;
      } else {
        itemsMissingDate++;
        itemsRejectedByDate++;
        auditItem.rejectionReason = 'DATE_MISSING';
        candidateAudit.push(auditItem);
        continue;
      }
    }

    // 5. Date range boundary check:
    // Strict enforcement: Never accept content outside user-selected date range [dateFrom, dateTo]
    if (dates.publishedAt < dateFrom || dates.publishedAt > dateTo) {
      itemsRejectedByDate++;
      auditItem.rejectionReason = 'DATE_OUT_OF_RANGE';
      candidateAudit.push(auditItem);
      continue;
    }

    // All criteria passed: Candidate is verified and accepted!
    auditItem.accepted = true;
    auditItem.rejectionReason = null;
    candidateAudit.push(auditItem);

    articles.push({
      url,
      title: title || `${bankName} - Dịch vụ khách hàng doanh nghiệp`,
      description: description || cleanText.slice(0, 250),
      content: cleanText.slice(0, 1500),
      publishedAt: dates.publishedAt,
      effectiveFrom: dates.effectiveFrom,
      effectiveTo: dates.effectiveTo,
      hasDate: true,
      dateSource: dates.dateSource,
      category,
      audience: audienceEval.audience,
      isCorporate: true,
      audienceReason: audienceEval.reason,
      verificationStatus: 'verified',
      confidenceScore: 0.98,
    });
  }

  const status = articles.length > 0 ? 'success' : 'partial';

  return {
    sourceUrl: targetUrl,
    httpStatus: rootFetch.status,
    status,
    pagesDiscovered: candidateAudit.length,
    pagesFetched,
    itemsParsed,
    itemsRejectedByDate,
    itemsRejectedByAudience,
    itemsMissingDate,
    articles,
    candidateAudit,
  };
}
