import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = body.status;
    const updated = await store.updateCrawlItemStatus(id, status);
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
