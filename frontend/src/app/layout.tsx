import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

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
    <html lang="vi" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
