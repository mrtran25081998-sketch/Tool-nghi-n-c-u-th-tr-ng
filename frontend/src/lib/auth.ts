export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'strategist' | 'analyst';
  roleName: string;
  department: string;
  avatarInitials: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

// Danh sách tài khoản nội bộ MB Bank
export const MOCK_ACCOUNTS: (AuthUser & { passwords: string[] })[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    passwords: ['mb@2025', 'admin123', 'admin'],
    name: 'Nguyễn Văn Quản Trị',
    email: 'admin@mbbank.com.vn',
    role: 'admin',
    roleName: 'Quản trị viên hệ thống',
    department: 'Khối Chuyển đổi số & CNTT',
    avatarInitials: 'QT',
  },
  {
    id: 'usr-chienluoc',
    username: 'chienluoc',
    passwords: ['mb@2025', '123456', 'chienluoc'],
    name: 'Nguyễn Hoàng',
    email: 'hoangnv@mbbank.com.vn',
    role: 'strategist',
    roleName: 'Chuyên viên Chiến lược cấp cao',
    department: 'Khối Chiến lược',
    avatarInitials: 'NH',
  },
  {
    id: 'usr-analyst',
    username: 'user',
    passwords: ['123456', 'mb@2025', 'user'],
    name: 'Trần Minh Tuấn',
    email: 'tuantm@mbbank.com.vn',
    role: 'analyst',
    roleName: 'Chuyên viên Nghiên cứu Sản phẩm',
    department: 'Khối KH Doanh nghiệp SME',
    avatarInitials: 'MT',
  },
];

const AUTH_COOKIE_NAME = 'mb_auth_session';
const AUTH_STORAGE_KEY = 'mb_auth_user';

export function authenticateUser(credentials: LoginCredentials): AuthUser | null {
  const inputUsername = credentials.username.trim().toLowerCase();
  const inputPassword = credentials.password.trim();

  const found = MOCK_ACCOUNTS.find(
    (acc) =>
      (acc.username.toLowerCase() === inputUsername || acc.email.toLowerCase() === inputUsername) &&
      acc.passwords.includes(inputPassword)
  );

  if (!found) return null;

  const { passwords, ...user } = found;
  return user;
}

export function saveAuthSession(user: AuthUser, rememberMe = true): void {
  if (typeof window === 'undefined') return;

  const serialized = JSON.stringify(user);
  localStorage.setItem(AUTH_STORAGE_KEY, serialized);

  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8; // 30 days or 8 hours
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(serialized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getStoredAuthSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const fromStorage = localStorage.getItem(AUTH_STORAGE_KEY);
    if (fromStorage) {
      return JSON.parse(fromStorage);
    }

    // Try reading cookie
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (match) {
      const val = decodeURIComponent(match.split('=')[1]);
      return JSON.parse(val);
    }
  } catch (e) {
    console.error('Error parsing auth session:', e);
  }

  return null;
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}
