'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MatrixPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/summary');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-gray-500">
      Đang chuyển hướng sang trang Tổng hợp dữ liệu...
    </div>
  );
}
