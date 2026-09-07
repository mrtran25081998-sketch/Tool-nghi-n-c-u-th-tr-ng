'use client';

import React, { useState, useEffect } from 'react';
import { BenchmarkGroup } from '@/types';
import { X } from 'lucide-react';

interface AddEditGroupModalProps {
  isOpen: boolean;
  group?: BenchmarkGroup | null;
  onClose: () => void;
  onSubmit: (name: string, side: 'left' | 'right') => void;
}

export default function AddEditGroupModal({
  isOpen,
  group,
  onClose,
  onSubmit,
}: AddEditGroupModalProps) {
  const [name, setName] = useState('');
  const [side, setSide] = useState<'left' | 'right'>('left');

  useEffect(() => {
    if (group) {
      setName(group.name);
      setSide(group.side || 'left');
    } else {
      setName('');
      setSide('left');
    }
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }
    onSubmit(name.trim(), side);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/30 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#d9e2f2] w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf1f6] mb-4">
          <h3 className="text-base font-bold text-[#0f2357]">
            {group ? 'Sửa nhóm Journey' : 'Thêm nhóm Journey'}
          </h3>
          <button type="button" onClick={onClose} className="text-[#667085] hover:text-[#0f2357] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#667085] mb-1">Tên nhóm</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: F. TÀI TRỢ CHUỖI CUNG ỨNG"
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#667085] mb-1">Vị trí Matrix</label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as 'left' | 'right')}
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] bg-white focus:outline-none focus:border-[#1646d8]"
            >
              <option value="left">Bảng trái</option>
              <option value="right">Bảng phải</option>
            </select>
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
              {group ? 'Lưu thay đổi' : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
