'use client';

import React, { useState } from 'react';
import { Bank, BenchmarkComponent, BenchmarkCell } from '@/types';
import { Edit2, Copy, Trash2, MoreHorizontal } from 'lucide-react';

interface BenchmarkComponentRowProps {
  component: BenchmarkComponent;
  index: number;
  banks: Bank[];
  cells: BenchmarkCell[];
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export default function BenchmarkComponentRow({
  component,
  index,
  banks,
  cells,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: BenchmarkComponentRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const cellMap = new Map<string, BenchmarkCell>();
  cells.forEach((c) => {
    if (c.component_id === component.id) {
      cellMap.set(c.bank_id, c);
    }
  });

  return (
    <tr
      data-seed-index={index}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="border-b border-[#e6ecf4] hover:bg-[#fbfdff] transition-colors"
    >
      {/* Sticky Left: Feature Name */}
      <td className="p-2 align-top text-xs font-semibold text-[#203d79]">
        <div className="flex items-start gap-1.5">
          <span
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            title="Kéo để đổi vị trí hàng hoặc chuyển nhóm"
            className="w-5 h-5 flex items-center justify-center text-[#6b7da7] hover:text-[#1646d8] hover:bg-[#eef5ff] rounded cursor-grab active:cursor-grabbing select-none text-sm shrink-0 mt-0.5"
          >
            ⠿
          </span>
          <span className="leading-snug">{component.name}</span>
        </div>
      </td>

      {/* Dynamic Bank Columns */}
      {banks.map((bank) => {
        const cell = cellMap.get(bank.id);
        const desc = cell ? cell.description : '';
        return (
          <td
            key={bank.id}
            className="p-2 align-top text-xs text-[#20304a] leading-relaxed whitespace-pre-line min-w-[250px] max-w-[320px]"
          >
            {desc || <span className="text-[#98a2b3] italic">—</span>}
          </td>
        );
      })}

      {/* Sticky Right: Action Menu */}
      <td className="p-2 align-middle text-center relative">
        <div className="flex items-center justify-center relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Thao tác"
            className="w-7 h-7 rounded-md border border-[#cbd7ea] bg-white text-[#3156a8] hover:bg-[#eef5ff] hover:border-[#8fb0ff] hover:text-[#1646d8] flex items-center justify-center transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Popover Menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div
                className="absolute right-0 top-8 z-50 min-w-[150px] p-1 bg-white border border-[#d8e2f1] rounded-lg shadow-dropdown animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#344054] hover:bg-[#eef5ff] hover:text-[#1646d8] rounded-md text-left font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#344054] hover:bg-[#eef5ff] hover:text-[#1646d8] rounded-md text-left font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Nhân bản</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#ef3f4b] hover:bg-[#fff0f1] rounded-md text-left font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
