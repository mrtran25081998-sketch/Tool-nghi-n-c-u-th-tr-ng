/**
 * Server-side Website Crawler & Intelligence Parser for Banking Enterprise Pages
 * Strictly runs in Node.js server environment (never in client browser)
 */

export interface CrawledArticle {
  url: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string | null; // ISO YYYY-MM-DD or null
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
  errorCode?: string;
  errorMessage?: string;
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
];

const EXCLUSION_KEYWORDS = [
  // Explicit individual/personal product keywords
  'vay mua nhà cá nhân',
  'thẻ tín dụng cá nhân',
  'tài khoản thanh toán cá nhân',
  'tiết kiệm cá nhân',
  'vay tiêu dùng cá nhân',
  'vay tiêu dùng',
  'khách hàng cá nhân',
  'personal banking',
  'retail banking',
  'khcn',
  // Non-business news / investor relations / PR / rankings
  'tuyển dụng',
  'quan hệ cổ đông',
  'báo cáo thường niên',
  'báo cáo tài chính',
  'công bố thông tin',
  'đại hội đồng cổ đông',
  'xếp hạng tín nhiệm',
  "moody's",
  'moody’s',
  'moodys',
  'fitch ratings',
  'fitch',
  's&p global',
  'standard & poor',
  'an sinh xã hội',
  'từ thiện',
  'hiến máu',
  'tài trợ giải chạy',
  'trao học bổng',
  'bổ nhiệm',
  'từ nhiệm',
  'nghị quyết hđqt',
  'hội đồng quản trị',
  'về vietcombank',
  'cổ phiếu',
  'msci frontier',
  // Personal promotions clearly not for business
  'cuối tuần lộc',
  'lộc lá',
  'mb8888',
  'hoàn tiền cá nhân',
  'ưu đãi cuối tuần',
  'mở quà trúng lớn',
  'vòng quay may mắn',
  // Credit cards / debit cards (personal)
  'mastercard platinum',
  'visa platinum',
  'visa classic',
  'jcb cá nhân',
  'napas cá nhân',
  'thẻ ghi nợ quốc tế mb',
  'thẻ tín dụng quốc tế mb',
  'thẻ tín dụng quốc tế',
];

// Clean HTML to pure text – also removes Angular/Vue/React template artifacts
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Remove Angular/AngularJS template expressions and directives (ng-repeat, ng-if, etc.)
    .replace(/ng-[a-z-]+=\s*"[^"]*"/gi, ' ')
    .replace(/ng-[a-z-]+=\s*'[^']*'/gi, ' ')
    .replace(/\{\{[^}]*\}\}/g, ' ')  // Remove {{ expression }} interpolations
    .replace(/\$index|\$scope|\$emit|emit-last-repeater/g, ' ')
    .replace(/track by \S+/g, ' ')
    .replace(/'[a-z]+':![^,)]+/g, ' ')  // Remove AngularJS object expressions like 'menu':!(link.x)
    // Remove any remaining template-like leftover patterns
    .replace(/,\s*'[a-z-]+':!?\([^)]+\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize URL (strip fragments, tracking params, resolve relative)
export function normalizeUrl(rawHref: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(rawHref, baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;

    // Check file extensions to avoid binary assets
    const pathname = parsed.pathname.toLowerCase();
    if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|css|js|woff2?|zip|rar|mp4|mp3|exe)$/.test(pathname)) {
      return null;
    }

    // Ignore client-side template expression URLs (e.g. {{x.alias}})
    if (pathname.includes('{{') || pathname.includes('%7b%7b')) {
      return null;
    }

    // Strip tracking parameters
    parsed.hash = '';
    const trackingParams = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid'];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

// Fetch with timeout and retry
async function fetchWithRetry(url: string, timeoutMs: number = 10000, retries: number = 1): Promise<{ ok: boolean; status: number; text: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timer);
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt === retries) {
        return { ok: false, status: 0, text: '' };
      }
      // Brief pause before retry
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return { ok: false, status: 0, text: '' };
}

