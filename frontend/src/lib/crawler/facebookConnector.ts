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

export async function testFacebookTokenAndPage(params: {
  facebookPageId?: string;
  facebookUrl?: string;
}): Promise<{ ok: boolean; status: string; message: string; httpStatus: number }> {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token) {
    return {
      ok: false,
      status: 'UNAVAILABLE (FACEBOOK_TOKEN_MISSING)',
      message: 'Chưa cấu hình FACEBOOK_ACCESS_TOKEN trên máy chủ',
      httpStatus: 0,
    };
  }

  const pageId = params.facebookPageId || (params.facebookUrl ? params.facebookUrl.replace(/\/+$/, '').split('/').pop() : '');
  if (!pageId) {
    return {
      ok: false,
      status: 'FAILED (PAGE_ID_MISSING)',
      message: 'Chưa cấu hình facebook_page_id cho ngân hàng',
      httpStatus: 400,
    };
  }

  try {
    const apiVersion = process.env.FACEBOOK_GRAPH_API_VERSION || 'v19.0';
    const testUrl = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pageId)}?fields=id,name,verification_status&access_token=${token}`;
    const res = await fetch(testUrl, { headers: { 'User-Agent': 'BIZ-Intelligence-Connector/2.0' } });
    const data = await res.json();

    if (!res.ok || data.error) {
      const code = data.error?.code;
      const statusStr = code === 190 ? 'FAILED (TOKEN_EXPIRED)' : code === 200 ? 'FAILED (PERMISSION_DENIED)' : 'FAILED';
      return {
        ok: false,
        status: statusStr,
        message: data.error?.message || 'Không thể xác thực Fanpage qua Graph API',
        httpStatus: res.status,
      };
    }

    return {
      ok: true,
      status: 'VERIFIED',
      message: `Đã xác thực chính thức: ${data.name || pageId}`,
      httpStatus: 200,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 'FAILED (NETWORK_ERROR)',
      message: err.message || 'Lỗi kết nối tới Meta Graph API',
      httpStatus: 0,
    };
  }
}

export async function crawlBankFacebook(params: {
  bankId: string;
  bankName: string;
  facebookUrl: string;
  facebookPageId?: string;
  dateFrom: string;
  dateTo: string;
}): Promise<FacebookCrawlResult> {
  const { facebookUrl, facebookPageId, dateFrom, dateTo } = params;
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

  // Token not configured in server environment
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

  // Use facebook_page_id from bank_sources; if empty, do NOT scrape HTML directly
  const targetPageId = (facebookPageId || '').trim();
  if (!targetPageId) {
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
      errorCode: 'FACEBOOK_PAGE_ID_MISSING',
      errorMessage: 'Chưa cấu hình facebook_page_id trong bank_sources',
    };
  }

  try {
    const sinceUnix = Math.floor(new Date(dateFrom).getTime() / 1000);
    const untilUnix = Math.floor(new Date(dateTo + 'T23:59:59').getTime() / 1000);

    let nextUrl: string | null = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(
      targetPageId
    )}/posts?fields=id,message,created_time,permalink_url,attachments&since=${sinceUnix}&until=${untilUnix}&limit=25&access_token=${token}`;

    const articles: CrawledArticle[] = [];
    let totalDiscovered = 0;
    let totalFetched = 0;
    let rejectedByAudience = 0;
    let rejectedByDate = 0;
    let lastHttpStatus = 200;
    const maxPages = 4;
    let pagesCount = 0;

    while (nextUrl && pagesCount < maxPages) {
      pagesCount++;
      const currentFetchUrl: string = nextUrl;
      const fetchRes: Response = await fetch(currentFetchUrl, { headers: { 'User-Agent': 'BIZ-Intelligence-Connector/2.0' } });
      lastHttpStatus = fetchRes.status;
      const data: any = await fetchRes.json();

      if (!fetchRes.ok || data.error) {
        const errCode = data.error?.code === 190 ? 'FACEBOOK_TOKEN_EXPIRED' : 'FACEBOOK_PERMISSION_DENIED';
        if (articles.length === 0) {
          return {
            sourceUrl: facebookUrl,
            httpStatus: fetchRes.status,
            status: 'failed',
            pagesDiscovered: totalDiscovered,
            pagesFetched: pagesCount,
            itemsParsed: 0,
            itemsRejectedByDate: 0,
            itemsRejectedByAudience: 0,
            itemsMissingDate: 0,
            articles: [],
            errorCode: errCode,
            errorMessage: data.error?.message || 'Lỗi truy vấn Meta Graph API',
          };
        }
        break;
      }

      totalFetched++;
      const posts = Array.isArray(data.data) ? data.data : [];
      totalDiscovered += posts.length;

      let reachedOlderThanFromDate = false;

      for (const p of posts) {
        const message = (p.message || '').trim();
        if (!message) continue;

        const createdIso = p.created_time ? new Date(p.created_time).toISOString().split('T')[0] : null;
        if (!createdIso) {
          continue;
        }

        // Check if post is older than fromDate
        if (createdIso < dateFrom) {
          reachedOlderThanFromDate = true;
          rejectedByDate++;
          continue;
        }

        if (createdIso > dateTo) {
          rejectedByDate++;
          continue;
        }

        // Permalinks must point to the specific post permalink_url, never the root fanpage
        const permalink = p.permalink_url || `https://facebook.com/${p.id}`;

        // Corporate keyword check
        const msgLower = message.toLowerCase();
        const isCorporate =
          msgLower.includes('doanh nghiệp') ||
          msgLower.includes('sme') ||
          msgLower.includes('corporate') ||
          msgLower.includes('b2b') ||
          msgLower.includes('hộ kinh doanh') ||
          msgLower.includes('quản lý dòng tiền') ||
          msgLower.includes('tài trợ thương mại') ||
          msgLower.includes('bảo lãnh') ||
          msgLower.includes('ngân hàng số doanh nghiệp');

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
          effectiveFrom: null,
          effectiveTo: null,
          hasDate: true,
          dateSource: 'Facebook Graph API created_time',
          category: 'Chương trình & Ưu đãi Fanpage',
          audience: 'Doanh nghiệp / SME',
          isCorporate: true,
          audienceReason: 'Khớp nội dung chuyên mục kinh doanh từ Fanpage chính thức',
          confidenceScore: 0.98,
        });
      }

      if (reachedOlderThanFromDate) {
        break;
      }

      // Check pagination next
      nextUrl = data.paging?.next || null;
    }

    return {
      sourceUrl: facebookUrl,
      httpStatus: lastHttpStatus,
      status: articles.length > 0 ? 'success' : 'partial',
      pagesDiscovered: totalDiscovered,
      pagesFetched: totalFetched,
      itemsParsed: totalDiscovered,
      itemsRejectedByDate: rejectedByDate,
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
      pagesFetched: 0,
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
