'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell, ScoreValue } from '@/types';
import { exportBenchmarkToCsv, ParsedImportData } from '@/lib/excelUtils';
import BenchmarkToolbar from '@/components/benchmark/BenchmarkToolbar';
import BenchmarkGrid from '@/components/benchmark/BenchmarkGrid';
import AddEditGroupModal from '@/components/benchmark/AddEditGroupModal';
import AddEditBankModal from '@/components/benchmark/AddEditBankModal';
import EditComponentModal from '@/components/benchmark/EditComponentModal';
import ImportExcelModal from '@/components/benchmark/ImportExcelModal';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BenchmarkGroup | null>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<BenchmarkComponent | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Collapse state
  const [collapsedGroups, setCollapsedGroups] = useState<{ [groupId: string]: boolean }>({});
  const [autosave, setAutosave] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Queries
  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['matrix-data'],
    queryFn: async () => {
      const res = await fetch('/api/matrix');
      return res.json();
    },
  });

  const banks: Bank[] = matrixData?.data?.banks || [];
  const groups: BenchmarkGroup[] = matrixData?.data?.groups || [];
  const components: BenchmarkComponent[] = matrixData?.data?.components || [];
  const cells: BenchmarkCell[] = matrixData?.data?.cells || [];

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, side }: { name: string; side: 'left' | 'right' }) => {
      const res = await fetch('/api/benchmark/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, side }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã tạo nhóm Journey mới');
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, name, side }: { id: string; name: string; side: 'left' | 'right' }) => {
      const res = await fetch(`/api/benchmark/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, side }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã cập nhật nhóm');
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/benchmark/groups/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã xóa nhóm và toàn bộ cấu phần thuộc nhóm');
    },
  });

  const createBankMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      const res = await fetch('/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, is_mb: false }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã thêm cột ngân hàng mới');
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/banks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã đổi tên cột ngân hàng');
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/banks/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã xóa cột ngân hàng');
    },
  });

  const saveComponentMutation = useMutation({
    mutationFn: async ({
      id,
      groupId,
      feature,
      bankData,
    }: {
      id?: string;
      groupId: string;
      feature: string;
      bankData: { bankId: string; description: string; score: ScoreValue }[];
    }) => {
      let targetCompId = id;

      if (!targetCompId) {
        const compRes = await fetch('/api/benchmark/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: groupId, name: feature }),
        });
        const compJson = await compRes.json();
        targetCompId = compJson.data.id;
      } else {
        await fetch(`/api/benchmark/components/${targetCompId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: groupId, name: feature }),
        });
      }

      // Batch update cells
      const cellUpdates = bankData.map((d) => ({
        component_id: targetCompId,
        bank_id: d.bankId,
        description: d.description,
        score: d.score,
      }));

      await fetch('/api/benchmark/cells/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells: cellUpdates }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã lưu cấu phần và điểm đánh giá');
    },
  });

  const duplicateCompMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/benchmark/components/${id}/duplicate`, { method: 'POST' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã nhân bản cấu phần');
    },
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/benchmark/components/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã xóa cấu phần');
    },
  });

  const reorderBanksMutation = useMutation({
    mutationFn: async (bankIds: string[]) => {
      const res = await fetch('/api/banks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_ids: bankIds }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã thay đổi vị trí cột');
    },
  });

  const reorderGroupsMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      const res = await fetch('/api/benchmark/groups/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_ids: groupIds }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã thay đổi vị trí nhóm');
    },
  });

  const reorderCompsMutation = useMutation({
    mutationFn: async (orders: { id: string; group_id: string; display_order: number }[]) => {
      const res = await fetch('/api/benchmark/components/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component_orders: orders }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Đã thay đổi vị trí cấu phần');
    },
  });

  const importCommitMutation = useMutation({
    mutationFn: async (data: ParsedImportData) => {
      const res = await fetch('/api/benchmark/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankColumns: data.bankColumns,
          groups: data.groups,
          rows: data.rows,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      showToast('Import dữ liệu Excel thành công');
    },
  });

  // Toggle handlers
  const handleToggleCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleExpandAll = () => {
    const next: { [groupId: string]: boolean } = {};
    groups.forEach((g) => (next[g.id] = false));
    setCollapsedGroups(next);
  };

  const handleCollapseAll = () => {
    const next: { [groupId: string]: boolean } = {};
    groups.forEach((g) => (next[g.id] = true));
    setCollapsedGroups(next);
  };

  return (
    <div className="p-[14px_20px_26px] max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f2357] leading-tight m-0">
            Sản phẩm/Tính năng MB so với đối thủ
          </h1>
          <p className="text-[#667085] text-xs mt-1">
            Quản lý dữ liệu sản phẩm/tính năng của MB và các ngân hàng đối thủ. Có thể thêm, sửa, xóa, import và sắp xếp linh hoạt.
          </p>
        </div>
      </div>

      {/* Benchmark Toolbar */}
      <BenchmarkToolbar
        onOpenGroupModal={() => {
          setEditingGroup(null);
          setIsGroupModalOpen(true);
        }}
        onOpenRowModal={() => {
          setEditingComp(null);
          setIsCompModalOpen(true);
        }}
        onOpenColumnModal={() => {
          setEditingBank(null);
          setIsBankModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCsv={() => exportBenchmarkToCsv(banks, groups, components, cells)}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        autosave={autosave}
        onToggleAutosave={() => {
          setAutosave(!autosave);
          showToast(!autosave ? 'Đã bật tự động lưu' : 'Đã tắt tự động lưu');
        }}
        onReset={() => {
          if (confirm('Khôi phục dữ liệu ban đầu?')) {
            queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
            showToast('Đã làm mới dữ liệu');
          }
        }}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
          showToast('Đã lưu thay đổi vào cơ sở dữ liệu');
        }}
      />

      {/* Benchmark Grid Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#667085] font-semibold bg-white border border-[#d9e2f2] rounded-xl shadow-card">
          Đang tải dữ liệu ma trận benchmark...
        </div>
      ) : (
        <BenchmarkGrid
          banks={banks}
          groups={groups}
          components={components}
          cells={cells}
          collapsedGroups={collapsedGroups}
          onToggleCollapse={handleToggleCollapse}
          onEditBank={(bank) => {
            setEditingBank(bank);
            setIsBankModalOpen(true);
          }}
          onDeleteBank={(bank) => {
            if (bank.is_mb) {
              alert('Không thể xóa cột BIZ MBBank');
              return;
            }
            if (confirm(`Bạn có chắc muốn xóa cột ${bank.name}? Toàn bộ mô tả và điểm của ngân hàng này sẽ bị xóa.`)) {
              deleteBankMutation.mutate(bank.id);
            }
          }}
          onEditGroup={(group) => {
            setEditingGroup(group);
            setIsGroupModalOpen(true);
          }}
          onDeleteGroup={(group) => {
            const count = components.filter((c) => c.group_id === group.id).length;
            if (confirm(`Bạn có chắc muốn xóa nhóm ${group.name}? Toàn bộ ${count} hàng thuộc nhóm này sẽ bị xóa.`)) {
              deleteGroupMutation.mutate(group.id);
            }
          }}
          onEditComponent={(comp) => {
            setEditingComp(comp);
            setIsCompModalOpen(true);
          }}
          onDuplicateComponent={(comp) => duplicateCompMutation.mutate(comp.id)}
          onDeleteComponent={(comp) => {
            if (confirm(`Bạn có chắc muốn xóa cấu phần ${comp.name}?`)) {
              deleteCompMutation.mutate(comp.id);
            }
          }}
          onReorderBanks={(bankIds) => reorderBanksMutation.mutate(bankIds)}
          onReorderGroups={(groupIds) => reorderGroupsMutation.mutate(groupIds)}
          onReorderComponents={(orders) => reorderCompsMutation.mutate(orders)}
        />
      )}

      {/* Bottom Summary Bar */}
      <div className="flex items-center justify-between mt-2 text-[#667085] text-xs">
        <span>
          Hiện có <b>{components.length}</b> cấu phần benchmark trong <b>{groups.length}</b> nhóm và <b>{banks.length}</b> cột ngân hàng.
        </span>
        <span>⠿ Kéo thả Nhóm / Hàng / Cột để đổi vị trí · Điểm trống = NULL.</span>
      </div>

      {/* Modals */}
      <AddEditGroupModal
        isOpen={isGroupModalOpen}
        group={editingGroup}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={(name, side) => {
          if (editingGroup) {
            updateGroupMutation.mutate({ id: editingGroup.id, name, side });
          } else {
            createGroupMutation.mutate({ name, side });
          }
        }}
      />

      <AddEditBankModal
        isOpen={isBankModalOpen}
        bank={editingBank}
        onClose={() => {
          setIsBankModalOpen(false);
          setEditingBank(null);
        }}
        onSubmit={(name, code) => {
          if (editingBank) {
            updateBankMutation.mutate({ id: editingBank.id, name });
          } else {
            createBankMutation.mutate({ name, code });
          }
        }}
      />

      <EditComponentModal
        isOpen={isCompModalOpen}
        component={editingComp}
        groups={groups}
        banks={banks}
        cells={cells}
        onClose={() => {
          setIsCompModalOpen(false);
          setEditingComp(null);
        }}
        onSubmit={(data) => {
          saveComponentMutation.mutate({
            id: editingComp?.id,
            groupId: data.groupId,
            feature: data.feature,
            bankData: data.bankData,
          });
        }}
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={(data) => importCommitMutation.mutate(data)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-[22px] bottom-[22px] bg-[#173d8f] text-white px-3.5 py-2.5 rounded-lg shadow-lg text-xs font-semibold z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
