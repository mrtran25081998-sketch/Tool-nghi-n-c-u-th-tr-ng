import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

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
    const bankIds = body.bankIds || body.selected_banks || [];
    const sourceTypes = body.sourceTypes || body.source_types || ['website'];

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

    if (!sourceTypes || sourceTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bắt buộc chọn ít nhất một nguồn quét (Website hoặc Facebook)' },
        { status: 400 }
      );
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

    const job = await store.createScanJobDetail({
      dateFrom: fromDate,
      dateTo: toDate,
      selectedBanks: validBankIds,
      sourceTypes,
    });

    return NextResponse.json({
      success: true,
      scanId: job.id,
      data: job,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
