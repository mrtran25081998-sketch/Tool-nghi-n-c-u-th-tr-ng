import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { DiscoveryReviewStatus } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as DiscoveryReviewStatus | undefined;
    const bankId = searchParams.get('bank_id') || undefined;
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;

    const items = await store.getProductDiscoveries({
      status,
      bank_id: bankId,
      date_from: dateFrom,
      date_to: dateTo,
    });
    return NextResponse.json({ data: items, count: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
