import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await store.updateUser(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await store.deleteUser(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Không thể xóa người dùng hoặc người dùng không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
