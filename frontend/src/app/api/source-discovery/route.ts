import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { discoverArticleLinks } from '@/lib/crawler/serverCrawler';
import { SourceDiscoveredUrl } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get('bank_id') || undefined;
    const urls = await store.getDiscoveredUrls(bankId);
    return NextResponse.json({ data: urls });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bankId = body.bank_id;
    const seedUrl = body.seed_url;
    const bankName = body.bank_name || 'Ngân hàng';

    if (!seedUrl) {
      return NextResponse.json({ error: 'seed_url is required' }, { status: 400 });
    }

    let discovered: SourceDiscoveredUrl[] = [];
    try {
      const res = await fetch(seedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const links = discoverArticleLinks(html, seedUrl, 15);
        discovered = links.map((url, idx) => ({
          id: `disc-${Date.now()}-${idx}`,
          bank_id: bankId,
          bank_name: bankName,
          url,
          discovered_at: new Date().toISOString(),
          status: 'TRACKING' as const,
          source_type: 'website' as const,
          page_title: url.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || 'Trang sản phẩm',
        }));
        await store.addDiscoveredUrls(discovered);
      }
    } catch (crawlErr: any) {
      console.warn('Source discovery fetch error:', crawlErr);
    }

    return NextResponse.json({ data: discovered, count: discovered.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
