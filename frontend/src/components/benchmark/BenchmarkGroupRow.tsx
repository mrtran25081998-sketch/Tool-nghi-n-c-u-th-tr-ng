'use client';

import React from 'react';
import { BenchmarkGroup } from '@/types';
import { Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface BenchmarkGroupRowProps {
  group: BenchmarkGroup;
  index: number;
  colSpan: number;
  componentCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export default function BenchmarkGroupRow({
  group,
  index,
  colSpan,
  componentCount,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: BenchmarkGroupRowProps) {
  return (
    <tr
      data-group-index={index}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="group-row bg-[#edf3fb] font-bold text-[#153c8a] border-b border-[#d9e2f2]"
    >
      <td colSpan={colSpan} className="p-2 align-middle">
        <div className="flex items-center gap-2">
          <span
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            title="Kéo để đổi vị trí nhóm"
            className="w-6 h-6 border border-[#c6d3e8] bg-white text-[#6b7da7] hover:text-[#1646d8] hover:border-[#8fb0ff] hover:bg-[#eef5ff] rounded-md flex items-center justify-center cursor-grab active:cursor-grabbing select-none text-sm transition-colors"
          >
            ⠿
          </span>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 hover:bg-[#dfeaf8] rounded text-[#153c8a]"
            title={isCollapsed ? 'Mở rộng nhóm' : 'Thu gọn nhóm'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="group-label-actions">
            <span className="font-extrabold text-[13px] text-[#153c8a]">{group.name}</span>
            <span className="text-xs text-[#6b7ca5] font-semibold ml-1">({componentCount})</span>

            <span className="group-actions ml-1">
              <button
                type="button"
                onClick={onEdit}
                title="Sửa nhóm"
                className="w-6 h-6 rounded border border-[#bcd0f4] bg-white text-[#1d5de7] hover:bg-[#eef5ff] flex items-center justify-center text-xs"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={onDelete}
                title="Xóa nhóm và toàn bộ hàng thuộc nhóm"
                className="w-6 h-6 rounded border border-[#f0c7cc] bg-white text-[#e5484d] hover:bg-[#fff1f2] flex items-center justify-center text-xs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
}
