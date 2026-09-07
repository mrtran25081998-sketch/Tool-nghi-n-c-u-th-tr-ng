'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { bank_name?: string; facebook_url: string; website_url: string }) => void;
}

export default function AddSourceModal({ isOpen, onClose, onSubmit }: AddSourceModalProps) {
  const [fbUrl, setFbUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [bankName, setBankName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUrl.trim() && !webUrl.trim()) {
      alert('Vui lòng nhập ít nhất một URL Facebook hoặc Website');
      return;
    }
    onSubmit({
      bank_name: bankName.trim() || undefined,
      facebook_url: fbUrl.trim(),
      website_url: webUrl.trim(),
    });
    setFbUrl('');
    setWebUrl('');
    setBankName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/30 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#d9e2f2] w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf1f6] mb-4">
          <h3 className="text-base font-bold text-[#0f2357]">Thêm nguồn ngân hàng</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#667085] hover:text-[#0f2357] p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#667085] mb-1">
              Tên ngân hàng (tùy chọn - tự nhận diện theo URL)
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="VD: VPBank, ACB, v.v."
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#667085] mb-1">Facebook URL</label>
              <input
                type="text"
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#667085] mb-1">Website URL</label>
              <input
                type="text"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#f6f9ff] border border-[#e1ecff] rounded-lg text-[11px] text-[#475467] leading-relaxed">
            Một lần thêm = <b>một hàng nguồn ngân hàng</b>. Facebook và Website luôn đi cùng trong một hàng. Có thể để trống một URL và bổ sung sau.
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
              Thêm hàng nguồn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
