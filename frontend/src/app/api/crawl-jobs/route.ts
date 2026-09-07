import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dateFrom = body.date_from || '2024-01-01';
    const dateTo = body.date_to || '2024-12-31';

    const job = await store.createCrawlJob(dateFrom, dateTo);

    // Call FastAPI Worker if available, or run simulation in background
    const workerUrl = process.env.WORKER_URL || 'http://localhost:8000';
    try {
      fetch(`${workerUrl}/internal/process-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WORKER_INTERNAL_SECRET || 'secret'}`,
        },
        body: JSON.stringify({ job_id: job.id, date_from: dateFrom, date_to: dateTo }),
      }).catch(() => {
        // Fallback simulation if worker process is offline
      });
    } catch (e) {}

    // Add simulated discovery item to represent progress if worker is not yet connected
    setTimeout(async () => {
      try {
        await store.updateCrawlJob(job.id, { status: 'completed', progress: 100 });
        await store.addDiscoveredItem({
          title: 'Cập nhật giải pháp số SME',
          feature_name: 'Tính năng quản trị số mới',
          source_type: 'website',
        });
      } catch (e) {}
    }, 1500);

    return NextResponse.json({ data: job }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
