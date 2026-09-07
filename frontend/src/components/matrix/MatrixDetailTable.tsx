'use client';

import React, { useState } from 'react';
import { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MatrixDetailTableProps {
  banks: Bank[];
  groups: BenchmarkGroup[];
  components: BenchmarkComponent[];
  cells: BenchmarkCell[];
}

export default function MatrixDetailTable({
  banks,
  groups,
  components,
  cells,
}: MatrixDetailTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<{ [groupId: string]: boolean }>({});

  const mbBank = banks.find((b) => b.is_mb) || banks[0];
  const competitorBanks = banks.filter((b) => b.id !== mbBank?.id);

  const cellMap = new Map<string, BenchmarkCell>();
  cells.forEach((c) => {
    cellMap.set(`${c.component_id}_${c.bank_id}`, c);
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="bg-white border border-[#d9e2f2] rounded-xl p-3.5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[14px] font-bold text-[#0f2357] m-0">Ma trận chi tiết</h2>
          <small className="text-[#667085] text-xs">
            Điểm vị thế bên trái được tính tự động từ bảng ma trận năng lực này.
          </small>
        </div>
      </div>

      <div className="border border-[#d9e2f2] rounded-lg max-h-[720px] overflow-y-auto overflow-x-hidden">
        <table className="matrix-single-table w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f1f5fb] border-b border-[#d9e2f2] sticky top-0 z-10">
              <th className="p-2 text-xs font-bold text-[#1f3d7a]">Cấu phần</th>

              {banks.map((b) => (
                <th
                  key={b.id}
                  className="p-1.5 text-[10.5px] font-bold text-[#1f3d7a] text-center align-middle"
                  title={b.name}
                >
                  <div className="line-clamp-2 leading-tight">{b.name}</div>
                </th>
              ))}

              <th className="p-1.5 text-xs font-bold text-[#1f3d7a] text-center w-[50px]">TB</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => {
              const groupComps = components.filter((c) => c.group_id === group.id);
              const isCollapsed = !!collapsedGroups[group.id];

              return (
                <React.Fragment key={group.id}>
                  {/* Group Header Row */}
                  <tr
                    onClick={() => toggleGroup(group.id)}
                    className="bg-[#edf3fb] text-[#153c8a] font-extrabold text-xs cursor-pointer border-b border-[#d9e2f2] hover:bg-[#e4edfb] transition-colors select-none"
                  >
                    <td colSpan={banks.length + 2} className="p-2">
                      <div className="flex items-center gap-1.5">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{group.name}</span>
                        <span className="text-[11px] text-[#6b7ca5] font-semibold">({groupComps.length})</span>
                      </div>
                    </td>
                  </tr>

                  {/* Component Rows */}
                  {!isCollapsed &&
                    groupComps.map((comp) => {
                      const rowScores = banks.map((b) => {
                        const cell = cellMap.get(`${comp.id}_${b.id}`);
                        return cell?.score ?? null;
                      });

                      const nonNullScores = rowScores.filter((s): s is 0 | 1 | 2 | 3 => s !== null && s !== undefined);
                      const avg =
                        nonNullScores.length > 0
                          ? (nonNullScores.reduce((a: number, b: number) => a + b, 0) / nonNullScores.length).toFixed(1)
                          : '—';

                      // Find max competitor score
                      const competitorScores = competitorBanks
                        .map((b) => cellMap.get(`${comp.id}_${b.id}`)?.score)
                        .filter((s): s is 0 | 1 | 2 | 3 => s !== null && s !== undefined);
                      const maxComp = competitorScores.length > 0 ? Math.max(...competitorScores) : -Infinity;

                      return (
                        <tr
                          key={comp.id}
                          className="border-b border-[#edf1f6] hover:bg-[#fbfdff] transition-colors"
                        >
                          <td className="p-2 text-xs font-semibold text-[#203d79] align-middle">
                            {comp.name}
                          </td>

                          {banks.map((bank) => {
                            const cell = cellMap.get(`${comp.id}_${bank.id}`);
                            const score = cell?.score ?? null;
                            const isMbBehind = bank.is_mb && score !== null && score < maxComp;

                            let scoreClass = 'score ';
                            if (score === null || score === undefined) {
                              scoreClass += 's-null text-[#98a2b3]';
                            } else {
                              scoreClass += `s${score}`;
                              if (isMbBehind) scoreClass += ' mb-behind';
                            }

                            return (
                              <td key={bank.id} className="p-1 align-middle text-center">
                                <span
                                  className={scoreClass}
                                  title={cell?.description ? cell.description.slice(0, 180) : 'Chưa có mô tả'}
                                >
                                  {score === null || score === undefined ? '—' : score}
                                </span>
                              </td>
                            );
                          })}

                          <td className="p-1 text-center font-bold text-xs text-[#52637d] align-middle">
                            {avg}
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scale Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 text-xs text-[#475467]">
        <strong className="text-[#0f2357]">Thang điểm:</strong>
        <span className="flex items-center gap-1.5">
          <b className="score s0 w-6 h-5 flex items-center justify-center text-[10px]">0</b> Chưa có
        </span>
        <span className="flex items-center gap-1.5">
          <b className="score s1 w-6 h-5 flex items-center justify-center text-[10px]">1</b> Bán tự động
        </span>
        <span className="flex items-center gap-1.5">
          <b className="score s2 w-6 h-5 flex items-center justify-center text-[10px]">2</b> 100% online
        </span>
        <span className="flex items-center gap-1.5">
          <b className="score s3 w-6 h-5 flex items-center justify-center text-[10px]">3</b> Vượt trội
        </span>
        <span className="flex items-center gap-1.5">
          <b className="w-6 h-5 border border-dashed border-[#cfd7e5] rounded text-center text-[10px] text-[#98a2b3] flex items-center justify-center">
            —
          </b>{' '}
          Chưa đánh giá
        </span>
      </div>
    </div>
  );
}