// Extract publication date following strict multi-stage priority
export function extractPublishedDate(html: string, url?: string): { date: string | null; source: string } {
  // 1. JSON-LD datePublished
  const jsonLdMatch = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const content = match.replace(/<script\b[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(content);
        const obj = Array.isArray(data) ? data[0] : data;
        const candidate = obj?.datePublished || obj?.dateCreated || obj?.uploadDate;
        if (candidate) {
          const iso = new Date(candidate).toISOString().split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            return { date: iso, source: 'JSON-LD datePublished' };
          }
        }
      } catch {
        // Continue to next tag
      }
    }
  }

  // 2. meta article:published_time or similar
  const metaPatterns = [
    /<meta\b[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
    /<meta\b[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["']/i,
    /<meta\b[^>]*name=["']publishdate["'][^>]*content=["']([^"']+)["']/i,
    /<meta\b[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i,
  ];
  for (const pat of metaPatterns) {
    const m = html.match(pat);
    if (m && m[1]) {
      try {
        const iso = new Date(m[1]).toISOString().split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
          return { date: iso, source: 'meta article:published_time' };
        }
      } catch {
        // Continue
      }
    }
  }

  // 3. <time datetime="...">
  const timeMatch = html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i);
  if (timeMatch && timeMatch[1]) {
    try {
      const iso = new Date(timeMatch[1]).toISOString().split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        return { date: iso, source: '<time datetime>' };
      }
    } catch {
      // Continue
    }
  }

  // 4. URL path date regex (e.g. /the-tin-dung-...-2025-4-23-14-15-19 or /2026-05-08)
  if (url) {
    const urlDateMatch = url.match(/\b(202\d)[\/\-_]([0-1]?\d)[\/\-_]([0-3]?\d)\b/);
    if (urlDateMatch) {
      const year = urlDateMatch[1];
      const month = urlDateMatch[2].padStart(2, '0');
      const day = urlDateMatch[3].padStart(2, '0');
      const mNum = parseInt(month, 10);
      const dNum = parseInt(day, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        return { date: `${year}-${month}-${day}`, source: 'URL pathname date YYYY-MM-DD' };
      }
    }
  }

  // 5. Text regex for Vietnamese / ISO dates (e.g. 15/08/2024 or 2024-08-15)
  const dmyMatch = html.match(/\b([0-3]?\d)[\/\-\.]([0-1]?\d)[\/\-\.](202\d)\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      return { date: `${year}-${month}-${day}`, source: 'text regex DD/MM/YYYY' };
    }
  }

  return { date: null, source: 'DATE_NOT_FOUND' };
}

// Evaluate audience: corporate vs retail
export function evaluateAudience(
  title: string,
  desc: string,
  content: string,
  url: string
): { isCorporate: boolean; audience: string; reason: string } {
  const normalizedTitle = title.trim();
  const normalizedText = `${url} ${title} ${desc} ${content}`
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"');
  const urlLower = url.toLowerCase();

  // Exclude generic bank homepages / portal titles
  const isGenericTitle =
    /^(mb\s*bank|mbbank|techcombank|vietinbank|bidv|vietcombank|vpbank|acb|sacombank|hdbank|tpbank|seabank|ocb|msb|agribank|lienvietpostbank|shb)(\s*[|–-].*)?$/i.test(normalizedTitle) ||
    /^(mb\s*ngân hàng quân đội|ngân hàng quân đội)(\s*[|–-].*)?$/i.test(normalizedTitle);
  if (isGenericTitle) {
    return {
      isCorporate: false,
      audience: 'Trang chủ / Cổng thông tin',
      reason: 'Tiêu đề là tên trang chủ hoặc cổng thông tin chung của ngân hàng',
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
        reason: `URL path chứa dấu hiệu trang cá nhân / thông tin nội bộ: "${pat}"`,
      };
    }
  }

  // Check strong exclusions in text
  for (const exc of EXCLUSION_KEYWORDS) {
    const normalizedExc = exc.toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"');
    if (normalizedText.includes(normalizedExc)) {
      return {
        isCorporate: false,
        audience: 'Cá nhân / Cổ đông',
        reason: `Chứa từ khóa loại trừ: "${exc}"`,
      };
    }
  }

  // Check positive corporate keywords
  const matchedKeywords: string[] = [];
  for (const kw of CORPORATE_KEYWORDS) {
    if (normalizedText.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }

  if (matchedKeywords.length > 0) {
    return {
      isCorporate: true,
      audience: 'Doanh nghiệp / SME',
      reason: `Khớp ${matchedKeywords.length} từ khóa KHDN (${matchedKeywords.slice(0, 3).join(', ')})`,
    };
  }

  return {
    isCorporate: false,
    audience: 'Chung / Chưa xác định',
    reason: 'Không tìm thấy từ khóa nhận diện KHDN/SME đặc thù',
  };
}

// Classify banking product category
export function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('tài trợ thương mại') || t.includes('lc') || t.includes('nhờ thu') || t.includes('bảo lãnh')) {
    return 'Tài trợ thương mại';
  }
  if (t.includes('tín dụng') || t.includes('vay') || t.includes('thấu chi') || t.includes('hạn mức')) {
    return 'Tín dụng và khoản vay';
  }
  if (t.includes('quản lý dòng tiền') || t.includes('thu hộ') || t.includes('chi hộ')) {
    return 'Quản lý dòng tiền';
  }
  if (t.includes('pos') || t.includes('qr') || t.includes('cổng thanh toán')) {
    return 'POS/QR';
  }
  if (t.includes('chuyển tiền quốc tế') || t.includes('ngoại tệ') || t.includes('fx')) {
    return 'Chuyển tiền quốc tế';
  }
  if (t.includes('thẻ doanh nghiệp') || t.includes('thẻ tín dụng doanh nghiệp')) {
    return 'Thẻ doanh nghiệp';
  }
  if (t.includes('tiền gửi') || t.includes('tiết kiệm doanh nghiệp') || t.includes('chứng chỉ tiền gửi')) {
    return 'Tiền gửi & Đầu tư';
  }
  if (t.includes('ngân hàng số') || t.includes('ebank') || t.includes('app') || t.includes('portal')) {
    return 'Ngân hàng số B2B';
  }
  return 'Tài khoản doanh nghiệp';
}

