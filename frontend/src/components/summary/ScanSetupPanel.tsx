'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Globe,
  Radio,
  Play,
  XCircle,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  Loader2,
  HelpCircle,
  X,
  Info,
} from 'lucide-react';
import { Bank } from '@/types';

interface ScanSetupPanelProps {
  banks: Bank[];
  isLoadingBanks?: boolean;
  banksError?: string | null;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  selectedBankIds: string[];
  onSelectedBankIdsChange: (ids: string[]) => void;
  scanSources: { website: boolean; facebook: boolean };
  onScanSourcesChange: (sources: { website: boolean; facebook: boolean }) => void;
  isScanning: boolean;
  scanProgress: {
    percent: number;
    stage: string;
    currentBankName?: string;
  };
  onStartScan: () => void;
  onCancelScan: () => void;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
}

export default function ScanSetupPanel({
  banks,
  isLoadingBanks = false,
  banksError = null,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedBankIds,
  onSelectedBankIdsChange,
  scanSources,
  onScanSourcesChange,
  isScanning,
  scanProgress,
  onStartScan,
  onCancelScan,
  isLiveMode,
  onToggleLiveMode,
}: ScanSetupPanelProps) {
  const [bankSearch, setBankSearch] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [showMetaApiModal, setShowMetaApiModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter banks by search
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const q = bankSearch.toLowerCase().trim();
    return banks.filter(
      (b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    );
  }, [banks, bankSearch]);

  const allSelected = selectedBankIds.length === banks.length && banks.length > 0;

  const handleSelectAll = () => {
    onSelectedBankIdsChange(banks.map((b) => b.id));
  };

  const handleDeselectAll = () => {
    onSelectedBankIdsChange([]);
  };

  const toggleBank = (id: string) => {
    if (selectedBankIds.includes(id)) {
      onSelectedBankIdsChange(selectedBankIds.filter((bId) => bId !== id));
    } else {
      onSelectedBankIdsChange([...selectedBankIds, id]);
    }
  };

  const validateAndStart = () => {
    setValidationError(null);
    if (isLoadingBanks) return;
    if (banksError) {
      setValidationError(banksError);
      return;
    }
    if (!dateFrom) {
      setValidationError('Vui lòng chọn Từ ngày');
      return;
    }
    if (!dateTo) {
      setValidationError('Vui lòng chọn Đến ngày');
      return;
    }
    if (dateTo < dateFrom) {
      setValidationError('Đến ngày không được nhỏ hơn Từ ngày');
      return;
    }
    if (selectedBankIds.length === 0) {
      setValidationError('Vui lòng chọn ít nhất 1 ngân hàng');
      return;
    }
    if (!scanSources.website && !scanSources.facebook) {
      setValidationError('Vui lòng chọn ít nhất một nguồn quét (Website hoặc Facebook)');
      return;
    }
    onStartScan();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d9e2f2] shadow-sm p-5 mb-5">
      {/* Header & Mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#edf2f9]">
        <div>
          <h2 className="text-base font-bold text-[#0f2357] m-0 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#1646d8]" />
            Khu thiết lập lượt quét thị trường
          </h2>
          <p className="text-xs text-[#667085] mt-1 mb-0">
            Cấu hình thời gian, lựa chọn ngân hàng đối thủ và nền tảng quét dữ liệu KHDN
          </p>
        </div>

        {/* Live Mode vs Demo Mode Toggle */}
        <div className="flex items-center gap-2 bg-[#f4f7fc] p-1 rounded-xl border border-[#e1ecff]">
          <button
            type="button"
            onClick={onToggleLiveMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isLiveMode
                ? 'bg-[#1646d8] text-white shadow-xs'
                : 'text-[#475467] hover:text-[#0f2357]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
            Live Mode (Dữ liệu thật)
          </button>
          <button
            type="button"
            onClick={onToggleLiveMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              !isLiveMode
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-[#475467] hover:text-[#0f2357]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Demo Mode (Minh họa)
          </button>
        </div>
      </div>

      {/* Validation alert if any */}
      {validationError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A. Date From */}
        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1646d8]" />
            Từ ngày <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setValidationError(null);
              onDateFromChange(e.target.value);
            }}
            disabled={isScanning}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#d0d5dd] bg-white focus:outline-none focus:ring-2 focus:ring-[#1646d8]/20 focus:border-[#1646d8] transition-all disabled:bg-gray-100"
          />
        </div>

        {/* B. Date To */}
        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1646d8]" />
            Đến ngày <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setValidationError(null);
              onDateToChange(e.target.value);
            }}
            disabled={isScanning}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-[#d0d5dd] bg-white focus:outline-none focus:ring-2 focus:ring-[#1646d8]/20 focus:border-[#1646d8] transition-all disabled:bg-gray-100"
          />
        </div>

        {/* C. Ngân hàng Multi-select */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              {isLoadingBanks ? (
                <span className="flex items-center gap-1.5 text-[#667085]">
                  <Loader2 className="w-3 h-3 animate-spin text-[#1646d8]" />
                  Đang tải cấu hình ngân hàng...
                </span>
              ) : (
                <>
                  Ngân hàng ({selectedBankIds.length}/{banks.length}) <span className="text-red-500">*</span>
                </>
              )}
            </label>
            {!isLoadingBanks && (
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={isScanning}
                  className="text-[#1646d8] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                >
                  Tất cả
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={isScanning}
                  className="text-[#667085] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>

          {/* Trigger button or loading skeleton */}
          {isLoadingBanks ? (
            <div className="w-full px-3 py-2 text-xs rounded-xl border border-[#d0d5dd] bg-gray-50 flex items-center justify-between text-[#667085] animate-pulse">
              <span className="font-medium">Đang tải cấu hình 16 ngân hàng...</span>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1646d8]" />
            </div>
          ) : banksError ? (
            <div className="w-full px-3 py-2 text-xs rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {banksError}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
              disabled={isScanning}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#d0d5dd] bg-white flex items-center justify-between text-left transition-all hover:border-[#1646d8] disabled:bg-gray-100 cursor-pointer"
            >
              <span className="truncate font-medium text-[#0f2357]">
                {selectedBankIds.length === 0
                  ? 'Chưa chọn ngân hàng nào'
                  : selectedBankIds.length === banks.length
                  ? `Đã chọn tất cả ${banks.length} ngân hàng`
                  : `Đã chọn ${selectedBankIds.length}/${banks.length} ngân hàng`}
              </span>
              <span className="text-xs text-[#667085] ml-2">▼</span>
            </button>
          )}

          {/* Popover Dropdown with Search */}
          {isBankDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsBankDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#d9e2f2] rounded-xl shadow-xl z-50 p-2 max-h-72 flex flex-col">
                {/* Search box inside dropdown */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#98a2b3]" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã ngân hàng..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#e4e7ec] focus:outline-none focus:border-[#1646d8]"
                  />
                </div>

                {/* Bank options list */}
                <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                  {filteredBanks.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#98a2b3]">Không tìm thấy ngân hàng</div>
                  ) : (
                    filteredBanks.map((b) => {
                      const isSelected = selectedBankIds.includes(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => toggleBank(b.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#eef5ff] text-[#1646d8] font-semibold' : 'hover:bg-gray-50 text-[#344054]'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#1646d8] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#98a2b3] shrink-0" />
                          )}
                          <span className="font-mono text-[11px] text-[#667085] w-12">{b.code}</span>
                          <span className="truncate">{b.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-[#edf2f9] flex items-center justify-between text-[11px]">
                  <span className="text-[#667085]">Đã chọn {selectedBankIds.length}</span>
                  <button
                    type="button"
                    onClick={() => setIsBankDropdownOpen(false)}
                    className="px-2.5 py-1 bg-[#1646d8] text-white rounded-md font-semibold cursor-pointer"
                  >
                    Xong
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* D. Nguồn quét & Action Button */}
        <div>
          <label className="block text-xs font-semibold text-[#344054] mb-1.5">
            Nguồn quét <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3 h-[38px]">
            <label className="flex items-center gap-1.5 text-xs text-[#344054] font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={scanSources.website}
                onChange={(e) => {
                  setValidationError(null);
                  onScanSourcesChange({ ...scanSources, website: e.target.checked });
                }}
                disabled={isScanning}
                className="w-4 h-4 rounded text-[#1646d8] focus:ring-[#1646d8]"
              />
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Website
            </label>

            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 text-xs text-[#344054] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={scanSources.facebook}
                  onChange={(e) => {
                    setValidationError(null);
                    onScanSourcesChange({ ...scanSources, facebook: e.target.checked });
                  }}
                  disabled={isScanning}
                  className="w-4 h-4 rounded text-[#1646d8] focus:ring-[#1646d8]"
                />
                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                Facebook
              </label>
              <button
                type="button"
                onClick={() => setShowMetaApiModal(true)}
                title="Thông tin kết nối Meta Graph API"
                className="text-[#98a2b3] hover:text-[#1646d8] transition-colors p-0.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons & Real-time Scan Progress Bar */}
      <div className="mt-4 pt-4 border-t border-[#edf2f9] flex flex-wrap items-center justify-between gap-3">
        {/* Progress Display */}
        {isScanning ? (
          <div className="flex-1 max-w-xl">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#1646d8] flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {scanProgress.stage || 'Đang quét dữ liệu...'}
              </span>
              <span className="font-bold text-[#1646d8]">{scanProgress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1646d8] to-[#2563eb] transition-all duration-300 rounded-full"
                style={{ width: `${scanProgress.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#667085]">
            Phạm vi quét: Chỉ thu thập sản phẩm, tính năng, ưu đãi KHDN/SME/Corporate.
          </div>
        )}

        {/* Action Button: Start or Cancel */}
        <div className="flex items-center gap-2">
          {isScanning ? (
            <button
              type="button"
              onClick={onCancelScan}
              className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Hủy lượt quét
            </button>
          ) : (
            <button
              type="button"
              onClick={validateAndStart}
              disabled={isLoadingBanks || Boolean(banksError)}
              className="px-6 py-2.5 rounded-xl bg-[#1646d8] text-white text-xs font-bold shadow-md hover:bg-[#123bb8] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              Bắt đầu quét
            </button>
          )}
        </div>
      </div>

      {/* Meta Graph API Guidance Modal */}
      {showMetaApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#d9e2f2] shadow-2xl max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f9]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0f2357]">
                <Info className="w-4.5 h-4.5 text-indigo-600" />
                Kết nối Meta Graph API cho Fanpage
              </div>
              <button
                onClick={() => setShowMetaApiModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 text-xs text-[#475569] space-y-3 leading-relaxed">
              <p>
                Để quét bài đăng từ Fanpage Facebook ngân hàng chính thức tuân thủ chính sách bảo mật, hệ thống kết nối trực tiếp qua <strong>Meta Graph API</strong>.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11.5px]">
                <strong>Trạng thái máy chủ:</strong> Nếu chưa cấu hình <code>FACEBOOK_ACCESS_TOKEN</code> trong biến môi trường, lượt quét Facebook sẽ báo lỗi <code>FACEBOOK_TOKEN_MISSING</code> (16 nguồn lỗi) và không hiển thị dữ liệu cũ.
              </div>
              <div>
                <strong className="text-[#0f2357] block mb-1">Cách thiết lập trên Vercel:</strong>
                <ol className="list-decimal pl-4 space-y-1 text-[11.5px]">
                  <li>Đăng ký App tại <code>developers.facebook.com</code>.</li>
                  <li>Tạo System User Token hoặc Page Access Token có quyền đọc công khai.</li>
                  <li>Thêm biến <code>FACEBOOK_ACCESS_TOKEN</code> vào Project Settings &gt; Environment Variables.</li>
                </ol>
              </div>
            </div>
            <div className="pt-3 border-t border-[#edf2f9] flex justify-end">
              <button
                onClick={() => setShowMetaApiModal(false)}
                className="px-4 py-2 bg-[#1646d8] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
