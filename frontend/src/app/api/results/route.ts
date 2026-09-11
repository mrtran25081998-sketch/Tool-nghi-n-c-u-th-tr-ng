import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date_from = searchParams.get('date_from') || undefined;
    const date_to = searchParams.get('date_to') || undefined;
    const bankParam = searchParams.get('bank_ids');
    const bank_ids = bankParam ? bankParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const mode = (searchParams.get('mode') as 'live' | 'demo') || 'live';

    const items = await store.getIntelligenceItems({
      date_from,
      date_to,
      bank_ids,
      category,
      status,
      search,
      mode,
    });

    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        total: items.length,
        verifiedCount: items.filter((i) => i.verificationStatus === 'verified').length,
        reviewCount: items.filter((i) => i.verificationStatus === 'review').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await store.addIntelligenceItem(body);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
