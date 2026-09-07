import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bankIds = body.bank_ids;
    if (!Array.isArray(bankIds)) {
      return NextResponse.json({ error: 'bank_ids must be an array of ids' }, { status: 400 });
    }
    const banks = await store.reorderBanks(bankIds);
    return NextResponse.json({ data: banks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
