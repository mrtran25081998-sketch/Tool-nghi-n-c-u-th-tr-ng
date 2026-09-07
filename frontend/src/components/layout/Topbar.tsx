'use client';

import React from 'react';
import { Bell, Info } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-[54px] border-b border-[#d9e2f2] flex items-center justify-between px-6 sticky top-0 bg-white z-20">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#eef5ff] text-[#3156a8] text-[12px] font-medium max-w-[800px] truncate">
        <Info className="w-3.5 h-3.5 shrink-0 text-[#1646d8]" />
        <span>Thu thập, phân tích và so sánh thông tin sản phẩm/tính năng của các ngân hàng đối thủ</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          title="Thông báo"
          className="w-8 h-8 rounded-full border border-[#d9e2f2] flex items-center justify-center text-[#475467] hover:bg-[#f7f9fc]"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-[#d9e2f2]">
          <div className="w-[34px] h-[34px] rounded-full bg-[#e1ecff] text-[#1646d8] flex items-center justify-center font-bold text-xs">
            NH
          </div>
          <div className="text-left text-xs leading-tight">
            <strong className="block text-[#0f2357] font-semibold">Nguyễn Hoàng</strong>
            <small className="text-[#667085]">Khối Chiến lược</small>
          </div>
        </div>
      </div>
    </header>
  );
}
