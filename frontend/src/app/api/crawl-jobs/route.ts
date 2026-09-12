import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = await store.getCrawlJobs();
    return NextResponse.json({ data: jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dateFrom = body.date_from || body.fromDate || '2026-08-08';
    const dateTo = body.date_to || body.toDate || '2026-09-08';
    const job = await store.createCrawlJob(dateFrom, dateTo);
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
