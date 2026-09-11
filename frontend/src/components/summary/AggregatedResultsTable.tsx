'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  Radio,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronsUpDown,
  Filter,
} from 'lucide-react';
import { IntelligenceItem, Bank } from '@/types';

interface AggregatedResultsTableProps {
  items: IntelligenceItem[];
  banks: Bank[];
  dateFrom: string;
  dateTo: string;
  isLiveMode: boolean;
  onExportCsv: () => void;
}

const CATEGORIES = [
  'Tất cả',
  'Sản phẩm mới',
  'Tính năng mới',
  'Ưu đãi/khuyến mại mới',
  'Chương trình mới',
  'Ngân hàng số doanh nghiệp',
  'Tài khoản doanh nghiệp',
  'Tín dụng và khoản vay',
  'Thẻ doanh nghiệp',
  'Thanh toán',
  'Quản lý dòng tiền',
  'Thu hộ/chi hộ',
  'POS/QR',
  'Chuyển tiền quốc tế',
  'Tài trợ thương mại',
  'LC và bảo lãnh',
];

const LOGO_PALETTE = [
  { bg: '#1646d8', text: '#fff' },
  { bg: '#007b5e', text: '#fff' },
  { bg: '#e52b2b', text: '#fff' },
  { bg: '#1a2e5a', text: '#fff' },
  { bg: '#0077b6', text: '#fff' },
  { bg: '#6d28d9', text: '#fff' },
  { bg: '#b45309', text: '#fff' },
  { bg: '#065f46', text: '#fff' },
];

function getBankColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xfffffff;
  return LOGO_PALETTE[hash % LOGO_PALETTE.length];
}

