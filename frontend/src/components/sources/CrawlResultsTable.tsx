'use client';

import React, { useState } from 'react';
import { CrawlItem } from '@/types';
import { ExternalLink, X, Check, EyeOff } from 'lucide-react';

interface CrawlResultsTableProps {
  items: CrawlItem[];
  onUpdateStatus: (id: string, status: 'accepted' | 'rejected') => void;
}

export default function CrawlResultsTable({ items, onUpdateStatus }: CrawlResultsTableProps) {
  const [selectedItem, setSelectedItem] = useState<CrawlItem | null>(null);

  const displayCount = items.length;
  const countLabel =
    displayCount <= 10
      ? `Hiển thị ${displayCount}/${displayCount} dòng`
      : `Hiển thị 10 dòng · Cuộn để xem ${displayCount - 10} dòng còn lại`;

  return (
    <div className="bg-white border border-[#d9e2f2] rounded-xl p-3 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[15px] font-bold text-[#0f2357] m-0">
            1. Bảng tổng hợp dữ liệu cào Facebook + Website
          </h2>
          <small className="text-[#667085] text-xs">
            Tổng hợp các tin bài, sản phẩm, tính năng thu thập được từ Facebook và Website
          </small>
        </div>
        <small className="text-[#667085] text-xs font-semibold">{countLabel}</small>
      </div>

      <div className="border border-[#d9e2f2] rounded-lg discovery-scroll">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className="p-2 border-b border-[#d9e2f2] font-semibold text-[#1f3d7a] w-12 text-center">#</th>
              <th className="p-2 border-b border-[#d9e2f2] font-semibold text-[#1f3d7a] whitespace-nowrap">Ngày phát hiện</th>
              <th className="p-2 border-b border-[#d9e2f2] font-semibold text-[#1f3d7a] whitespace-nowrap">Ngân hàng</th>
              <th className="p-2 border-b border-[#d9e2f2] font-semibold text-[#1f3d7a] whitespace-nowrap">Nguồn (kèm link)</th>
              <th className="p-2 border-b border-[#d9e2f2] font-semibold text-[#1f3d7a]">Tiêu đề</th>
              <th className="p-2 border-b border-[#d9e2f2] font-semibold text-[#1f3d7a]">Cấu phần</th>
              <th className="p-2 border-b border-[#d9e2f2] font-semibold text-[#1f3d7a]">Tính năng / Sản phẩm</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr
                key={r.id || `crawl-${i}`}
                onClick={() => setSelectedItem(r)}
                className="hover:bg-[#fbfdff] cursor-pointer border-b border-[#e6ecf4] transition-colors"
              >
                <td className="p-2 text-center text-[#667085] font-medium">{i + 1}</td>
                <td className="p-2 whitespace-nowrap text-[#475467]">{r.detected_at}</td>
                <td className="p-2 font-semibold text-[#0f2357] whitespace-nowrap">{r.bank_name || 'Techcombank'}</td>
                <td className="p-2 whitespace-nowrap">
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[#1646d8] hover:underline font-medium"
                  >
                    <span>{r.source_type === 'facebook' ? '🔵 Facebook' : '🌐 Website'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="p-2 text-[#344054] max-w-[280px] truncate" title={r.title || ''}>
                  {r.title}
                </td>
                <td className="p-2 text-[#475467] whitespace-nowrap">{r.feature_name?.split(' ')[0] || 'Thanh toán'}</td>
                <td className="p-2 font-medium text-[#203d79]">{r.feature_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer / Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#d9e2f2] w-full max-w-xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf1f6] mb-4">
              <h3 className="text-base font-bold text-[#0f2357]">
                {selectedItem.bank_name} — {selectedItem.feature_name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-[#667085] hover:text-[#0f2357] p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <b className="block text-[#667085] font-medium mb-0.5">Ngày phát hiện</b>
                <p className="text-[#0f2357] font-semibold">{selectedItem.detected_at}</p>
              </div>
              <div>
                <b className="block text-[#667085] font-medium mb-0.5">Nguồn</b>
                <p>
                  <a
                    href={selectedItem.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1646d8] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>{selectedItem.source_type === 'facebook' ? 'Facebook' : 'Website'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
              <div>
                <b className="block text-[#667085] font-medium mb-0.5">Cấu phần</b>
                <p className="text-[#0f2357] font-semibold">{selectedItem.feature_name?.split(' ')[0] || 'Chung'}</p>
              </div>
              <div>
                <b className="block text-[#667085] font-medium mb-0.5">Tiêu đề</b>
                <p className="text-[#0f2357] font-semibold truncate" title={selectedItem.title || ''}>
                  {selectedItem.title}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#667085] mb-1">AI Summary & Đánh giá</label>
              <textarea
                rows={4}
                readOnly
                value={
                  selectedItem.summary ||
                  'Phát hiện nội dung có liên quan đến sản phẩm/tính năng doanh nghiệp. Cần đối chiếu với Initial Benchmark Seed trước khi cập nhật điểm.'
                }
                className="w-full p-2.5 bg-[#f8fafc] border border-[#cdd8ea] rounded-lg text-xs text-[#334455] leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1f6]">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f7f9fc]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(selectedItem.id, 'rejected');
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#b42318] bg-white border border-[#fda29b] rounded-lg hover:bg-[#fff0f1] flex items-center gap-1.5"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Không liên quan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(selectedItem.id, 'accepted');
                  setSelectedItem(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2465ed] to-[#0c53e8] rounded-lg hover:opacity-95 shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Chấp nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
