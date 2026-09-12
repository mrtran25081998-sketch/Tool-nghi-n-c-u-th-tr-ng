'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import AppSidebar from './AppSidebar';
import Topbar from './Topbar';

export default function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // If on login page, render bare children without sidebar/topbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state while verifying auth session
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#07153a] text-white">
        <div className="mb-4">
          <Image
            src="/images/mb-logo-dark.png"
            alt="MB Bank Logo"
            width={140}
            height={45}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
        <div className="w-8 h-8 border-3 border-white/20 border-t-[#1646d8] rounded-full animate-spin mb-3" />
        <div className="text-xs text-[#a5b7db] font-medium">Đang tải dữ liệu hệ thống...</div>
      </div>
    );
  }

  // Authenticated internal dashboard shell
  return (
    <div className="flex min-h-screen bg-[#f5f7fc]">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