// Discover article URLs from page HTML
export function discoverArticleLinks(html: string, baseUrl: string, maxLinks: number = 10): string[] {
  const links: string[] = [];
  const baseObj = new URL(baseUrl);
  const baseHost = baseObj.hostname;

  // Regex matching href attributes
  const hrefRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  const seen = new Set<string>();

  while ((match = hrefRegex.exec(html)) !== null) {
    const rawHref = match[1];
    const linkText = stripHtml(match[2]).toLowerCase();
    const normalized = normalizeUrl(rawHref, baseUrl);
    if (!normalized || seen.has(normalized)) continue;

    // Must be same host domain or bank corporate subdomain
    try {
      const parsed = new URL(normalized);
      if (!parsed.hostname.endsWith(baseHost.replace(/^www\./, ''))) {
        continue;
      }

      // Exclude category hubs, roots, sitemaps, search, login pages, personal banking sections
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
        path.includes('ebank') ||
        path.endsWith('/khach-hang-doanh-nghiep') ||
        path.endsWith('/doanh-nghiep') ||
        path.endsWith('/corporate') ||
        // Explicitly exclude personal banking paths
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

      // Only include links with clear corporate/enterprise signals
      const combined = `${parsed.pathname} ${linkText}`;
      const hasCorporateSignal =
        CORPORATE_KEYWORDS.some((kw) => combined.includes(kw)) ||
        // Also allow detail article paths that may have corporate content
        /\/(chi-tiet|tin-tuc|san-pham|giai-phap|dich-vu|uu-dai|khuyen-mai|khcn-dn|corporate|business|sme|smb|enterprise)\//i.test(path);

      if (hasCorporateSignal) {
        seen.add(normalized);
        links.push(normalized);
        if (links.length >= maxLinks) break;
      }
    } catch {
      // Continue
    }
  }

  return links;
}

/**
 * Main Web Crawler execution for a single Bank
 */
