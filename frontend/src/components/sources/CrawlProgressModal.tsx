'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Database, Sparkles, Network, ArrowRight } from 'lucide-react';

interface CrawlProgressModalProps {
  isOpen: boolean;
  progress: number;
  onClose?: () => void;
}

const STAGES = [
  { id: 1, label: 'Khám phá URL (robots/sitemap)', minProgress: 10 },
  { id: 2, label: 'Cào dữ liệu trang theo dõi', minProgress: 35 },
  { id: 3, label: 'Kiểm tra thay đổi snapshot & diff', minProgress: 55 },
  { id: 4, label: 'Phân loại Product Intelligence AI', minProgress: 75 },
  { id: 5, label: 'Khử trùng lặp Facebook + Website', minProgress: 88 },
  { id: 6, label: 'Ánh xạ cấu phần Benchmark', minProgress: 95 },
  { id: 7, label: 'Hoàn tất & Cập nhật Discovery Table', minProgress: 100 },
];

export default function CrawlProgressModal({ isOpen, progress, onClose }: CrawlProgressModalProps) {
  const [bankCounters, setBankCounters] = useState([
    { name: 'Techcombank Business', pages: '4/4 trang', done: false },
    { name: 'VietinBank eFAST', pages: '3/3 trang', done: false },
    { name: 'VPBank NEOBiz', pages: '3/3 trang', done: false },
    { name: 'BIDV Direct', pages: '3/3 trang', done: false },
    { name: 'VCB DigiBiz', pages: '2/2 trang', done: false },
    { name: 'ACB ONE BIZ', pages: '2/2 trang', done: false },
    { name: 'TPBank Biz', pages: '2/2 trang', done: false },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#d9e2f2] w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1646d8] to-[#3b82f6] flex items-center justify-center text-white shadow-md">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f2357] m-0">Tiến Trình Cào Dữ Liệu & Phân Tích AI</h3>
              <p className="text-xs text-[#667085] mt-0.5">Competitive Product Intelligence Engine v2.0</p>
            </div>
          </div>
          <span className="text-sm font-extrabold text-[#1646d8] bg-[#eef5ff] px-2.5 py-1 rounded-lg">
            {progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#f1f5f9] h-2.5 rounded-full overflow-hidden mb-5">
          <div
            className="bg-gradient-to-r from-[#1646d8] to-[#18a566] h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-2 mb-5">
          {STAGES.map((s, idx) => {
            const isCompleted = progress >= s.minProgress;
            const isCurrent = progress < s.minProgress && (idx === 0 || progress >= STAGES[idx - 1].minProgress);

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                  isCurrent
                    ? 'bg-[#eef5ff] font-bold text-[#1646d8] border border-[#bfd7ff]'
                    : isCompleted
                    ? 'text-[#027a48] font-medium'
                    : 'text-[#94a3b8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#18a566] shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-[#1646d8] animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#cbd5e1] flex items-center justify-center text-[10px] text-[#94a3b8]">
                      {s.id}
                    </div>
                  )}
                  <span>{s.label}</span>
                </div>

                {isCompleted && <span className="text-[10px] text-[#18a566] font-bold">Xong</span>}
                {isCurrent && <span className="text-[10px] text-[#1646d8] font-bold">Đang chạy...</span>}
              </div>
            );
          })}
        </div>

        {/* Bank Activity Counter */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 mb-4">
          <h4 className="text-[11px] font-bold text-[#475467] uppercase tracking-wider mb-2">
            Trạng thái quét nguồn theo ngân hàng:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {bankCounters.map((b) => (
              <div key={b.name} className="flex items-center justify-between text-[#334155] p-1 bg-white rounded border border-[#edf2f7]">
                <span className="truncate max-w-[130px] font-semibold text-[11px]">{b.name}</span>
                <span className="text-[10px] font-bold text-[#1646d8] bg-[#f0f5ff] px-1.5 py-0.5 rounded">
                  {b.pages}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button when done */}
        {progress >= 100 && (
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 bg-gradient-to-r from-[#18a566] to-[#0f8c52] text-white rounded-lg text-xs font-bold hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xem kết quả cào mới</span>
          </button>
        )}
      </div>
    </div>
  );
}
