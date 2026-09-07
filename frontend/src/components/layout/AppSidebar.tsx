'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Layers, Database } from 'lucide-react';

export default function AppSidebar() {
  const pathname = usePathname();
  const [productMenuOpen, setProductMenuOpen] = useState(true);

  const isSummary = pathname === '/summary' || pathname === '/';
  const isProducts = pathname === '/products';
  const isMatrix = pathname === '/matrix';
  const isProductDataActive = isProducts || isMatrix;

  return (
    <aside className="w-[220px] shrink-0 border-r border-[#d9e2f2] p-[18px_14px] sticky top-0 h-screen bg-white flex flex-col justify-between z-30">
      <div>
        {/* Logo */}
        <Link href="/summary" className="flex items-center mb-6 no-underline px-1 py-1 hover:opacity-90 transition-opacity">
          <Image
            src="/images/mb-logo-light.png"
            alt="MB Bank Logo"
            width={130}
            height={38}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigation Section */}
        <div className="text-[11px] uppercase tracking-wider text-[#98a2b3] font-semibold my-[14px] mx-2">
          Hệ thống
        </div>

        {/* LV1: Tổng hợp dữ liệu */}
        <Link
          href="/summary"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg my-0.5 text-[13px] transition-colors ${
            isSummary
              ? 'bg-[#eef5ff] text-[#1646d8] font-bold'
              : 'text-[#344054] hover:bg-[#f7f9fc] font-medium'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Tổng hợp dữ liệu</span>
        </Link>

        {/* LV1: Dữ liệu Sản phẩm/Tính năng */}
        <button
          type="button"
          onClick={() => setProductMenuOpen(!productMenuOpen)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg my-0.5 text-[13px] text-left transition-colors cursor-pointer ${
            isProductDataActive
              ? 'text-[#1646d8] font-bold'
              : 'text-[#344054] hover:bg-[#f7f9fc] font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4" />
            <span>Dữ liệu SP/Tính năng</span>
          </div>
          <span className="text-[#667085]">
            {productMenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </button>

        {/* Submenu for LV2 */}
        {productMenuOpen && (
          <div className="space-y-0.5 mt-0.5">
            <Link
              href="/products"
              className={`flex items-center pl-8 pr-3 py-2 rounded-lg text-[12px] leading-snug transition-colors ${
                isProducts
                  ? 'bg-[#eef5ff] text-[#1646d8] font-bold'
                  : 'text-[#344054] hover:bg-[#f7f9fc]'
              }`}
            >
              <span>SP/Tính năng so với đối thủ</span>
            </Link>

            <Link
              href="/matrix"
              className={`flex items-center pl-8 pr-3 py-2 rounded-lg text-[12px] leading-snug transition-colors ${
                isMatrix
                  ? 'bg-[#eef5ff] text-[#1646d8] font-bold'
                  : 'text-[#344054] hover:bg-[#f7f9fc]'
              }`}
            >
              <span>Ma trận chấm điểm vị thế</span>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom info note */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#f7faff] to-[#edf4ff] border border-[#e1ecff] text-[11px] text-[#334455] leading-relaxed">
        <div className="font-bold text-[#1646d8] mb-1">BIZ Intelligence v2.0</div>
        <div>Hệ thống thu thập, đối chiếu và so sánh năng lực cạnh tranh ngân hàng số doanh nghiệp.</div>
      </div>
    </aside>
  );
}
