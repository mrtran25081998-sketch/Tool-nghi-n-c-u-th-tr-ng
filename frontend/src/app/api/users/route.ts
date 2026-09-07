import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const users = await store.getUsers();
    // Sanitize passwords for security, but return everything else
    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.username || !body.password || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (Họ tên, Tên đăng nhập, Mật khẩu)' },
        { status: 400 }
      );
    }

    const existing = await store.getUserByUsername(body.username);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Tên đăng nhập này đã tồn tại trong hệ thống!' },
        { status: 400 }
      );
    }

    const newUser = await store.createUser({
      username: body.username,
      password: body.password,
      name: body.name,
      email: body.email,
      role: body.role,
      role_name: body.role_name,
      department: body.department,
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
