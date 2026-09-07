'use client';

import React from 'react';
import { Plus, Upload, Download, Maximize2, Minimize2, Save, RotateCcw } from 'lucide-react';

interface BenchmarkToolbarProps {
  onOpenGroupModal: () => void;
  onOpenRowModal: () => void;
  onOpenColumnModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  autosave: boolean;
  onToggleAutosave: () => void;
  onReset: () => void;
  onSave: () => void;
}

export default function BenchmarkToolbar({
  onOpenGroupModal,
  onOpenRowModal,
  onOpenColumnModal,
  onOpenImportModal,
  onExportCsv,
  onExpandAll,
  onCollapseAll,
  autosave,
  onToggleAutosave,
  onReset,
  onSave,
}: BenchmarkToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
      {/* Left Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenGroupModal}
          className="h-9 px-3 border border-[#1646d8] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm nhóm</span>
        </button>

        <button
          type="button"
          onClick={onOpenRowModal}
          className="h-9 px-3 border border-[#1646d8] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm hàng</span>
        </button>

        <button
          type="button"
          onClick={onOpenColumnModal}
          className="h-9 px-3 border border-[#1646d8] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm cột</span>
        </button>

        <button
          type="button"
          onClick={onOpenImportModal}
          className="h-9 px-3 border border-[#1646d8] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import từ Excel</span>
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          className="h-9 px-3 border border-[#1646d8] bg-white text-[#1646d8] hover:bg-[#eef5ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={onExpandAll}
          className="h-9 px-3 border border-[#cbd5e1] bg-white text-[#344054] hover:bg-[#f7f9fc] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Expand all</span>
        </button>

        <button
          type="button"
          onClick={onCollapseAll}
          className="h-9 px-3 border border-[#cbd5e1] bg-white text-[#344054] hover:bg-[#f7f9fc] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Minimize2 className="w-3 h-3" />
          <span>Collapse all</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#667085] font-medium">Tự động lưu</span>
          <button
            type="button"
            role="switch"
            aria-checked={autosave}
            onClick={onToggleAutosave}
            className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
              autosave ? 'bg-[#1646d8]' : 'bg-[#d0d5dd]'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-xs ${
                autosave ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="h-9 px-3 border border-[#cbd5e1] bg-white text-[#344054] hover:bg-[#f7f9fc] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Hủy thay đổi</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          className="h-9 px-4 bg-gradient-to-r from-[#2465ed] to-[#0c53e8] text-white rounded-lg text-xs font-bold hover:opacity-95 shadow-sm transition-opacity flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Lưu thay đổi</span>
        </button>
      </div>
    </div>
  );
}