export async function crawlBankWebsite(params: {
  bankId: string;
  bankName: string;
  corporateHomepageUrl: string;
  dateFrom: string;
  dateTo: string;
  maxPages?: number;
}): Promise<WebCrawlResult> {
  const { corporateHomepageUrl, dateFrom, dateTo, maxPages = 4 } = params;

  if (!corporateHomepageUrl || !corporateHomepageUrl.startsWith('http')) {
    return {
      sourceUrl: corporateHomepageUrl || '',
      httpStatus: 0,
      status: 'failed',
      pagesDiscovered: 0,
      pagesFetched: 0,
      itemsParsed: 0,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: 0,
      itemsMissingDate: 0,
      articles: [],
      errorCode: 'INVALID_URL',
      errorMessage: 'URL trang chủ KHDN không hợp lệ hoặc chưa cấu hình',
    };
  }

  console.log(`[Crawler] 🌐 Starting crawl for ${params.bankName} at: ${corporateHomepageUrl}`);

  // Step 1: Fetch corporate homepage / root seed
  const rootFetch = await fetchWithRetry(corporateHomepageUrl, 12000, 1);
  if (!rootFetch.ok || !rootFetch.text) {
    const errCode = rootFetch.status === 403 ? 'HTTP_403' : rootFetch.status === 404 ? 'HTTP_404' : 'FETCH_TIMEOUT';
    return {
      sourceUrl: corporateHomepageUrl,
      httpStatus: rootFetch.status,
      status: 'failed',
      pagesDiscovered: 0,
      pagesFetched: 1,
      itemsParsed: 0,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: 0,
      itemsMissingDate: 0,
      articles: [],
      errorCode: errCode,
      errorMessage: `Không thể truy cập trang nguồn ${corporateHomepageUrl} (HTTP ${rootFetch.status || 'timeout'})`,
    };
  }

  // Step 2: Discover candidate detail article links
  const discoveredLinks = discoverArticleLinks(rootFetch.text, corporateHomepageUrl, maxPages * 2);
  // CRITICAL: Exclude root category/homepage itself from articles! Only process detail article pages!
  const normalizedRoot = corporateHomepageUrl.replace(/\/+$/, '').toLowerCase();
  const urlsToProcess = discoveredLinks
    .filter((u) => u.replace(/\/+$/, '').toLowerCase() !== normalizedRoot)
    .slice(0, maxPages);

  const articles: CrawledArticle[] = [];
  let pagesFetched = 1; // root is already fetched
  let itemsParsed = 0;
  let itemsRejectedByDate = 0;
  let itemsRejectedByAudience = 0;
  let itemsMissingDate = 0;

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i];
    const childFetch = await fetchWithRetry(url, 10000, 1);
    pagesFetched++;
    if (!childFetch.ok || !childFetch.text) continue;
    const html = childFetch.text;

    // Extract basic metadata
    const titleMatch = html.match(/<title\b[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const rawTitle = (ogTitleMatch?.[1] || titleMatch?.[1] || '').trim();

    // Clean the title: remove site name suffix (e.g. " | MB Bank")
    const title = rawTitle.replace(/\s*[|–-]\s*(MB\s*Bank|MBBank|Techcombank|Vietinbank|BIDV|Vietcombank|VPBank|ACB|Sacombank|HDBank|TPBank|SeABank|OCB|MSB|Agribank|LienVietPostBank|SHB)[^|]*/gi, '').trim() || rawTitle;

    const descMatch =
      html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = (descMatch?.[1] || '').trim();

    const cleanText = stripHtml(html).slice(0, 4000);

    if (!title && !description) continue;

    // Reject pages that seem to be the bank's generic homepage/category hub
    const titleLower = title.toLowerCase();
    const isGenericHomepageTitle =
      /^(mb\s*bank|mbbank|techcombank|vietinbank|bidv|vietcombank|vpbank|acb|sacombank|hdbank|tpbank|seabank|ocb|msb|agribank|lienvietpostbank|shb)(\s|$|[|–-])/i.test(title) ||
      /ng[aâ]n h[àa]ng\s+(qu[aâ]n\s+[dđ][oô]i|ngo[aà]i\s+th[uưừ][oơ]ng|[cô]ng\s+th[uưừ][oơ]ng|[dđ][aầ]u\s+t[uưừ])/.test(titleLower);
    if (isGenericHomepageTitle) {
      itemsRejectedByAudience++;
      continue;
    }

    itemsParsed++;

    // Extract Date (pass URL to catch dates embedded in path)
    const { date, source: dateSource } = extractPublishedDate(html, url);
    const hasDate = Boolean(date);

    // Evaluate Audience - use og:description as primary signal, not raw HTML content
    const audienceEval = evaluateAudience(title, description, cleanText, url);

    if (!audienceEval.isCorporate) {
      itemsRejectedByAudience++;
      continue;
    }

    let verificationStatus: 'verified' | 'review' = 'verified';
    let dateReason: string | undefined = undefined;

    // Check date bounds strictly
    if (hasDate && date) {
      if (date < dateFrom || date > dateTo) {
        itemsRejectedByDate++;
        continue;
      }
    } else {
      itemsMissingDate++;
      // Reject items with no verifiable date from entering the date range results
      itemsRejectedByDate++;
      continue;
    }

    const category = detectCategory(`${title} ${description} ${cleanText}`);

    articles.push({
      url,
      title: title || `${params.bankName} - Dịch vụ khách hàng doanh nghiệp`,
      description: description || cleanText.slice(0, 250),
      content: cleanText.slice(0, 1500),
      publishedAt: hasDate ? date : null,
      hasDate,
      dateSource,
      category,
      audience: audienceEval.audience,
      isCorporate: audienceEval.isCorporate,
      audienceReason: audienceEval.reason,
      dateReason,
      verificationStatus,
      confidenceScore: hasDate ? 0.95 : 0.8,
    });
  }

  const status = articles.length > 0 ? 'success' : 'partial';

  return {
    sourceUrl: corporateHomepageUrl,
    httpStatus: rootFetch.status,
    status,
    pagesDiscovered: urlsToProcess.length,
    pagesFetched,
    itemsParsed,
    itemsRejectedByDate,
    itemsRejectedByAudience,
    itemsMissingDate,
    articles,
  };
}
