import type { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell, BankPositionSummary, GroupBankScore } from '@/types';

export function calculatePositionSummaries(
  banks: Bank[],
  components: BenchmarkComponent[],
  cells: BenchmarkCell[]
): BankPositionSummary[] {
  const activeComponents = components.filter((c) => c.active);
  const activeCompIds = new Set(activeComponents.map((c) => c.id));
  const activeBanks = banks.filter((b) => b.active);
  const maxScore = activeComponents.length * 3;

  // Map cells by `${component_id}_${bank_id}`
  const cellMap = new Map<string, BenchmarkCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.component_id}_${cell.bank_id}`, cell);
  }

  const summaries: BankPositionSummary[] = activeBanks.map((bank) => {
    let totalScore = 0;
    let m3 = 0;
    let m2 = 0;
    let m1 = 0;
    let m0 = 0;
    let mNull = 0;

    for (const comp of activeComponents) {
      const cell = cellMap.get(`${comp.id}_${bank.id}`);
      const score = cell ? cell.score : null;

      if (score === null || score === undefined) {
        mNull++;
      } else if (score === 3) {
        m3++;
        totalScore += 3;
      } else if (score === 2) {
        m2++;
        totalScore += 2;
      } else if (score === 1) {
        m1++;
        totalScore += 1;
      } else if (score === 0) {
        m0++;
      }
    }

    return {
      org_id: bank.org_id,
      bank_id: bank.id,
      bank_name: bank.name,
      code: bank.code,
      is_mb: bank.is_mb,
      component_count: activeComponents.length,
      total_score: totalScore,
      max_score: maxScore,
      m3_count: m3,
      m2_count: m2,
      m1_count: m1,
      m0_count: m0,
      null_count: mNull,
    };
  });

  // Ranking: total DESC, M3 DESC, MB first, name ASC
  return summaries.sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    if (b.m3_count !== a.m3_count) return b.m3_count - a.m3_count;
    if (a.is_mb !== b.is_mb) return a.is_mb ? -1 : 1;
    return a.bank_name.localeCompare(b.bank_name);
  });
}

export function calculateGroupScores(
  banks: Bank[],
  groups: BenchmarkGroup[],
  components: BenchmarkComponent[],
  cells: BenchmarkCell[]
): GroupBankScore[] {
  const activeBanks = banks.filter((b) => b.active);
  const activeGroups = groups.filter((g) => g.active);
  const activeComponents = components.filter((c) => c.active);

  const cellMap = new Map<string, BenchmarkCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.component_id}_${cell.bank_id}`, cell);
  }

  const result: GroupBankScore[] = [];

  for (const group of activeGroups) {
    const groupComps = activeComponents.filter((c) => c.group_id === group.id);
    const compCount = groupComps.length;

    for (const bank of activeBanks) {
      if (compCount === 0) {
        result.push({
          org_id: group.org_id,
          group_id: group.id,
          group_name: group.name,
          bank_id: bank.id,
          bank_name: bank.name,
          group_score: 0,
        });
        continue;
      }

      let sumScore = 0;
      for (const comp of groupComps) {
        const cell = cellMap.get(`${comp.id}_${bank.id}`);
        const score = cell?.score ?? 0;
        sumScore += Number(score) || 0;
      }

      const avg = sumScore / compCount;
      result.push({
        org_id: group.org_id,
        group_id: group.id,
        group_name: group.name,
        bank_id: bank.id,
        bank_name: bank.name,
        group_score: avg,
      });
    }
  }

  return result;
}

export function cleanGroupName(name: string): string {
  return String(name || '').replace(/^[A-Z]\.\s*/, '').trim();
}
