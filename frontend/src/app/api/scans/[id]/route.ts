import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
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

    const items = await store.getIntelligenceItems({
      scan_id: id,
      mode: 'live',
    });

    const alerts = (await store.getSourceAlerts()).filter((a) => !a.scanId || a.scanId === id);

    const responsePayload = {
      success: true,
      scanId: job.id,
      status: job.status,
      progress: {
        current: Math.round(((job.progressPercent || 0) / 100) * (job.selectedBanks.length || 1)),
        total: job.selectedBanks.length || 1,
        percent: job.progressPercent,
        currentStage: job.currentStage,
        currentBank: job.currentBankName || '',
      },
      metrics: job.metrics || {
        selectedBanks: job.selectedBanks.length,
        selectedSources: job.selectedBanks.length * job.sourceTypes.length,
        sourcesAttempted: 0,
        sourcesSucceeded: 0,
        sourcesFailed: 0,
        pagesDiscovered: 0,
        pagesFetched: 0,
        itemsParsed: 0,
        itemsRejectedByDate: 0,
        itemsRejectedByAudience: 0,
        itemsMissingDate: 0,
        itemsDeduplicated: 0,
        itemsSaved: 0,
      },
      items,
      sourceResults: job.sourceResults || [],
      rejectedCandidates: job.rejectedCandidates || [],
      alerts,
      // Backward compatibility alias for UI consumers expecting json.data
      data: {
        ...job,
        items,
        rejectedCandidates: job.rejectedCandidates || [],
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
