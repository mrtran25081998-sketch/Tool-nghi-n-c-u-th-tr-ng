import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppSidebar from '@/components/layout/AppSidebar';
import Topbar from '@/components/layout/Topbar';

export const metadata: Metadata = {
  title: 'MB Competitive Product Intelligence Tool',
  description: 'Công cụ tổng hợp dữ liệu và phân tích sản phẩm/tính năng số cạnh tranh giữa MB và các đối thủ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-[#f5f7fc] text-[#0f2357] antialiased min-h-screen">
        <Providers>
          <div className="flex min-h-screen bg-[#f5f7fc]">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 p-0 overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
