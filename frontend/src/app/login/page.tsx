'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { MOCK_ACCOUNTS } from '@/lib/auth';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to /summary
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/summary');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login({
      username: username.trim(),
      password: password.trim(),
      rememberMe,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push('/summary');
    } else {
      setErrorMessage(result.error || 'Đăng nhập không thành công.');
    }
  };

  const handleQuickLogin = (accUsername: string, accPassword: string) => {
    setUsername(accUsername);
    setPassword(accPassword);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#07153a] via-[#0b246a] to-[#05112e] p-4">
      {/* Ambient background glows */}
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[#1646d8]/20 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[#e31937]/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#0b36c8]/10 blur-[160px] pointer-events-none" />

      {/* Main Login Container */}
      <div className="w-full max-w-[440px] relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center mb-3.5 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/15 shadow-xl">
            <Image
              src="/images/mb-logo-dark.png"
              alt="MB Bank Logo"
              width={160}
              height={55}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight mb-1">
            Hệ thống BIZ Intelligence v2.0
          </h1>
          <p className="text-[#a5b7db] text-xs max-w-sm mx-auto">
            Nghiên cứu, thu thập và phân tích năng lực sản phẩm số cạnh tranh
          </p>
        </div>

        {/* Glassmorphism Form Card */}
        <div className="bg-white/[0.98] rounded-2xl p-7 shadow-2xl border border-white/60 relative backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#eef2f8]">
            <div>
              <h2 className="text-[17px] font-bold text-[#0f2357] leading-tight">Đăng nhập tài khoản</h2>
              <span className="text-[12px] text-[#667085]">Sử dụng tài khoản nội bộ MB Bank</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#eef5ff] text-[#1646d8] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#fff0f1] border border-[#fecdcb] text-[#d92d20] text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                Tài khoản / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98a2b3]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin hoặc chienluoc"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] font-medium placeholder-[#98a2b3] focus:outline-none focus:border-[#1646d8] focus:bg-white focus:ring-2 focus:ring-[#1646d8]/15 transition-all"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#98a2b3]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] border border-[#d0d5dd] rounded-xl text-xs text-[#0f2357] font-medium placeholder-[#98a2b3] focus:outline-none focus:border-[#1646d8] focus:bg-white focus:ring-2 focus:ring-[#1646d8]/15 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#98a2b3] hover:text-[#344054] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#475467]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#d0d5dd] text-[#1646d8] focus:ring-[#1646d8]"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <span className="text-[#1646d8] font-medium cursor-pointer hover:underline">
                Hỗ trợ MB ID
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#1646d8] to-[#0f34a8] hover:from-[#133ec2] hover:to-[#0c2b8c] text-white text-xs font-bold shadow-lg shadow-[#1646d8]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Test Chips */}
          <div className="mt-6 pt-5 border-t border-[#eef2f8]">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#667085] mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Tài khoản dùng thử (Bấm để điền nhanh):</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MOCK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickLogin(acc.username, acc.passwords[0])}
                  className="p-2 rounded-lg bg-[#f4f7fc] hover:bg-[#eaf1fc] border border-[#e2e8f4] text-left transition-colors cursor-pointer group"
                >
                  <div className="font-bold text-[11px] text-[#1646d8] group-hover:text-[#0f34a8]">
                    {acc.username}
                  </div>
                  <div className="text-[10px] text-[#667085] truncate">
                    {acc.name}
                  </div>
                  <div className="text-[9px] text-[#98a2b3] mt-0.5">
                    MK: {acc.passwords[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[#7d93c4] text-[11px] flex items-center justify-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>© 2026 Ngân hàng Thương mại Cổ phần Quân Đội (MB)</span>
        </div>
      </div>
    </div>
  );
}
