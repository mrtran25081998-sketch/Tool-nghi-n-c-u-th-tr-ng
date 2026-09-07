import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const cellUpdates = body.cells;
    if (!Array.isArray(cellUpdates)) {
      return NextResponse.json({ error: 'cells must be an array' }, { status: 400 });
    }
    const updated = await store.batchUpdateCells(cellUpdates);
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
