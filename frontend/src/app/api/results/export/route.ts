import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date_from = searchParams.get('date_from') || undefined;
    const date_to = searchParams.get('date_to') || undefined;
    const bankParam = searchParams.get('bank_ids');
    const bank_ids = bankParam ? bankParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const mode = (searchParams.get('mode') as 'live' | 'demo') || 'live';

    const items = await store.getIntelligenceItems({
      date_from,
      date_to,
      bank_ids,
      category,
      status,
      search,
      mode,
    });

    // CSV Headers
    const headers = [
      'Ngân hàng',
      'Thời điểm',
      'Tiêu đề',
      'Phân loại',
      'Nội dung nổi bật',
      'Đối tượng',
      'URL Website',
      'URL Facebook',
      'Trạng thái kiểm chứng',
      'Điểm tin cậy',
      'Thời điểm thu thập',
    ];

    const rows = items.map((item) => {
      const statusLabel =
        item.verificationStatus === 'verified'
          ? 'Đã kiểm chứng'
          : item.verificationStatus === 'review'
          ? 'Cần rà soát'
          : 'Không hợp lệ';

      return [
        escapeCsvCell(item.bankName),
        escapeCsvCell(item.publishedAt || 'Chưa xác định'),
        escapeCsvCell(item.title),
        escapeCsvCell(item.category),
        escapeCsvCell(item.summary),
        escapeCsvCell(item.audience),
        escapeCsvCell(item.websiteUrl || ''),
        escapeCsvCell(item.facebookUrl || ''),
        escapeCsvCell(statusLabel),
        escapeCsvCell(item.confidenceScore ? `${Math.round(item.confidenceScore * 100)}%` : '95%'),
        escapeCsvCell(item.collectedAt),
      ].join(',');
    });

    // Prepend UTF-8 BOM (\uFEFF) for Excel Vietnamese display
    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');

    const filename = `bao_cao_thi_truong_ngan_hang_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
