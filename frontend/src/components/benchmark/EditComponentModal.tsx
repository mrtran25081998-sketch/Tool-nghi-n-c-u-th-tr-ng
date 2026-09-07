'use client';

import React, { useState, useEffect } from 'react';
import { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell, ScoreValue } from '@/types';
import { X } from 'lucide-react';

interface EditComponentModalProps {
  isOpen: boolean;
  component?: BenchmarkComponent | null;
  groups: BenchmarkGroup[];
  banks: Bank[];
  cells: BenchmarkCell[];
  onClose: () => void;
  onSubmit: (data: {
    groupId: string;
    feature: string;
    bankData: { bankId: string; description: string; score: ScoreValue }[];
  }) => void;
}

export default function EditComponentModal({
  isOpen,
  component,
  groups,
  banks,
  cells,
  onClose,
  onSubmit,
}: EditComponentModalProps) {
  const [groupId, setGroupId] = useState('');
  const [feature, setFeature] = useState('');
  const [bankData, setBankData] = useState<{ [bankId: string]: { description: string; score: string } }>({});

  useEffect(() => {
    if (isOpen) {
      if (component) {
        setGroupId(component.group_id);
        setFeature(component.name);

        const currentMap: { [bankId: string]: { description: string; score: string } } = {};
        banks.forEach((b) => {
          const cell = cells.find((c) => c.component_id === component.id && c.bank_id === b.id);
          currentMap[b.id] = {
            description: cell ? cell.description : '',
            score: cell && cell.score !== null && cell.score !== undefined ? String(cell.score) : '',
          };
        });
        setBankData(currentMap);
      } else {
        setGroupId(groups[0]?.id || '');
        setFeature('');
        const emptyMap: { [bankId: string]: { description: string; score: string } } = {};
        banks.forEach((b) => {
          emptyMap[b.id] = { description: '', score: '' };
        });
        setBankData(emptyMap);
      }
    }
  }, [component, groups, banks, cells, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feature.trim()) {
      alert('Vui lòng nhập tên cấu phần');
      return;
    }

    const payloadBankData = banks.map((b) => {
      const entry = bankData[b.id] || { description: '', score: '' };
      let finalScore: ScoreValue = null;
      if (entry.score.trim() !== '') {
        const num = Number(entry.score);
        if (!isNaN(num) && num >= 0 && num <= 3) {
          finalScore = num as ScoreValue;
        }
      }
      return {
        bankId: b.id,
        description: entry.description,
        score: finalScore,
      };
    });

    onSubmit({
      groupId,
      feature: feature.trim(),
      bankData: payloadBankData,
    });
    onClose();
  };

  const updateBankDesc = (bankId: string, desc: string) => {
    setBankData((prev) => ({
      ...prev,
      [bankId]: {
        ...(prev[bankId] || { score: '' }),
        description: desc,
      },
    }));
  };

  const updateBankScore = (bankId: string, scoreStr: string) => {
    setBankData((prev) => ({
      ...prev,
      [bankId]: {
        ...(prev[bankId] || { description: '' }),
        score: scoreStr,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2357]/30 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-modal border border-[#d9e2f2] w-full max-w-3xl max-h-[90vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#edf1f6] shrink-0">
          <h3 className="text-base font-bold text-[#0f2357]">
            {component ? 'Sửa cấu phần Benchmark' : 'Thêm cấu phần Benchmark'}
          </h3>
          <button type="button" onClick={onClose} className="text-[#667085] hover:text-[#0f2357] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Top Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-b border-[#edf1f6] shrink-0">
            <div>
              <label className="block text-xs font-semibold text-[#667085] mb-1">Nhóm / Journey</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] bg-white focus:outline-none focus:border-[#1646d8]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#667085] mb-1">Tên cấu phần</label>
              <input
                type="text"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                placeholder="Nhập tên cấu phần..."
                className="w-full h-9 px-3 border border-[#cdd8ea] rounded-lg text-xs text-[#344054] focus:outline-none focus:border-[#1646d8]"
              />
            </div>
          </div>

          {/* Scrollable Banks List (Description Left, Score Right) */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            {banks.map((bank) => {
              const data = bankData[bank.id] || { description: '', score: '' };
              return (
                <div
                  key={bank.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-3 p-3 rounded-lg border border-[#e0e7f2] bg-[#fbfdff] hover:bg-[#f9fbff] transition-colors items-start"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-[#667085] mb-1">
                      <span className="text-[#1646d8] font-bold">{bank.name}</span> — Mô tả tính năng
                    </label>
                    <textarea
                      rows={3}
                      value={data.description}
                      onChange={(e) => updateBankDesc(bank.id, e.target.value)}
                      placeholder="Nhập mô tả chi tiết năng lực..."
                      className="w-full p-2 border border-[#cdd8ea] rounded-md text-xs text-[#20304a] leading-relaxed resize-y focus:outline-none focus:border-[#1646d8] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#667085] mb-1">Điểm</label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      step={1}
                      value={data.score}
                      onChange={(e) => updateBankScore(bank.id, e.target.value)}
                      placeholder="NULL"
                      className="w-full h-9 px-2 text-center text-sm font-bold text-[#1646d8] border border-[#cdd8ea] rounded-md bg-white focus:outline-none focus:border-[#1646d8]"
                    />
                    <div className="mt-1 text-[9.5px] text-[#98a2b3] leading-tight space-y-0.5">
                      <div>0: Chưa có</div>
                      <div>1: Bán tự động</div>
                      <div>2: 100% online</div>
                      <div>3: Vượt trội</div>
                      <div>Trống = NULL</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf1f6] shrink-0">
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
              Lưu cấu phần
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
