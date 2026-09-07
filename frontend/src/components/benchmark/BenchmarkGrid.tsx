'use client';

import React, { useState } from 'react';
import { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell } from '@/types';
import BankHeader from './BankHeader';
import BenchmarkGroupRow from './BenchmarkGroupRow';
import BenchmarkComponentRow from './BenchmarkComponentRow';

interface BenchmarkGridProps {
  banks: Bank[];
  groups: BenchmarkGroup[];
  components: BenchmarkComponent[];
  cells: BenchmarkCell[];
  collapsedGroups: { [groupId: string]: boolean };
  onToggleCollapse: (groupId: string) => void;
  onEditBank: (bank: Bank) => void;
  onDeleteBank: (bank: Bank) => void;
  onEditGroup: (group: BenchmarkGroup) => void;
  onDeleteGroup: (group: BenchmarkGroup) => void;
  onEditComponent: (component: BenchmarkComponent) => void;
  onDuplicateComponent: (component: BenchmarkComponent) => void;
  onDeleteComponent: (component: BenchmarkComponent) => void;
  onReorderBanks: (bankIds: string[]) => void;
  onReorderGroups: (groupIds: string[]) => void;
  onReorderComponents: (orders: { id: string; group_id: string; display_order: number }[]) => void;
}

type DragPayload =
  | { type: 'column'; index: number; bankId: string }
  | { type: 'group'; index: number; groupId: string }
  | { type: 'row'; index: number; componentId: string; groupId: string };

export default function BenchmarkGrid({
  banks,
  groups,
  components,
  cells,
  collapsedGroups,
  onToggleCollapse,
  onEditBank,
  onDeleteBank,
  onEditGroup,
  onDeleteGroup,
  onEditComponent,
  onDuplicateComponent,
  onDeleteComponent,
  onReorderBanks,
  onReorderGroups,
  onReorderComponents,
}: BenchmarkGridProps) {
  const [dragState, setDragState] = useState<DragPayload | null>(null);

  const colSpan = banks.length + 2;

  // --- Drag handlers for columns ---
  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    const payload: DragPayload = { type: 'column', index, bankId: banks[index].id };
    setDragState(payload);
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
  };

  const handleColumnDragOver = (e: React.DragEvent, targetIndex: number) => {
    if (!dragState || dragState.type !== 'column') return;
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
  };

  const handleColumnDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!dragState || dragState.type !== 'column') {
      setDragState(null);
      return;
    }

    const fromIndex = dragState.index;
    if (fromIndex === targetIndex) {
      setDragState(null);
      return;
    }

    const next = [...banks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);

    onReorderBanks(next.map((b) => b.id));
    setDragState(null);
  };

  // --- Drag handlers for groups ---
  const handleGroupDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    const payload: DragPayload = { type: 'group', index, groupId: groups[index].id };
    setDragState(payload);
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
  };

  const handleGroupDragOver = (e: React.DragEvent, targetIndex: number) => {
    if (!dragState) return;
    if (dragState.type !== 'group' && dragState.type !== 'row') return;
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
  };

  const handleGroupDrop = (e: React.DragEvent, targetGroupIndex: number) => {
    e.preventDefault();
    if (!dragState) return;

    if (dragState.type === 'group') {
      const fromIndex = dragState.index;
      if (fromIndex === targetGroupIndex) {
        setDragState(null);
        return;
      }
      const next = [...groups];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(targetGroupIndex, 0, moved);
      onReorderGroups(next.map((g) => g.id));
    } else if (dragState.type === 'row') {
      // Move component into this target group
      const targetGroup = groups[targetGroupIndex];
      const comp = components.find((c) => c.id === dragState.componentId);
      if (comp && targetGroup) {
        const otherComps = components.filter((c) => c.id !== comp.id);
        const groupComps = otherComps.filter((c) => c.group_id === targetGroup.id);
        const nextOrders = otherComps.map((c, idx) => ({ id: c.id, group_id: c.group_id, display_order: idx }));

        nextOrders.push({
          id: comp.id,
          group_id: targetGroup.id,
          display_order: groupComps.length,
        });

        onReorderComponents(nextOrders);
      }
    }
    setDragState(null);
  };

  // --- Drag handlers for rows ---
  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    const comp = components[index];
    const payload: DragPayload = { type: 'row', index, componentId: comp.id, groupId: comp.group_id };
    setDragState(payload);
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
  };

  const handleRowDragOver = (e: React.DragEvent, targetIndex: number) => {
    if (!dragState || dragState.type !== 'row') return;
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
  };

  const handleRowDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!dragState || dragState.type !== 'row') {
      setDragState(null);
      return;
    }

    const fromIndex = dragState.index;
    if (fromIndex === targetIndex) {
      setDragState(null);
      return;
    }

    const movingComp = components[fromIndex];
    const targetComp = components[targetIndex];

    const next = [...components];
    const [moved] = next.splice(fromIndex, 1);
    moved.group_id = targetComp.group_id; // Inherit target group
    next.splice(targetIndex, 0, moved);

    const orders = next.map((c, idx) => ({
      id: c.id,
      group_id: c.group_id,
      display_order: idx,
    }));

    onReorderComponents(orders);
    setDragState(null);
  };

  return (
    <div className="bg-white border border-[#d9e2f2] rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto relative">
        <table className="benchmark-table w-full text-left">
          <thead>
            <tr className="bg-[#f1f5fb] border-b border-[#d9e2f2]">
              {/* Sticky Left: Nhóm / Tính năng */}
              <th className="p-2.5 text-xs font-bold text-[#1f3d7a] min-w-[200px] align-middle">
                Nhóm / Tính năng
              </th>

              {/* Dynamic Bank Columns */}
              {banks.map((bank, idx) => (
                <BankHeader
                  key={bank.id}
                  bank={bank}
                  index={idx}
                  onEdit={() => onEditBank(bank)}
                  onDelete={() => onDeleteBank(bank)}
                  onDragStart={handleColumnDragStart}
                  onDragOver={handleColumnDragOver}
                  onDrop={handleColumnDrop}
                />
              ))}

              {/* Sticky Right: Thao tác */}
              <th className="p-2.5 text-xs font-bold text-[#1f3d7a] text-center w-[72px] align-middle">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {groups.map((group, groupIdx) => {
              const groupComps = components.filter((c) => c.group_id === group.id);
              const isCollapsed = !!collapsedGroups[group.id];

              return (
                <React.Fragment key={group.id}>
                  {/* Group Row */}
                  <BenchmarkGroupRow
                    group={group}
                    index={groupIdx}
                    colSpan={colSpan}
                    componentCount={groupComps.length}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => onToggleCollapse(group.id)}
                    onEdit={() => onEditGroup(group)}
                    onDelete={() => onDeleteGroup(group)}
                    onDragStart={handleGroupDragStart}
                    onDragOver={handleGroupDragOver}
                    onDrop={handleGroupDrop}
                  />

                  {/* Component Rows */}
                  {!isCollapsed &&
                    groupComps.map((comp) => {
                      const globalCompIdx = components.indexOf(comp);
                      return (
                        <BenchmarkComponentRow
                          key={comp.id}
                          component={comp}
                          index={globalCompIdx}
                          banks={banks}
                          cells={cells}
                          onEdit={() => onEditComponent(comp)}
                          onDuplicate={() => onDuplicateComponent(comp)}
                          onDelete={() => onDeleteComponent(comp)}
                          onDragStart={handleRowDragStart}
                          onDragOver={handleRowDragOver}
                          onDrop={handleRowDrop}
                        />
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
