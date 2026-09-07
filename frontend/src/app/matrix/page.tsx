'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PositionRankingCard from '@/components/matrix/PositionRankingCard';
import RadarComparisonCard from '@/components/matrix/RadarComparisonCard';
import MatrixDetailTable from '@/components/matrix/MatrixDetailTable';
import { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell, BankPositionSummary, GroupBankScore } from '@/types';

export default function MatrixPage() {
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
  const positionSummaries: BankPositionSummary[] = matrixData?.data?.positionSummaries || [];
  const groupScores: GroupBankScore[] = matrixData?.data?.groupScores || [];

  return (
    <div className="p-[14px_20px_26px] max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f2357] leading-tight m-0">
            Ma trận chấm điểm MB so với đối thủ
          </h1>
          <p className="text-[#667085] text-xs mt-1">
            Ma trận được tính toán và đồng bộ trực tiếp từ dữ liệu Sản phẩm/Tính năng MB so với đối thủ.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#667085] font-semibold bg-white border border-[#d9e2f2] rounded-xl shadow-card">
          Đang tổng hợp điểm và ma trận vị thế...
        </div>
      ) : (
        /* Workspace Grid: Left Stack (36-40%) + Right Matrix (60-64%) */
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(460px,38%)_minmax(0,62%)] gap-3.5 items-start">
          {/* Left Stack */}
          <div className="flex flex-col gap-3.5 min-w-0">
            <PositionRankingCard
              summaries={positionSummaries}
              totalComponents={components.length}
            />

            <RadarComparisonCard
              banks={banks}
              groups={groups}
              groupScores={groupScores}
            />
          </div>

          {/* Right Matrix Table */}
          <div className="min-w-0">
            <MatrixDetailTable
              banks={banks}
              groups={groups}
              components={components}
              cells={cells}
            />
          </div>
        </div>
      )}
    </div>
  );
}
