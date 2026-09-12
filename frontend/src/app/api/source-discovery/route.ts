import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { discoverUrlsForBankSeed } from '@/lib/crawler/sourceDiscovery';

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

    // Run discovery engine
    const discovered = await discoverUrlsForBankSeed(bankId, bankName, seedUrl);
    await store.addDiscoveredUrls(discovered);

    return NextResponse.json({ data: discovered, count: discovered.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
