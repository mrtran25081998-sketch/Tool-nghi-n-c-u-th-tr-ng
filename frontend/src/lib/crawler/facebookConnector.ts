/**
 * Facebook Connector for Bank Fanpages
 * Implements Meta Graph API when configured; gracefully marks unavailable without token
 * Never scrapes facebook.com directly with raw HTML; never produces fake posts
 */

import type { CrawledArticle } from './serverCrawler';

export interface FacebookCrawlResult {
  sourceUrl: string;
  httpStatus: number;
  status: 'success' | 'partial' | 'failed' | 'unavailable';
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

export async function crawlBankFacebook(params: {
  bankId: string;
  bankName: string;
  facebookUrl: string;
  dateFrom: string;
  dateTo: string;
}): Promise<FacebookCrawlResult> {
  const { facebookUrl, dateFrom, dateTo } = params;
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const apiVersion = process.env.FACEBOOK_GRAPH_API_VERSION || 'v19.0';

  if (!facebookUrl || !facebookUrl.startsWith('http')) {
    return {
      sourceUrl: facebookUrl || '',
      httpStatus: 0,
      status: 'unavailable',
      pagesDiscovered: 0,
      pagesFetched: 0,
      itemsParsed: 0,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: 0,
      itemsMissingDate: 0,
      articles: [],
      errorCode: 'INVALID_URL',
      errorMessage: 'URL Fanpage Facebook chưa cấu hình hoặc không hợp lệ',
    };
  }

  // State B: Meta Graph API Token not configured in server environment
  if (!token) {
    console.log(`[FacebookConnector] ℹ️ Token missing for ${params.bankName}. Marking source failed.`);
    return {
      sourceUrl: facebookUrl,
      httpStatus: 0,
      status: 'failed',
      pagesDiscovered: 0,
      pagesFetched: 0,
      itemsParsed: 0,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: 0,
      itemsMissingDate: 0,
      articles: [],
      errorCode: 'FACEBOOK_TOKEN_MISSING',
      errorMessage:
        'Chưa cấu hình FACEBOOK_ACCESS_TOKEN trên máy chủ. Vui lòng kết nối Meta Graph API để quét Fanpage chính thức.',
    };
  }

  // State A: Meta Graph API Token available
  try {
    // Extract page identifier or username from URL
    const cleanUrl = facebookUrl.replace(/\/+$/, '');
    const segments = cleanUrl.split('/');
    const pageHandle = segments[segments.length - 1];

    const sinceUnix = Math.floor(new Date(dateFrom).getTime() / 1000);
    const untilUnix = Math.floor(new Date(dateTo + 'T23:59:59').getTime() / 1000);

    const apiUrl = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(
      pageHandle
    )}/posts?fields=id,message,created_time,permalink_url,attachments&since=${sinceUnix}&until=${untilUnix}&limit=25&access_token=${token}`;

    const res = await fetch(apiUrl, { headers: { 'User-Agent': 'BIZ-Intelligence-Connector/2.0' } });
    const data = await res.json();

    if (!res.ok || data.error) {
      const errCode = data.error?.code === 190 ? 'FACEBOOK_TOKEN_EXPIRED' : 'FACEBOOK_PERMISSION_DENIED';
      return {
        sourceUrl: facebookUrl,
        httpStatus: res.status,
        status: 'failed',
        pagesDiscovered: 0,
        pagesFetched: 1,
        itemsParsed: 0,
        itemsRejectedByDate: 0,
        itemsRejectedByAudience: 0,
        itemsMissingDate: 0,
        articles: [],
        errorCode: errCode,
        errorMessage: data.error?.message || 'Lỗi truy vấn Meta Graph API',
      };
    }

    const posts = Array.isArray(data.data) ? data.data : [];
    const articles: CrawledArticle[] = [];
    let rejectedByAudience = 0;

    for (const p of posts) {
      const message = (p.message || '').trim();
      if (!message) continue;

      const createdIso = p.created_time ? new Date(p.created_time).toISOString().split('T')[0] : null;
      const permalink = p.permalink_url || `https://facebook.com/${p.id}`;

      // Corporate keyword check
      const msgLower = message.toLowerCase();
      const isCorporate =
        msgLower.includes('doanh nghiệp') ||
        msgLower.includes('sme') ||
        msgLower.includes('corporate') ||
        msgLower.includes('b2b') ||
        msgLower.includes('kinh doanh') ||
        msgLower.includes('tài trợ');

      if (!isCorporate) {
        rejectedByAudience++;
        continue;
      }

      articles.push({
        url: permalink,
        title: message.slice(0, 100) + (message.length > 100 ? '...' : ''),
        description: message.slice(0, 250),
        content: message,
        publishedAt: createdIso,
        hasDate: Boolean(createdIso),
        dateSource: 'Facebook Graph API created_time',
        category: 'Chương trình & Ưu đãi Fanpage',
        audience: 'Doanh nghiệp / SME',
        isCorporate: true,
        audienceReason: 'Khớp nội dung chuyên mục kinh doanh từ Fanpage chính thức',
        confidenceScore: 0.98,
      });
    }

    return {
      sourceUrl: facebookUrl,
      httpStatus: 200,
      status: articles.length > 0 ? 'success' : 'partial',
      pagesDiscovered: posts.length,
      pagesFetched: 1,
      itemsParsed: posts.length,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: rejectedByAudience,
      itemsMissingDate: 0,
      articles,
    };
  } catch (err: any) {
    return {
      sourceUrl: facebookUrl,
      httpStatus: 0,
      status: 'failed',
      pagesDiscovered: 0,
      pagesFetched: 1,
      itemsParsed: 0,
      itemsRejectedByDate: 0,
      itemsRejectedByAudience: 0,
      itemsMissingDate: 0,
      articles: [],
      errorCode: 'FETCH_FAILED',
      errorMessage: err.message || 'Lỗi kết nối Meta Graph API',
    };
  }
}
