'use client';

import React, { useState } from 'react';
import { SourcePair } from '@/types';
import { Plus, Check, Trash2, Calendar, Database, Globe, CheckCircle2, HelpCircle, ListFilter } from 'lucide-react';
import AddSourceModal from './AddSourceModal';

interface SourcePairPanelProps {
  sources: SourcePair[];
  discoveredCount?: number;
  onAddPair: (data: { bank_name?: string; facebook_url: string; website_url: string }) => void;
  onUpdateUrl: (id: string, type: 'facebook' | 'website', url: string) => void;
  onVerify: (id: string, type: 'facebook' | 'website') => void;
  onDeletePair: (id: string) => void;
  onTriggerCrawl: (dateFrom: string, dateTo: string) => void;
  onOpenDiscoveryDrawer: () => void;
  isCrawling?: boolean;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
}

export default function SourcePairPanel({
  sources,
  discoveredCount = 20,
  onAddPair,
  onUpdateUrl,
  onVerify,
  onDeletePair,
  onTriggerCrawl,
  onOpenDiscoveryDrawer,
  isCrawling = false,
  dateFrom: controlledDateFrom,
  dateTo: controlledDateTo,
  onDateFromChange,
  onDateToChange,
}: SourcePairPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalDateFrom, setInternalDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [internalDateTo, setInternalDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const dateFrom = controlledDateFrom !== undefined ? controlledDateFrom : internalDateFrom;
  const dateTo = controlledDateTo !== undefined ? controlledDateTo : internalDateTo;

  const handleDateFromChange = (newDate: string) => {
    if (onDateFromChange) onDateFromChange(newDate);
    setInternalDateFrom(newDate);
  };

  const handleDateToChange = (newDate: string) => {
    if (onDateToChange) onDateToChange(newDate);
    setInternalDateTo(newDate);
  };

  return (
    <div className="bg-white border border-[#d9e2f2] rounded-xl p-4 shadow-card mb-4">
      {/* 2-Column Sources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-4">
        {/* Facebook Column */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[14px] font-bold text-[#0f2357] flex items-center gap-2 m-0">
              <span>🔵 Nguồn Facebook</span>
            </h3>
            <span className="text-[11px] font-semibold text-[#667085]">Tần suất quét: 24h</span>
          </div>
          <p className="text-[11px] text-[#667085] mb-3">Nhập URL fanpage chính thức của các ngân hàng đối thủ</p>

          <div className="space-y-2">
            {sources.map((pair) => (
              <div
                key={`fb-${pair.id}`}
                className="grid grid-cols-[120px_20px_minmax(0,1fr)_32px] gap-1.5 items-center min-h-[32px]"
              >
                <div className="text-xs font-bold text-[#0f2357] truncate" title={pair.bank_name || 'Chưa xác định'}>
                  {pair.bank_name || 'Chưa xác định'}
                </div>

                <div className="flex justify-center">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      pair.facebook_verified ? 'bg-[#18a566]' : 'bg-[#d0d5dd]'
                    }`}
                    title={pair.facebook_verified ? 'Đã xác thực chính thức' : 'Chưa xác thực'}
                  >
                    {pair.facebook_verified ? '✓' : '?'}
                  </span>
                </div>

                <input
                  type="text"
                  value={pair.facebook_url}
                  onChange={(e) => onUpdateUrl(pair.id, 'facebook', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="h-[31px] border border-[#cdd8ea] rounded-md px-2.5 text-xs text-[#475467] focus:outline-none focus:border-[#1646d8]"
                />

                <button
                  type="button"
                  onClick={() => onVerify(pair.id, 'facebook')}
                  title="Xác thực URL Facebook"
                  className="h-[31px] border border-[#97b7ff] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-md flex items-center justify-center font-bold text-xs transition-colors"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-3 px-4 py-1.5 border border-[#1646d8] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm nguồn</span>
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block bg-[#d9e2f2] w-[1px]" />

        {/* Website Column */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[14px] font-bold text-[#0f2357] flex items-center gap-2 m-0">
              <span>🌐 Nguồn Website Seed</span>
            </h3>
            <button
              type="button"
              onClick={onOpenDiscoveryDrawer}
              className="text-[11px] font-bold text-[#1646d8] hover:underline flex items-center gap-1 bg-[#eef5ff] px-2 py-0.5 rounded-md"
            >
              <Globe className="w-3 h-3" />
              <span>{discoveredCount} nguồn website đang theo dõi</span>
            </button>
          </div>
          <p className="text-[11px] text-[#667085] mb-3">Nhập Website Seed URL — Hệ thống tự khám phá thêm URL con liên quan</p>

          <div className="space-y-2">
            {sources.map((pair) => (
              <div
                key={`web-${pair.id}`}
                className="grid grid-cols-[120px_20px_minmax(0,1fr)_32px_28px] gap-1.5 items-center min-h-[32px]"
              >
                <div className="text-xs font-bold text-[#0f2357] truncate" title={pair.bank_name || 'Chưa xác định'}>
                  {pair.bank_name || 'Chưa xác định'}
                </div>

                <div className="flex justify-center">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      pair.website_verified ? 'bg-[#18a566]' : 'bg-[#d0d5dd]'
                    }`}
                    title={pair.website_verified ? 'Đã xác thực chính thức' : 'Chưa xác thực'}
                  >
                    {pair.website_verified ? '✓' : '?'}
                  </span>
                </div>

                <input
                  type="text"
                  value={pair.website_url}
                  onChange={(e) => onUpdateUrl(pair.id, 'website', e.target.value)}
                  placeholder="https://..."
                  className="h-[31px] border border-[#cdd8ea] rounded-md px-2.5 text-xs text-[#475467] focus:outline-none focus:border-[#1646d8]"
                />

                <button
                  type="button"
                  onClick={() => onVerify(pair.id, 'website')}
                  title="Xác thực URL Website"
                  className="h-[31px] border border-[#97b7ff] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-md flex items-center justify-center font-bold text-xs transition-colors"
                >
                  ✓
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePair(pair.id)}
                  title="Xóa cả hàng Facebook + Website"
                  className="h-[31px] text-[#ef3f4b] hover:bg-[#fff0f1] rounded-md flex items-center justify-center text-sm font-bold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={onOpenDiscoveryDrawer}
              className="text-xs font-bold text-[#1646d8] hover:text-[#0c53e8] flex items-center gap-1.5"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Xem chi tiết danh sách URL con được khám phá &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range & Crawl Trigger Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[250px_1fr_1fr_200px] gap-4 items-end mt-4 pt-4 border-t border-[#d9e2f2]">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-6 h-6 text-[#1646d8]" />
          <div>
            <strong className="block text-xs font-bold text-[#0f2357]">Khoảng thời gian</strong>
            <span className="block text-[11px] text-[#667085]">Chọn khoảng thời gian để cào dữ liệu</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#667085] mb-1">Từ ngày</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="w-full h-9 border border-[#cdd8ea] rounded-lg px-3 text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#667085] mb-1">Đến ngày</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="w-full h-9 border border-[#cdd8ea] rounded-lg px-3 text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
          />
        </div>

        <button
          type="button"
          disabled={isCrawling}
          onClick={() => onTriggerCrawl(dateFrom, dateTo)}
          className="w-full h-9 bg-gradient-to-r from-[#2465ed] to-[#0c53e8] text-white rounded-lg text-xs font-bold hover:opacity-95 shadow-sm transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Database className="w-4 h-4" />
          <span>{isCrawling ? 'Đang cào dữ liệu...' : '🗄 Cào dữ liệu'}</span>
        </button>
      </div>

      <AddSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddPair}
      />
    </div>
  );
}
