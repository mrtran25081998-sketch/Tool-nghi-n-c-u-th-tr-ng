'use client';

import React from 'react';
import { Layers, Building2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { IntelligenceItem, SourceAlert } from '@/types';

interface SummaryStatCardsProps {
  items: IntelligenceItem[];
  totalSelectedBanks: number;
  alerts: SourceAlert[];
  isLoadingBanks?: boolean;
}

export default function SummaryStatCards({
  items,
  totalSelectedBanks,
  alerts,
  isLoadingBanks = false,
}: SummaryStatCardsProps) {
  // 1. Total results
  const totalResults = items.length;

  // 2. Banks with results
  const uniqueBanksWithResults = new Set(items.map((i) => i.bankId)).size;

  // 3. Verified count & rate
  const verifiedCount = items.filter((i) => i.verificationStatus === 'verified').length;
  const verifiedRate = totalResults > 0 ? Math.round((verifiedCount / totalResults) * 100) : 0;

  // 4. Review count + alert errors
  const reviewCount = items.filter((i) => i.verificationStatus === 'review').length;
  const totalReviewAndAlerts = reviewCount + alerts.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {/* 1. Kết quả */}
      <div className="bg-white rounded-2xl border border-[#d9e2f2] p-4.5 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1">
            Kết quả
          </div>
          <div className="text-2xl font-extrabold text-[#0f2357] leading-none mb-1">
            {totalResults}
          </div>
          <div className="text-[11px] text-[#667085]">
            Nội dung trong khoảng thời gian
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#eef5ff] text-[#1646d8] flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Ngân hàng */}
      <div className="bg-white rounded-2xl border border-[#d9e2f2] p-4.5 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1">
            Ngân hàng
          </div>
          <div className="text-2xl font-extrabold text-[#0f2357] leading-none mb-1">
            {isLoadingBanks ? (
              <span className="text-sm font-medium text-gray-400">...</span>
            ) : (
              <>
                {uniqueBanksWithResults}
                <span className="text-sm font-medium text-[#98a2b3]">/{totalSelectedBanks || 16}</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-[#667085]">
            Số ngân hàng có kết quả quét
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Đã kiểm chứng */}
      <div className="bg-white rounded-2xl border border-[#d9e2f2] p-4.5 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1">
            Đã kiểm chứng
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 leading-none mb-1">
            {verifiedCount}
            <span className="text-xs font-bold text-emerald-700 ml-1.5 px-1.5 py-0.5 rounded bg-emerald-50">
              {verifiedRate}%
            </span>
          </div>
          <div className="text-[11px] text-[#667085]">
            Có URL bài viết chính thức
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Cần rà soát */}
      <div className="bg-white rounded-2xl border border-[#d9e2f2] p-4.5 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1">
            Cần rà soát
          </div>
          <div className="text-2xl font-extrabold text-amber-600 leading-none mb-1">
            {totalReviewAndAlerts}
          </div>
          <div className="text-[11px] text-[#667085]">
            {reviewCount} mục rà soát • {alerts.length} nguồn lỗi
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
