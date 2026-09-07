import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const componentOrders = body.component_orders;
    if (!Array.isArray(componentOrders)) {
      return NextResponse.json({ error: 'component_orders must be an array' }, { status: 400 });
    }
    const components = await store.reorderComponents(componentOrders);
    return NextResponse.json({ data: components });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
