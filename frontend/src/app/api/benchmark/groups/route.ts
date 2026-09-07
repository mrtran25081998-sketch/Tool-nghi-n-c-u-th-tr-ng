import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const groups = await store.getGroups();
    return NextResponse.json({ data: groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, side } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const group = await store.createGroup(name, side);
    return NextResponse.json({ data: group }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
