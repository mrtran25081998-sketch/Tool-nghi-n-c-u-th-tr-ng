import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { DiscoveryReviewStatus } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = body.status as DiscoveryReviewStatus;
    const notes = body.notes;

    if (!['APPROVED_DISCOVERY', 'NEEDS_REVIEW', 'REJECTED', 'BENCHMARK_APPLIED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid review status' }, { status: 400 });
    }

    const updated = await store.updateProductDiscoveryReviewStatus(id, status, notes);
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
