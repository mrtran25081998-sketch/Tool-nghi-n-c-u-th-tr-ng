'use client';

import React, { useState, useMemo } from 'react';
import { Bank, BenchmarkGroup, GroupBankScore } from '@/types';
import { cleanGroupName } from '@/lib/scoring';

interface RadarComparisonCardProps {
  banks: Bank[];
  groups: BenchmarkGroup[];
  groupScores: GroupBankScore[];
}

const RADAR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#0ea5e9', // cyan
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate
];

export default function RadarComparisonCard({
  banks,
  groups,
  groupScores,
}: RadarComparisonCardProps) {
  const mbBank = banks.find((b) => b.is_mb) || banks[0];
  const competitors = banks.filter((b) => b.id !== mbBank?.id);

  // Default to selecting top 3 competitors
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>(() =>
    competitors.slice(0, 3).map((b) => b.id)
  );
  const [showLeader, setShowLeader] = useState(false);

  // Tooltip state
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    groupIndex: number;
    seriesId?: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    groupIndex: 0,
  });

  const toggleCompetitor = (id: string) => {
    if (selectedCompetitorIds.includes(id)) {
      setSelectedCompetitorIds(selectedCompetitorIds.filter((item) => item !== id));
    } else {
      if (selectedCompetitorIds.length >= 3) {
        alert('Radar hiển thị tối đa 3 đối thủ cùng lúc để dễ quan sát');
        return;
      }
      setSelectedCompetitorIds([...selectedCompetitorIds, id]);
    }
  };

  const getBankColor = (bankId: string) => {
    if (bankId === mbBank?.id) return '#ff626b';
    const idx = competitors.findIndex((b) => b.id === bankId);
    return RADAR_PALETTE[Math.max(0, idx) % RADAR_PALETTE.length];
  };

  const activeBanks = useMemo(() => {
    const list: Bank[] = [];
    if (mbBank) list.push(mbBank);
    competitors.forEach((b) => {
      if (selectedCompetitorIds.includes(b.id)) {
        list.push(b);
      }
    });
    return list;
  }, [mbBank, competitors, selectedCompetitorIds]);

  // Calculations for Radar geometry
  const numGroups = groups.length;
  const width = 560;
  const height = 330;
  const cx = 280;
  const cy = 168;
  const radius = 92;
  const labelRadius = 139;

  const polarPoint = (r: number, angle: number) => {
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  const polygonPoints = (values: number[], maxR: number, maxVal = 3) => {
    return values
      .map((v, i) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / numGroups;
        const p = polarPoint(maxR * (v / maxVal), angle);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Group score values matrix
  const seriesData = useMemo(() => {
    return activeBanks.map((bank) => {
      const values = groups.map((g) => {
        const item = groupScores.find((gs) => gs.group_id === g.id && gs.bank_id === bank.id);
        return item ? item.group_score : 0;
      });
      return {
        bank,
        color: getBankColor(bank.id),
        isMB: bank.id === mbBank?.id,
        values,
      };
    });
  }, [activeBanks, groups, groupScores, mbBank]);

  // Leader scores per group
  const leaderDetails = useMemo(() => {
    return groups.map((g) => {
      const scoresForGroup = banks.map((b) => {
        const item = groupScores.find((gs) => gs.group_id === g.id && gs.bank_id === b.id);
        return { bankName: b.name, score: item ? item.group_score : 0 };
      });
      const maxVal = Math.max(0, ...scoresForGroup.map((s) => s.score));
      const leaders = scoresForGroup.filter((s) => Math.abs(s.score - maxVal) < 0.0001);
      return {
        value: maxVal,
        bankNames: leaders.map((l) => l.bankName),
      };
    });
  }, [groups, banks, groupScores]);

  if (numGroups < 3) {
    return (
      <div className="bg-white border border-[#d9e2f2] rounded-xl p-4 shadow-card">
        <h2 className="text-[14px] font-bold text-[#152c63] mb-1">So sánh vị thế theo từng nhóm</h2>
        <div className="text-xs text-[#98a2b3] py-8 text-center">Cần tối thiểu 3 nhóm để hiển thị biểu đồ Radar.</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#d9e2f2] rounded-xl p-4 shadow-card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-[14px] font-bold text-[#152c63] m-0">So sánh vị thế theo từng nhóm</h2>
          <small className="block text-[#667085] text-[11px] mt-0.5">
            MB luôn hiển thị. Chọn tối đa 3 đối thủ để so sánh trực tiếp trên radar.
          </small>
        </div>
      </div>

      {/* Competitor Chips Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#f9fbff] border border-[#e1e8f3] rounded-lg mb-2">
        {mbBank && (
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-[#ffc7cb] bg-[#fff2f3] text-[#d83d48] text-[11px] font-bold select-none">
            <span className="w-2 h-2 rounded-full bg-[#ff626b]" />
            {mbBank.name}
          </span>
        )}

        {competitors.map((bank) => {
          const isActive = selectedCompetitorIds.includes(bank.id);
          const color = getBankColor(bank.id);
          return (
            <button
              key={bank.id}
              type="button"
              onClick={() => toggleCompetitor(bank.id)}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer select-none ${
                isActive
                  ? 'border-[#7396ea] bg-[#edf3ff] text-[#234a9a]'
                  : 'border-[#d4deed] bg-white text-[#5c6980] hover:bg-[#f4f7ff]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{bank.name}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowLeader(!showLeader)}
          className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-dashed text-[11px] font-semibold transition-colors cursor-pointer select-none ${
            showLeader
              ? 'border-[#667eea] bg-[#f0f3ff] text-[#334ea8]'
              : 'border-[#d4deed] bg-white text-[#667085] hover:bg-[#f4f7ff]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#667eea]" />
          <span>Dẫn đầu nhóm</span>
        </button>

        <span className="ml-auto text-[10px] text-[#98a2b3] font-medium">
          {selectedCompetitorIds.length}/3 đối thủ
        </span>
      </div>

      {/* Radar SVG Container */}
      <div
        className="relative w-full h-[340px] flex items-center justify-center overflow-visible"
        onMouseLeave={() => setTooltipState((prev) => ({ ...prev, visible: false }))}
      >
        <svg
          className="position-radar-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Radar so sánh vị thế các nền tảng theo từng nhóm"
        >
          {/* Level Grids (Levels 1, 2, 3) */}
          {[1, 2, 3].map((lvl) => (
            <polygon
              key={`grid-${lvl}`}
              className="radar-grid-line"
              points={polygonPoints(Array(numGroups).fill(lvl), radius, 3)}
            />
          ))}

          {/* Axes */}
          {groups.map((g, i) => {
            const angle = -Math.PI / 2 + (Math.PI * 2 * i) / numGroups;
            const p = polarPoint(radius, angle);
            return (
              <line
                key={`axis-${g.id}`}
                className="radar-axis"
                x1={cx}
                y1={cy}
                x2={p.x.toFixed(1)}
                y2={p.y.toFixed(1)}
              />
            );
          })}

          {/* Leader Overlay Dashed Line */}
          {showLeader && (
            <polygon
              className="radar-leader-dash"
              points={polygonPoints(
                leaderDetails.map((d) => d.value),
                radius,
                3
              )}
            />
          )}

          {/* Series Areas and Lines */}
          {seriesData.map((s) => {
            const pts = polygonPoints(s.values, radius, 3);
            return (
              <React.Fragment key={`series-${s.bank.id}`}>
                <polygon
                  points={pts}
                  fill={s.isMB ? 'rgba(255,98,107,0.12)' : 'none'}
                  stroke={s.color}
                  strokeWidth={s.isMB ? 2.4 : 2}
                  strokeLinejoin="round"
                  opacity={s.isMB ? 1 : 0.9}
                />

                {/* Data Points */}
                {s.values.map((val, i) => {
                  const angle = -Math.PI / 2 + (Math.PI * 2 * i) / numGroups;
                  const p = polarPoint(radius * (val / 3), angle);
                  return (
                    <circle
                      key={`pt-${s.bank.id}-${i}`}
                      cx={p.x.toFixed(1)}
                      cy={p.y.toFixed(1)}
                      r={s.isMB ? 4.5 : 3.8}
                      fill={s.color}
                      stroke="#fff"
                      strokeWidth={1.2}
                      className="radar-series-point"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipState({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10,
                          groupIndex: i,
                          seriesId: s.bank.id,
                        });
                      }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Group Labels */}
          {groups.map((g, i) => {
            const label = cleanGroupName(g.name);
            const angle = -Math.PI / 2 + (Math.PI * 2 * i) / numGroups;
            const p = polarPoint(labelRadius, angle);

            let anchor: 'start' | 'end' | 'middle' = 'middle';
            const cos = Math.cos(angle);
            if (cos > 0.3) anchor = 'start';
            else if (cos < -0.3) anchor = 'end';

            return (
              <text
                key={`lbl-${g.id}`}
                x={p.x.toFixed(1)}
                y={p.y.toFixed(1)}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="radar-label"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipState({
                    visible: true,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                    groupIndex: i,
                  });
                }}
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {tooltipState.visible && (
          <div
            className="absolute z-50 pointer-events-none p-2.5 bg-white border border-[#d6e0ef] rounded-lg shadow-dropdown text-[11px] text-[#344054] min-w-[180px] max-w-[240px] animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="font-extrabold text-[#173d8f] mb-1.5 pb-1 border-b border-[#edf1f6]">
              {cleanGroupName(groups[tooltipState.groupIndex]?.name)}
            </div>

            <div className="space-y-1">
              {seriesData.map((s) => {
                const score = s.values[tooltipState.groupIndex];
                const isActive = tooltipState.seriesId === s.bank.id;
                return (
                  <div
                    key={s.bank.id}
                    className={`flex items-center justify-between gap-3 px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-[#f2f6ff] font-bold' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="truncate">{s.bank.name}</span>
                    </span>
                    <b className="text-[#172b5b]">{score.toFixed(2)}</b>
                  </div>
                );
              })}

              {showLeader && (
                <div className="flex items-center justify-between gap-3 px-1.5 py-0.5 rounded text-[#667eea]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#667eea]" />
                    <span>Dẫn đầu nhóm</span>
                  </span>
                  <b>{leaderDetails[tooltipState.groupIndex]?.value.toFixed(2)}</b>
                </div>
              )}
            </div>

            {showLeader && (
              <div className="mt-1.5 pt-1 border-t border-[#edf1f6] text-[9.5px] text-[#7b879e]">
                Dẫn đầu: {leaderDetails[tooltipState.groupIndex]?.bankNames.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
