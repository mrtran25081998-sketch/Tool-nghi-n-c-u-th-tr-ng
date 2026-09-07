import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const type = body.type;
    if (type !== 'facebook' && type !== 'website') {
      return NextResponse.json({ error: 'Type must be facebook or website' }, { status: 400 });
    }
    const updated = await store.verifySourcePair(id, type);
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
