import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ componentId: string; bankId: string }> }
) {
  try {
    const { componentId, bankId } = await params;
    const body = await req.json();
    const { description = '', score = null } = body;
    const cell = await store.updateCell(componentId, bankId, description, score);
    return NextResponse.json({ data: cell });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
