'use client';

import React, { useState } from 'react';
import { SourceDiscoveredUrl } from '@/types';
import { X, ExternalLink, Globe, CheckCircle2, AlertCircle, EyeOff, Search } from 'lucide-react';

interface SourceDiscoveryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  discoveredUrls: SourceDiscoveredUrl[];
  onUpdateStatus: (id: string, status: 'TRACKING' | 'REVIEW' | 'IGNORE') => void;
}

export default function SourceDiscoveryDrawer({
  isOpen,
  onClose,
  discoveredUrls,
  onUpdateStatus,
}: SourceDiscoveryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TRACKING' | 'REVIEW' | 'IGNORE'>('ALL');

  if (!isOpen) return null;

  const filtered = discoveredUrls.filter((item) => {
    const matchesSearch =
      (item.page_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.url || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.bank_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.classification.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const trackingCount = discoveredUrls.filter((u) => u.status === 'TRACKING').length;
  const reviewCount = discoveredUrls.filter((u) => u.status === 'REVIEW').length;
  const ignoreCount = discoveredUrls.filter((u) => u.status === 'IGNORE').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0f2357]/30 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-[#d9e2f2] flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#edf1f6] flex items-center justify-between bg-[#f8fafc]">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1646d8]" />
              <h2 className="text-base font-bold text-[#0f2357] m-0">Nguồn Website Đang Khám Phá & Theo Dõi</h2>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Tự động bóc tách từ Seed URLs, sitemap.xml và cấu trúc liên kết nội bộ của các ngân hàng đối thủ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#667085] hover:text-[#0f2357] p-1.5 rounded-lg hover:bg-[#e6ecf4] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Filter Bar */}
        <div className="p-3.5 border-b border-[#edf1f6] bg-white flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#1646d8] text-white'
                  : 'bg-[#f1f5f9] text-[#475467] hover:bg-[#e2e8f0]'
              }`}
            >
              Tất cả ({discoveredUrls.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('TRACKING')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === 'TRACKING'
                  ? 'bg-[#18a566] text-white'
                  : 'bg-[#ecfdf3] text-[#027a48] hover:bg-[#d1fadf]'
              }`}
            >
              Đang theo dõi ({trackingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REVIEW')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === 'REVIEW'
                  ? 'bg-[#f79009] text-white'
                  : 'bg-[#fffaeb] text-[#b54708] hover:bg-[#fef0c7]'
              }`}
            >
              Cần xem xét ({reviewCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IGNORE')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === 'IGNORE'
                  ? 'bg-[#667085] text-white'
                  : 'bg-[#f8fafc] text-[#667085] hover:bg-[#e2e8f0]'
              }`}
            >
              Đã bỏ qua ({ignoreCount})
            </button>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#98a2b3]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ngân hàng, tiêu đề, URL..."
              className="w-full h-8 pl-8 pr-2.5 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
            />
          </div>
        </div>

        {/* URL List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#667085] text-xs">
              Không tìm thấy URL nào khớp với điều kiện lọc
            </div>
          ) : (
            filtered.map((item) => {
              const relevancePercent = Math.round(item.relevance_score * 100);
              return (
                <div
                  key={item.id}
                  className="p-3 border border-[#e2e8f0] rounded-xl hover:border-[#b9cbe7] transition-all bg-white"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-xs text-[#0f2357]">{item.bank_name || 'Ngân hàng'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-[#eef5ff] text-[#1646d8]">
                          {item.classification}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            relevancePercent >= 80
                              ? 'bg-[#ecfdf3] text-[#027a48]'
                              : relevancePercent >= 55
                              ? 'bg-[#fffaeb] text-[#b54708]'
                              : 'bg-[#fef3f2] text-[#b42318]'
                          }`}
                        >
                          Độ liên quan: {relevancePercent}%
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#1e293b] truncate" title={item.page_title || item.url}>
                        {item.page_title || item.url}
                      </h4>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#667085] hover:text-[#1646d8] hover:underline flex items-center gap-1 mt-0.5 break-all"
                      >
                        <span className="truncate">{item.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateStatus(item.id, e.target.value as any)}
                        className={`text-[11px] font-bold h-7 px-2 rounded-lg border focus:outline-none ${
                          item.status === 'TRACKING'
                            ? 'border-[#18a566] text-[#027a48] bg-[#ecfdf3]'
                            : item.status === 'REVIEW'
                            ? 'border-[#f79009] text-[#b54708] bg-[#fffaeb]'
                            : 'border-[#d0d5dd] text-[#667085] bg-[#f8fafc]'
                        }`}
                      >
                        <option value="TRACKING">TRACKING</option>
                        <option value="REVIEW">REVIEW</option>
                        <option value="IGNORE">IGNORE</option>
                      </select>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="text-[11px] text-[#64748b] bg-[#f8fafc] px-2.5 py-1.5 rounded-md mt-1.5 flex items-center gap-1.5">
                      <span className="font-semibold text-[#475467]">Ghi chú:</span>
                      <span>{item.reason}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
