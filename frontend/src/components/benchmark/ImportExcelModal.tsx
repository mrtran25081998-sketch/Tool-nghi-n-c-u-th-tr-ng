'use client';

import React, { useState } from 'react';
import { ParsedImportData, parseCsvText, convertImportedRowsToBenchmark } from '@/lib/excelUtils';
import { Upload, X, Check, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (data: ParsedImportData) => void;
}

export default function ImportExcelModal({
  isOpen,
  onClose,
  onConfirmImport,
}: ImportExcelModalProps) {
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      const data = convertImportedRowsToBenchmark(rows, file.name);
      setParsedData(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể đọc nội dung file');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedData) return;
    onConfirmImport(parsedData);
    setParsedData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/30 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-modal border border-[#d9e2f2] w-full max-w-xl p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#edf1f6] mb-4">
          <h3 className="text-base font-bold text-[#0f2357] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1646d8]" />
            <span>Import Initial Benchmark Seed</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#667085] hover:text-[#0f2357] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        {!parsedData && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#cdd8ea] rounded-xl hover:border-[#1646d8] hover:bg-[#f9fbff] cursor-pointer transition-colors text-center">
              <Upload className="w-10 h-10 text-[#1646d8] mb-2" />
              <span className="text-sm font-bold text-[#0f2357]">Chọn file Excel hoặc CSV (.xlsx, .csv)</span>
              <span className="text-xs text-[#667085] mt-1">Hỗ trợ định dạng bảng ma trận benchmark chuẩn</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {isLoading && <div className="text-center text-xs text-[#1646d8] font-semibold">Đang xử lý file...</div>}

            {error && (
              <div className="p-3 bg-[#fff0f1] border border-[#ffd1d5] rounded-lg text-xs text-[#a72a33] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-[#f6f9ff] border border-[#e1ecff] rounded-lg text-xs text-[#52637d] leading-relaxed">
              <b>Quy tắc đọc file:</b> hàng đầu tiên là header; cột đầu là <b>Nhóm / Tính năng</b>; các cột còn lại là ngân hàng. Hàng chỉ có nội dung ở cột đầu được hiểu là <b>Nhóm</b>. Điểm được để <b>NULL</b> mặc định để bạn chấm điểm sau.
            </div>
          </div>
        )}

        {/* Preview Zone */}
        {parsedData && (
          <div className="space-y-4">
            <div className="border border-[#d8e2f1] rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-[130px_1fr] p-2.5 border-b border-[#edf1f6] bg-[#f8fafc]">
                <b className="text-[#344054]">Tên file:</b>
                <span className="text-[#0f2357] font-semibold">{parsedData.fileName}</span>
              </div>
              <div className="grid grid-cols-[130px_1fr] p-2.5 border-b border-[#edf1f6]">
                <b className="text-[#344054]">Cột ngân hàng:</b>
                <span className="text-[#1646d8] font-bold">
                  {parsedData.bankColumns.length} cột ({parsedData.bankColumns.map((b) => b.name).join(', ')})
                </span>
              </div>
              <div className="grid grid-cols-[130px_1fr] p-2.5 border-b border-[#edf1f6] bg-[#f8fafc]">
                <b className="text-[#344054]">Nhóm / Journey:</b>
                <span className="text-[#0f2357] font-semibold">{parsedData.groups.length} nhóm</span>
              </div>
              <div className="grid grid-cols-[130px_1fr] p-2.5 border-b border-[#edf1f6]">
                <b className="text-[#344054]">Số hàng cấu phần:</b>
                <span className="text-[#1646d8] font-bold">{parsedData.rows.length} cấu phần</span>
              </div>
              <div className="grid grid-cols-[130px_1fr] p-2.5">
                <b className="text-[#344054]">Nhóm phát hiện:</b>
                <span className="text-[#52637d]">
                  {parsedData.groups.slice(0, 6).join(', ')}
                  {parsedData.groups.length > 6 ? '…' : ''}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#fff5f5] border border-[#ffd1d5] rounded-lg text-xs text-[#a72a33] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Import sẽ cập nhật dữ liệu Initial Benchmark Seed hiện tại và danh sách cột ngân hàng đang hiển thị.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1f6]">
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f7f9fc]"
              >
                Chọn file khác
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2465ed] to-[#0c53e8] rounded-lg hover:opacity-95 shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Xác nhận Import</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