function getBankInitials(name: string): string {
  const clean = name.replace(/^(ngân hàng|bank|biz)\s*/i, '').trim();
  const words = clean.split(/\s+/);
  if (words.length === 1) return clean.slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

export default function AggregatedResultsTable({
  items,
  banks,
  dateFrom,
  dateTo,
  isLiveMode,
  onExportCsv,
}: AggregatedResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [collapsedBanks, setCollapsedBanks] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter items based on local search, category, status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSummary = item.summary.toLowerCase().includes(q);
        const matchBank = item.bankName.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchBank && !matchCategory) return false;
      }

      // Category
      if (selectedCategory !== 'Tất cả' && item.category !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && item.verificationStatus !== selectedStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return sortOrder === 'desc'
        ? b.publishedAt.localeCompare(a.publishedAt)
        : a.publishedAt.localeCompare(b.publishedAt);
    });
  }, [items, searchTerm, selectedCategory, selectedStatus, sortOrder]);

  // Group filtered items by bank
  const groupedByBank = useMemo(() => {
    const map = new Map<string, IntelligenceItem[]>();
    filteredItems.forEach((item) => {
      const key = item.bankName || 'Khác';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).map(([bankName, bankItems]) => ({
      bankName,
      bankId: bankItems[0]?.bankId || bankName,
      items: bankItems,
    }));
  }, [filteredItems]);

  // Pagination on flattened filtered items
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage]);

  const toggleBankCollapse = (bankName: string) => {
    setCollapsedBanks((prev) => ({ ...prev, [bankName]: !prev[bankName] }));
  };

  const expandAll = () => setCollapsedBanks({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    groupedByBank.forEach((g) => {
      all[g.bankName] = true;
    });
    setCollapsedBanks(all);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d9e2f2] shadow-sm overflow-hidden">
      {/* Table Top Toolbar */}
      <div className="p-4 border-b border-[#edf2f9] flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#98a2b3]" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tính năng, hoặc ngân hàng..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#d0d5dd] bg-white focus:outline-none focus:border-[#1646d8] focus:ring-2 focus:ring-[#1646d8]/20"
          />
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#667085]" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#d0d5dd] bg-white text-[#344054] font-medium focus:outline-none focus:border-[#1646d8]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#d0d5dd] bg-white text-[#344054] font-medium focus:outline-none focus:border-[#1646d8]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="verified">Đã kiểm chứng</option>
            <option value="review">Cần rà soát</option>
            <option value="invalid">Không hợp lệ</option>
          </select>

          {/* Sort Order */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 rounded-lg border border-[#d0d5dd] bg-white text-xs font-semibold text-[#344054] hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
          </button>

          {/* Expand / Collapse Controls */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2 py-1.5 text-[#1646d8] hover:underline font-semibold cursor-pointer"
            >
              Mở tất cả
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2 py-1.5 text-[#667085] hover:underline cursor-pointer"
            >
              Thu gọn
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-1"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Main Grouped Table */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-[#98a2b3] flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#0f2357] m-0 mb-1">
            Không tìm thấy dữ liệu phù hợp
          </h4>
          <p className="text-xs text-[#667085] m-0 max-w-sm mx-auto">
            Hãy thử điều chỉnh lại khoảng thời gian quét, chọn thêm ngân hàng hoặc xóa bộ lọc tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#edf2f9]">
          {groupedByBank.map((group) => {
            const isCollapsed = collapsedBanks[group.bankName];
            const color = getBankColor(group.bankName);
            const initials = getBankInitials(group.bankName);

            return (
              <div key={group.bankName} className="bg-white">
                {/* Bank Accordion Header */}
                <div
                  onClick={() => toggleBankCollapse(group.bankName)}
                  className="px-5 py-3 bg-[#f8fafd] hover:bg-[#f2f6fc] transition-colors flex items-center justify-between cursor-pointer border-y border-[#edf2f9]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {initials}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#0f2357]">{group.bankName}</span>
                      <span className="ml-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#eef5ff] text-[#1646d8]">
                        {group.items.length} nội dung
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#667085]">
                    <span className="text-xs font-medium">
                      {isCollapsed ? 'Nhấn để mở rộng' : 'Thu gọn'}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Items Table for this Bank */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fcfdff] text-[11px] font-semibold text-[#667085] border-b border-[#edf2f9]">
                          <th className="py-2.5 px-4 w-28">Thời điểm</th>
                          <th className="py-2.5 px-4 w-72">Sản phẩm / Tính năng</th>
                          <th className="py-2.5 px-4 w-36">Phân loại</th>
                          <th className="py-2.5 px-4 min-w-[280px]">Nội dung nổi bật</th>
                          <th className="py-2.5 px-4 w-36">Đối tượng</th>
                          <th className="py-2.5 px-4 w-44">Nguồn kiểm chứng</th>
                          <th className="py-2.5 px-4 w-32">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2f5fa] text-xs">
                        {group.items.map((item) => {
                          const isVerified = item.verificationStatus === 'verified';
                          const isReview = item.verificationStatus === 'review';

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-[#f9fbff] transition-colors"
                            >
                              {/* 1. Thời điểm */}
                              <td className="py-3 px-4 font-mono text-[11px] text-[#475467] align-top whitespace-nowrap">
                                {item.publishedAt || (
                                  <span className="text-amber-600 font-semibold italic">
                                    Chưa rõ ngày
                                  </span>
                                )}
                              </td>

                              {/* 2. Sản phẩm / Tính năng */}
                              <td className="py-3 px-4 align-top">
                                <div className="font-bold text-[#0f2357] leading-snug">
                                  {item.title}
                                </div>
                                {item.isDemo && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Dữ liệu minh họa
                                  </span>
                                )}
                              </td>

                              {/* 3. Phân loại */}
                              <td className="py-3 px-4 align-top">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#eef5ff] text-[#1646d8]">
                                  {item.category}
                                </span>
                              </td>

                              {/* 4. Nội dung nổi bật */}
                              <td className="py-3 px-4 text-[#475467] leading-relaxed align-top">
                                {item.summary}
                              </td>

                              {/* 5. Đối tượng */}
                              <td className="py-3 px-4 align-top">
                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-[#344054]">
                                  {item.audience || 'Doanh nghiệp'}
                                </span>
                              </td>

                              {/* 6. Nguồn kiểm chứng (Website + Facebook trên cùng 1 dòng) */}
                              <td className="py-3 px-4 align-top">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.websiteUrl && (
                                    <a
                                      href={item.websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={item.websiteUrl}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 transition-colors no-underline"
                                    >
                                      <Globe className="w-3 h-3" />
                                      Website
                                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                    </a>
                                  )}

                                  {item.facebookUrl && (
                                    <a
                                      href={item.facebookUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={item.facebookUrl}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors no-underline"
                                    >
                                      <Radio className="w-3 h-3" />
                                      Facebook
                                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                    </a>
                                  )}

                                  {!item.websiteUrl && !item.facebookUrl && (
                                    <span className="text-[#98a2b3] italic text-[11px]">
                                      Không có URL
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 7. Trạng thái kiểm chứng */}
                              <td className="py-3 px-4 align-top">
                                {isVerified ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <ShieldCheck className="w-3 h-3" />
                                    Đã kiểm chứng
                                  </span>
                                ) : isReview ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertTriangle className="w-3 h-3" />
                                    Cần rà soát
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                    <XCircle className="w-3 h-3" />
                                    Không hợp lệ
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[#edf2f9] flex flex-wrap items-center justify-between gap-3 text-xs text-[#667085]">
        <div>
          Hiển thị{' '}
          <span className="font-bold text-[#0f2357]">{filteredItems.length}</span> kết quả
          {selectedCategory !== 'Tất cả' && ` • Phân loại: ${selectedCategory}`}
          {selectedStatus !== 'all' && ` • Trạng thái: ${selectedStatus}`}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#d0d5dd] bg-white font-medium hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            Trang trước
          </button>
          <span className="font-semibold text-[#0f2357]">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-[#d0d5dd] bg-white font-medium hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
}
