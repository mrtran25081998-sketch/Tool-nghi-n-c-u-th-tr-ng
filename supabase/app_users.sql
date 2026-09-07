-- ==============================================================================
-- BẢNG QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG (APP_USERS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'analyst',
    role_name TEXT NOT NULL DEFAULT 'Chuyên viên Nghiên cứu',
    department TEXT NOT NULL DEFAULT 'Khối Chiến lược',
    avatar_initials TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bật Row Level Security (RLS) và cho phép truy cập đầy đủ
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access on app_users" ON public.app_users;
CREATE POLICY "Public full access on app_users"
    ON public.app_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Khởi tạo các tài khoản mặc định
INSERT INTO public.app_users (username, password, name, email, role, role_name, department, avatar_initials, is_active)
VALUES
    ('admin', 'mb@2025', 'Nguyễn Văn Quản Trị', 'admin@mbbank.com.vn', 'admin', 'Quản trị viên hệ thống', 'Khối Chuyển đổi số & CNTT', 'QT', true),
    ('chienluoc', 'mb@2025', 'Nguyễn Hoàng', 'hoangnv@mbbank.com.vn', 'strategist', 'Chuyên viên Chiến lược cấp cao', 'Khối Chiến lược', 'NH', true),
    ('user', '123456', 'Trần Minh Tuấn', 'tuantm@mbbank.com.vn', 'analyst', 'Chuyên viên Nghiên cứu Sản phẩm', 'Khối KH Doanh nghiệp SME', 'MT', true)
ON CONFLICT (username) DO NOTHING;
