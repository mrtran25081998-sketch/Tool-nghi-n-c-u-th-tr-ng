import { calculatePositionSummaries, calculateGroupScores, cleanGroupName } from '../lib/scoring';
import { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell } from '../types';

describe('Scoring Rules and Formulas Test Suite', () => {
  const mockBanks: Bank[] = [
    { id: 'b-mb', org_id: 'org-1', name: 'BIZ MBBank', code: 'MB', is_mb: true, active: true, display_order: 0 },
    { id: 'b-tcb', org_id: 'org-1', name: 'Techcombank Business', code: 'TCB', is_mb: false, active: true, display_order: 1 },
    { id: 'b-ctg', org_id: 'org-1', name: 'VietinBank eFAST', code: 'CTG', is_mb: false, active: true, display_order: 2 },
  ];

  const mockGroups: BenchmarkGroup[] = [
    { id: 'g-1', org_id: 'org-1', name: 'A. ONBOARDING', display_order: 0, active: true },
    { id: 'g-2', org_id: 'org-1', name: 'B. TÍN DỤNG', display_order: 1, active: true },
  ];

  const mockComponents: BenchmarkComponent[] = [
    { id: 'c-1', org_id: 'org-1', group_id: 'g-1', name: 'Mở TK online', display_order: 0, active: true },
    { id: 'c-2', org_id: 'org-1', group_id: 'g-1', name: 'eKYC', display_order: 1, active: true },
    { id: 'c-3', org_id: 'org-1', group_id: 'g-2', name: 'Giải ngân online', display_order: 2, active: true },
  ];

  const mockCells: BenchmarkCell[] = [
    // MB scores: 3, 2, 3 -> Total = 8, M3 = 2
    { id: 'cell-1', org_id: 'org-1', component_id: 'c-1', bank_id: 'b-mb', score: 3, description: '' },
    { id: 'cell-2', org_id: 'org-1', component_id: 'c-2', bank_id: 'b-mb', score: 2, description: '' },
    { id: 'cell-3', org_id: 'org-1', component_id: 'c-3', bank_id: 'b-mb', score: 3, description: '' },

    // TCB scores: 1, 3, 2 -> Total = 6, M3 = 1
    { id: 'cell-4', org_id: 'org-1', component_id: 'c-1', bank_id: 'b-tcb', score: 1, description: '' },
    { id: 'cell-5', org_id: 'org-1', component_id: 'c-2', bank_id: 'b-tcb', score: 3, description: '' },
    { id: 'cell-6', org_id: 'org-1', component_id: 'c-3', bank_id: 'b-tcb', score: 2, description: '' },

    // CTG scores: 1, null, 1 -> Total = 2, M3 = 0, null = 1
    { id: 'cell-7', org_id: 'org-1', component_id: 'c-1', bank_id: 'b-ctg', score: 1, description: '' },
    { id: 'cell-8', org_id: 'org-1', component_id: 'c-2', bank_id: 'b-ctg', score: null, description: '' },
    { id: 'cell-9', org_id: 'org-1', component_id: 'c-3', bank_id: 'b-ctg', score: 1, description: '' },
  ];

  test('calculatePositionSummaries computes total_score, max_score, M3, and profile correctly', () => {
    const summaries = calculatePositionSummaries(mockBanks, mockComponents, mockCells);

    expect(summaries).toHaveLength(3);

    // MB should be top rank
    const mbSummary = summaries.find((s) => s.is_mb);
    expect(mbSummary).toBeDefined();
    expect(mbSummary?.total_score).toBe(8);
    expect(mbSummary?.max_score).toBe(9); // 3 components * 3
    expect(mbSummary?.m3_count).toBe(2);
    expect(mbSummary?.m2_count).toBe(1);
    expect(mbSummary?.null_count).toBe(0);

    // TCB
    const tcbSummary = summaries.find((s) => s.code === 'TCB');
    expect(tcbSummary?.total_score).toBe(6);
    expect(tcbSummary?.m3_count).toBe(1);

    // CTG
    const ctgSummary = summaries.find((s) => s.code === 'CTG');
    expect(ctgSummary?.total_score).toBe(2);
    expect(ctgSummary?.null_count).toBe(1);

    // Ranking order: MB (8) > TCB (6) > CTG (2)
    expect(summaries[0].code).toBe('MB');
    expect(summaries[1].code).toBe('TCB');
    expect(summaries[2].code).toBe('CTG');
  });

  test('calculateGroupScores calculates group averages accurately (NULL treated as 0 in group sum)', () => {
    const groupScores = calculateGroupScores(mockBanks, mockGroups, mockComponents, mockCells);

    // Group 1 has 2 components (c-1, c-2)
    // MB in Group 1: (3 + 2) / 2 = 2.5
    const mbG1 = groupScores.find((gs) => gs.group_id === 'g-1' && gs.bank_id === 'b-mb');
    expect(mbG1?.group_score).toBe(2.5);

    // CTG in Group 1: (1 + 0) / 2 = 0.5
    const ctgG1 = groupScores.find((gs) => gs.group_id === 'g-1' && gs.bank_id === 'b-ctg');
    expect(ctgG1?.group_score).toBe(0.5);
  });

  test('cleanGroupName removes leading letter prefixes cleanly', () => {
    expect(cleanGroupName('A. ONBOARDING')).toBe('ONBOARDING');
    expect(cleanGroupName('B. TÀI KHOẢN & THANH TOÁN')).toBe('TÀI KHOẢN & THANH TOÁN');
    expect(cleanGroupName('TIỀN GỬI VÀ ĐẦU TƯ')).toBe('TIỀN GỬI VÀ ĐẦU TƯ');
  });
});
