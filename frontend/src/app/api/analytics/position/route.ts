import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculatePositionSummaries } from '@/lib/scoring';

export async function GET() {
  try {
    const banks = await store.getBanks();
    const components = await store.getComponents();
    const cells = await store.getCells();

    const summaries = calculatePositionSummaries(banks, components, cells);
    return NextResponse.json({ data: summaries });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
