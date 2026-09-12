import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { runScanWorker } from '@/lib/crawler/scanWorker';

// A multi-bank crawl cannot reliably finish inside the old 60-second limit.
// Production should still prefer BACKEND_WORKER_URL (a durable worker/queue).
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = await store.getCrawlJobs();
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fromDate = body.fromDate || body.date_from;
    const toDate = body.toDate || body.date_to;
    const bankIds = body.bankIds ?? body.selected_banks;
    const rawSourceTypes = body.sourceTypes || body.source_types || ['website'];

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'Bắt buộc nhập Từ ngày và Đến ngày' },
        { status: 400 }
      );
    }

    if (toDate < fromDate) {
      return NextResponse.json(
        { success: false, error: 'Đến ngày không được nhỏ hơn Từ ngày' },
        { status: 400 }
      );
    }

    // Validate bankIds must be an array
    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Danh sách ngân hàng (bankIds) không hợp lệ hoặc để trống' },
        { status: 400 }
      );
    }

    // Validate sourceTypes array and accept only 'website' or 'facebook'
    if (!Array.isArray(rawSourceTypes) || rawSourceTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bắt buộc chọn ít nhất một nguồn quét (Website hoặc Facebook)' },
        { status: 400 }
      );
    }

    const validSourceTypes = rawSourceTypes.filter(
      (st: string): st is 'website' | 'facebook' => st === 'website' || st === 'facebook'
    );
    if (validSourceTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nguồn quét không hợp lệ. Chỉ chấp nhận website hoặc facebook' },
        { status: 400 }
      );
    }

    // Check Facebook token configuration
    const hasFacebookToken = Boolean(process.env.FACEBOOK_ACCESS_TOKEN?.trim());
    let effectiveSourceTypes: ('website' | 'facebook')[] = [...validSourceTypes];
    let warning: string | undefined = undefined;

    if (effectiveSourceTypes.includes('facebook') && !hasFacebookToken) {
      if (effectiveSourceTypes.includes('website')) {
        // Both Website & Facebook chosen: run website only, return warning
        effectiveSourceTypes = effectiveSourceTypes.filter((st) => st !== 'facebook');
        warning = 'Facebook chưa được kết nối nên lượt quét chỉ chạy nguồn Website.';
      } else {
        // Facebook only chosen without token: return HTTP 503
        return NextResponse.json(
          {
            success: false,
            code: 'FACEBOOK_TOKEN_MISSING',
            error: 'Facebook Token chưa được cấu hình. Vui lòng cấu hình FACEBOOK_ACCESS_TOKEN hoặc chọn thêm Website.',
          },
          { status: 503 }
        );
      }
    }

    // Validate bank IDs
    const allBanks = await store.getBanks();
    const existingBankIds = new Set(allBanks.map((b) => b.id));
    const validBankIds = bankIds.filter((id: string) => existingBankIds.has(id));

    if (validBankIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy ngân hàng hợp lệ trong cấu hình nguồn' },
        { status: 400 }
      );
    }

    // Create scan_jobs and scan_job_sources with status queued
    const job = await store.createScanJobDetail({
      dateFrom: fromDate,
      dateTo: toDate,
      selectedBanks: validBankIds,
      sourceTypes: effectiveSourceTypes,
    });

    // Use exactly one execution path. The previous implementation started both
    // the external worker and the Next.js worker, creating duplicate crawls.
    const backendWorkerUrl = process.env.BACKEND_WORKER_URL;
    if (backendWorkerUrl) {
      const workerResponse = await fetch(`${backendWorkerUrl.replace(/\/+$/, '')}/internal/process-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          date_from: fromDate,
          date_to: toDate,
        }),
      });
      if (!workerResponse.ok) {
        throw new Error(`Worker từ chối lượt quét (HTTP ${workerResponse.status})`);
      }
    } else {
      // Use a floating Promise (fire-and-forget) instead of after() which can be
      // unreliable in local dev and some serverless environments. The worker updates
      // Supabase directly, so the client polls for progress independently.
      void runScanWorker(job.id).catch((workerErr: any) => {
        console.error('[Worker Error]', workerErr);
      });
    }

    // Return HTTP 202 immediately with scanId and status=queued
    return NextResponse.json(
      {
        success: true,
        scanId: job.id,
        status: 'queued',
        data: job,
        warning,
        message: warning ? `Lượt quét đã được tạo. Lưu ý: ${warning}` : 'Lượt quét đã được tạo và đưa vào hàng đợi',
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
