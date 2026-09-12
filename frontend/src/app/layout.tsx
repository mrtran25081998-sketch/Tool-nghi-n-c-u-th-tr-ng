import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppLayoutShell from '@/components/layout/AppLayoutShell';

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
          <AppLayoutShell>{children}</AppLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
