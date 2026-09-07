import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const cells = await store.getCells();
    return NextResponse.json({ data: cells });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
