import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bankColumns, groups, rows } = body;

    if (!bankColumns || !groups || !rows) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    await store.importBenchmarkData({
      banks: bankColumns,
      groups,
      rows,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
