'use client';

import React, { useState, useEffect } from 'react';
import { Bank } from '@/types';
import { normalizeColumnKey } from '@/lib/excelUtils';
import { X } from 'lucide-react';

interface AddEditBankModalProps {
  isOpen: boolean;
  bank?: Bank | null;
  onClose: () => void;
  onSubmit: (name: string, code: string) => void;
}

export default function AddEditBankModal({
  isOpen,
  bank,
  onClose,
  onSubmit,
}: AddEditBankModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (bank) {
      setName(bank.name);
      setCode(bank.code);
    } else {
      setName('');
      setCode('');
    }
  }, [bank, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên cột ngân hàng');
      return;
    }
    const finalCode = normalizeColumnKey(code.trim() || name.trim());
    if (!finalCode) {
      alert('Vui lòng nhập mã viết tắt');
      return;
    }
    onSubmit(name.trim(), finalCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/30 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#d9e2f2] w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf1f6] mb-4">
          <h3 className="text-base font-bold text-[#0f2357]">
            {bank ? 'Sửa tên cột ngân hàng' : 'Thêm cột ngân hàng'}
          </h3>
          <button type="button" onClick={onClose} className="text-[#667085] hover:text-[#0f2357] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#667085] mb-1">Tên cột / Ngân hàng</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Vietcombank DigiBiz"
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#667085] mb-1">Mã viết tắt</label>
            <input
              type="text"
              value={code}
              disabled={!!bank}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: VCB"
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] disabled:bg-[#f8fafc] disabled:text-[#98a2b3] focus:outline-none focus:border-[#1646d8]"
            />
          </div>

          <div className="text-[11px] text-[#667085] leading-relaxed">
            {bank
              ? 'Đổi tên cột không làm mất dữ liệu mô tả hoặc điểm đang có trong cột.'
              : 'Cột mới sẽ được thêm vào bảng Benchmark và tự động xuất hiện trong Ma trận chấm điểm. Các ô ban đầu để trống / NULL.'}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1f6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f7f9fc]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2465ed] to-[#0c53e8] rounded-lg hover:opacity-95 shadow-sm"
            >
              {bank ? 'Lưu thay đổi' : 'Thêm cột'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
