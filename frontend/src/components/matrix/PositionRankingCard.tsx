'use client';

import React from 'react';
import { BankPositionSummary } from '@/types';

interface PositionRankingCardProps {
  summaries: BankPositionSummary[];
  totalComponents: number;
}

export default function PositionRankingCard({
  summaries,
  totalComponents,
}: PositionRankingCardProps) {
  const compCount = Math.max(1, totalComponents);

  const renderProfileSegment = (count: number, className: string, label: string) => {
    if (!count) return null;
    const width = Math.max(30, (count / compCount) * 190);
    return (
      <span
        className={`profile-segment ${className}`}
        style={{ width: `${width}px` }}
        title={`${label}: ${count}`}
      >
        {count}
      </span>
    );
  };

  return (
    <div className="bg-white border border-[#d9e2f2] rounded-xl p-4 shadow-card">
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <h2 className="text-[14px] font-bold text-[#152c63] m-0">Xếp hạng vị thế nền tảng</h2>
          <small className="block text-[#667085] text-[11px] mt-0.5">
            Điểm được tính trực tiếp từ toàn bộ cấu phần trong Ma trận chấm điểm.
          </small>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#e8edf5]">
              <th className="py-1.5 px-2 text-[#7b879e] font-semibold text-[10px] w-7">#</th>
              <th className="py-1.5 px-2 text-[#7b879e] font-semibold text-[10px] min-w-[120px]">Nền tảng</th>
              <th className="py-1.5 px-2 text-[#7b879e] font-semibold text-[10px] min-w-[70px]">Điểm</th>
              <th className="py-1.5 px-2 text-[#7b879e] font-semibold text-[10px] min-w-[210px]">Chân dung điểm</th>
              <th className="py-1.5 px-2 text-[#7b879e] font-semibold text-[10px] text-center w-9">M3</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((item, index) => {
              const isMB = item.is_mb;
              return (
                <tr
                  key={item.bank_id}
                  className={`border-b border-[#edf1f6] transition-colors ${
                    isMB ? 'bg-[#fff1f2] font-semibold' : 'hover:bg-[#fbfdff]'
                  }`}
                >
                  <td className="py-2 px-2 text-[#667085]">{index + 1}</td>
                  <td
                    className={`py-2 px-2 font-semibold truncate ${
                      isMB ? 'text-[#ff4d57]' : 'text-[#51617f]'
                    }`}
                    title={item.bank_name}
                  >
                    {item.bank_name}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span
                      className={`text-sm font-extrabold ${
                        isMB ? 'text-[#ff4d57]' : 'text-[#365de8]'
                      }`}
                    >
                      {item.total_score}
                    </span>
                    <small className="text-[#91a0bb] text-[10px] font-bold ml-0.5">
                      /{item.max_score}
                    </small>
                  </td>
                  <td className="py-2 px-2">
                    <div className="position-profile">
                      {renderProfileSegment(item.m3_count, 'p3', 'Điểm 3')}
                      {renderProfileSegment(item.m2_count, 'p2', 'Điểm 2')}
                      {renderProfileSegment(item.m1_count, 'p1', 'Điểm 1')}
                      {renderProfileSegment(item.m0_count, 'p0', 'Điểm 0')}
                      {renderProfileSegment(item.null_count, 'pn', 'Chưa đánh giá')}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-[#08724d] font-extrabold text-[13px]">
                    {item.m3_count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-[#edf1f6] text-[#667085] text-[10.5px]">
        <span className="flex items-center">
          <i className="profile-dot p3" /> Điểm 3
        </span>
        <span className="flex items-center">
          <i className="profile-dot p2" /> Điểm 2
        </span>
        <span className="flex items-center">
          <i className="profile-dot p1" /> Điểm 1
        </span>
        <span className="flex items-center">
          <i className="profile-dot p0" /> Điểm 0
        </span>
        <span className="flex items-center">
          <i className="profile-dot pn" /> Chưa đánh giá
        </span>
      </div>
    </div>
  );
}
