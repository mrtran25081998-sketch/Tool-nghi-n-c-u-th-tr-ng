import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { authenticateUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' },
        { status: 400 }
      );
    }

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    // 1. First check in store (Supabase app_users table / in-memory store)
    const user = await store.getUserByUsername(inputUser);
    if (user && user.is_active && user.password === inputPass) {
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          roleName: user.role_name || (user.role === 'admin' ? 'Quản trị viên hệ thống' : user.role === 'strategist' ? 'Chuyên viên Chiến lược' : 'Chuyên viên Nghiên cứu'),
          department: user.department || 'Khối Chiến lược',
          avatarInitials: user.avatar_initials || 'MB',
        },
      });
    }

    // 2. Fallback to hardcoded mock accounts if store not matching
    const fallbackUser = authenticateUser({ username: inputUser, password: inputPass });
    if (fallbackUser) {
      return NextResponse.json({
        success: true,
        data: fallbackUser,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
