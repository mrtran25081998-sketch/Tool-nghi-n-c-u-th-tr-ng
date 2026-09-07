'use client';

import React from 'react';
import { Bank } from '@/types';
import { Edit2, Trash2 } from 'lucide-react';

interface BankHeaderProps {
  bank: Bank;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export default function BankHeader({
  bank,
  index,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: BankHeaderProps) {
  return (
    <th
      data-column-index={index}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="p-2 border-b border-[#d9e2f2] text-left text-xs font-semibold text-[#1f3d7a] min-w-[250px] max-w-[320px] align-middle"
    >
      <div className="flex items-center gap-1.5">
        <span
          draggable
          onDragStart={(e) => onDragStart(e, index)}
          title="Kéo để đổi vị trí cột"
          className="w-5 h-5 flex items-center justify-center text-[#6b7da7] hover:text-[#1646d8] hover:bg-[#eef5ff] rounded cursor-grab active:cursor-grabbing select-none text-sm"
        >
          ⠿
        </span>

        <div className="column-label-actions">
          <span className="font-semibold text-[#0f2357] leading-tight" title={bank.name}>
            {bank.name}
          </span>

          <span className="column-head-actions ml-1">
            <button
              type="button"
              onClick={onEdit}
              title="Sửa tên cột"
              className="w-5 h-5 rounded border border-[#b9c9e8] bg-white text-[#1f5edb] hover:bg-[#eef5ff] hover:border-[#7ea5ff] flex items-center justify-center text-[10px]"
            >
              <Edit2 className="w-2.5 h-2.5" />
            </button>

            {bank.is_mb ? (
              <button
                type="button"
                disabled
                title="Cột MB không thể xóa"
                className="w-5 h-5 rounded border border-[#d9dee8] bg-[#f7f8fa] text-[#98a2b3] flex items-center justify-center text-[10px] cursor-not-allowed"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onDelete}
                title="Xóa cột ngân hàng"
                className="w-5 h-5 rounded border border-[#f0c7cc] bg-white text-[#e5484d] hover:bg-[#fff1f2] flex items-center justify-center text-[10px]"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        </div>
      </div>
    </th>
  );
}
