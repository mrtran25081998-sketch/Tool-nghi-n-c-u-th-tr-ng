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
    const { date_from, date_to, selected_banks, source_types } = body;

    if (!date_from || !date_to) {
      return NextResponse.json(
        { success: false, error: 'Bắt buộc nhập Từ ngày và Đến ngày' },
        { status: 400 }
      );
    }

    if (date_to < date_from) {
      return NextResponse.json(
        { success: false, error: 'Đến ngày không được nhỏ hơn Từ ngày' },
        { status: 400 }
      );
    }

    if (!source_types || source_types.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bắt buộc chọn ít nhất một nguồn quét (Website hoặc Facebook)' },
        { status: 400 }
      );
    }

    const job = await store.createScanJobDetail({
      dateFrom: date_from,
      dateTo: date_to,
      selectedBanks: selected_banks || [],
      sourceTypes: source_types,
    });

    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
