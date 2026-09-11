import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cancelled = await store.cancelScanJobDetail(id);
    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy lượt quét để hủy' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: cancelled });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
