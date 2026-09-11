'use client';

import React, { useState } from 'react';
import { X, Building2, Globe, Facebook } from 'lucide-react';

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    bank_name: string;
    website_url: string;
    facebook_url: string;
  }) => void;
}

export default function AddBankModal({ isOpen, onClose, onSubmit }: AddBankModalProps) {
  const [bankName, setBankName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      alert('Vui lòng nhập tên ngân hàng');
      return;
    }
    onSubmit({
      bank_name: bankName.trim(),
      website_url: websiteUrl.trim(),
      facebook_url: facebookUrl.trim(),
    });
    setBankName('');
    setWebsiteUrl('');
    setFacebookUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#d9e2f2] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#edf1f8] bg-gradient-to-r from-[#fafbff] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#eef5ff] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#1646d8]" />
            </div>
            <div>
              <h3 className="text-[14px] font-extrabold text-[#0f2357] leading-tight">
                Thêm nguồn ngân hàng
              </h3>
              <p className="text-[11px] text-[#667085]">Cấu hình nguồn Website và Facebook doanh nghiệp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#0f2357] hover:bg-[#f2f5fa] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Bank name */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#344054] mb-1.5">
              Tên ngân hàng <span className="text-[#ef3f4b]">*</span>
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="VD: VPBank, ACB, Sacombank..."
              autoFocus
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-[12px] text-[#344054] focus:outline-none focus:border-[#1646d8] focus:ring-2 focus:ring-[#1646d8]/10 transition-all placeholder:text-[#aab4c8]"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#344054] mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#667085]" />
              Website chính thức
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-[12px] text-[#344054] focus:outline-none focus:border-[#1646d8] focus:ring-2 focus:ring-[#1646d8]/10 transition-all placeholder:text-[#aab4c8]"
            />
          </div>

          {/* Facebook URL */}
          <div>
            <label className="block text-[11.5px] font-semibold text-[#344054] mb-1.5 flex items-center gap-1.5">
              <Facebook className="w-3.5 h-3.5 text-[#1646d8]" />
              Fanpage Facebook chính thức
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-[12px] text-[#344054] focus:outline-none focus:border-[#1646d8] focus:ring-2 focus:ring-[#1646d8]/10 transition-all placeholder:text-[#aab4c8]"
            />
          </div>

          {/* Info note */}
          <div className="p-3 bg-[#f6f9ff] border border-[#e1ecff] rounded-lg text-[11px] text-[#475467] leading-relaxed">
            URL trang chủ/fanpage dùng làm <strong>điểm bắt đầu quét</strong>. Hệ thống sẽ tự khám
            phá các trang con về sản phẩm, biểu phí, khuyến mại doanh nghiệp.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edf1f8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-semibold text-[#344054] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f7f9fc] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-[#2465ed] to-[#1646d8] rounded-lg hover:opacity-90 shadow-sm transition-opacity"
            >
              + Thêm nguồn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
