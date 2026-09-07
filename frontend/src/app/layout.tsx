import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import AppSidebar from '@/components/layout/AppSidebar';
import Topbar from '@/components/layout/Topbar';

export const metadata: Metadata = {
  title: 'MB Competitive Intelligence Tool',
  description: 'Hệ thống thu thập, phân tích và so sánh năng lực cạnh tranh sản phẩm/tính năng ngân hàng số BIZ MB so với đối thủ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-white text-[#0f2357] antialiased">
        <QueryProvider>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
