import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await store.getScanJobDetail(id);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy lượt quét' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const mode = (searchParams.get('mode') as 'live' | 'demo') || 'live';

    // Retrieve all items for this scanId
    const items = await store.getIntelligenceItems({
      scan_id: id,
      status,
      mode,
    });

    const alerts = (await store.getSourceAlerts()).filter((a) => !a.scanId || a.scanId === id);

    return NextResponse.json({
      success: true,
      scanId: job.id,
      status: job.status,
      items,
      alerts,
      metrics: {
        ...job.metrics,
        itemsReturned: items.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
