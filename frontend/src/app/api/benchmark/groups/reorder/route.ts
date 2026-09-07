import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const groupIds = body.group_ids;
    if (!Array.isArray(groupIds)) {
      return NextResponse.json({ error: 'group_ids must be an array of ids' }, { status: 400 });
    }
    const groups = await store.reorderGroups(groupIds);
    return NextResponse.json({ data: groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
