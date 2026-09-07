import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const components = await store.getComponents();
    return NextResponse.json({ data: components });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { group_id, name } = body;
    if (!group_id || !name) {
      return NextResponse.json({ error: 'group_id and name are required' }, { status: 400 });
    }
    const comp = await store.createComponent(group_id, name);
    return NextResponse.json({ data: comp }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
