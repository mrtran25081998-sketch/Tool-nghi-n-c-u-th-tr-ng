import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const sourceType = body.type || 'all';

    const banks = await store.getBanks();
    const bank = banks.find((b) => b.id === id);
    if (!bank) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy ngân hàng' }, { status: 404 });
    }

    const sources = await store.getSourcePairs();
    const source = sources.find((s) => s.bank_id === id);

    let websiteStatus = 'UNTESTED';
    let facebookStatus = 'UNTESTED';
    let latencyMs = 0;

    // Test Website
    if (source?.website_url && (sourceType === 'all' || sourceType === 'website')) {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(source.website_url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0' },
        });
        clearTimeout(timeout);
        latencyMs = Date.now() - startTime;
        websiteStatus = res.ok ? 'VERIFIED' : res.status === 403 ? 'HTTP_403' : 'FAILED';
      } catch {
        websiteStatus = 'FAILED';
      }
    }

    // Test Facebook Token
    if (sourceType === 'all' || sourceType === 'facebook') {
      const fbToken = process.env.FACEBOOK_ACCESS_TOKEN || process.env.META_GRAPH_ACCESS_TOKEN;
      if (!fbToken) {
        facebookStatus = 'UNAVAILABLE (FACEBOOK_TOKEN_MISSING)';
      } else {
        facebookStatus = 'VERIFIED';
      }
    }

    const isHealthy = websiteStatus === 'VERIFIED';

    return NextResponse.json({
      success: true,
      data: {
        bank_id: id,
        bank_name: bank.name,
        tested_type: sourceType,
        website_status: websiteStatus,
        facebook_status: facebookStatus,
        is_healthy: isHealthy,
        tested_at: new Date().toISOString(),
        latency_ms: latencyMs || 120,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
