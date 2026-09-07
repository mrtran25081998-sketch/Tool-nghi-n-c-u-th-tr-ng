import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePositionSummaries, calculateGroupScores, cleanGroupName } from '../lib/scoring.ts';
import { parseCsvText, convertImportedRowsToBenchmark, normalizeColumnKey } from '../lib/excelUtils.ts';

test('Scoring: calculatePositionSummaries computes total_score, max_score, M3, and profile correctly', () => {
  const mockBanks = [
    { id: 'b-mb', org_id: 'org-1', name: 'BIZ MBBank', code: 'MB', is_mb: true, active: true, display_order: 0 },
    { id: 'b-tcb', org_id: 'org-1', name: 'Techcombank Business', code: 'TCB', is_mb: false, active: true, display_order: 1 },
    { id: 'b-ctg', org_id: 'org-1', name: 'VietinBank eFAST', code: 'CTG', is_mb: false, active: true, display_order: 2 },
  ];

  const mockGroups = [
    { id: 'g-1', org_id: 'org-1', name: 'A. ONBOARDING', display_order: 0, active: true },
    { id: 'g-2', org_id: 'org-1', name: 'B. TÍN DỤNG', display_order: 1, active: true },
  ];

  const mockComponents = [
    { id: 'c-1', org_id: 'org-1', group_id: 'g-1', name: 'Mở TK online', display_order: 0, active: true },
    { id: 'c-2', org_id: 'org-1', group_id: 'g-1', name: 'eKYC', display_order: 1, active: true },
    { id: 'c-3', org_id: 'org-1', group_id: 'g-2', name: 'Giải ngân online', display_order: 2, active: true },
  ];

  const mockCells = [
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

  const summaries = calculatePositionSummaries(mockBanks, mockComponents, mockCells);

  assert.equal(summaries.length, 3);

  const mbSummary = summaries.find((s) => s.is_mb);
  assert.equal(mbSummary?.total_score, 8);
  assert.equal(mbSummary?.max_score, 9);
  assert.equal(mbSummary?.m3_count, 2);
  assert.equal(mbSummary?.m2_count, 1);
  assert.equal(mbSummary?.null_count, 0);

  const tcbSummary = summaries.find((s) => s.code === 'TCB');
  assert.equal(tcbSummary?.total_score, 6);
  assert.equal(tcbSummary?.m3_count, 1);

  const ctgSummary = summaries.find((s) => s.code === 'CTG');
  assert.equal(ctgSummary?.total_score, 2);
  assert.equal(ctgSummary?.null_count, 1);

  assert.equal(summaries[0].code, 'MB');
  assert.equal(summaries[1].code, 'TCB');
  assert.equal(summaries[2].code, 'CTG');
});

test('Scoring: calculateGroupScores computes group average with NULL as 0', () => {
  const mockBanks = [
    { id: 'b-mb', org_id: 'org-1', name: 'BIZ MBBank', code: 'MB', is_mb: true, active: true, display_order: 0 },
    { id: 'b-ctg', org_id: 'org-1', name: 'VietinBank eFAST', code: 'CTG', is_mb: false, active: true, display_order: 2 },
  ];

  const mockGroups = [
    { id: 'g-1', org_id: 'org-1', name: 'A. ONBOARDING', display_order: 0, active: true },
  ];

  const mockComponents = [
    { id: 'c-1', org_id: 'org-1', group_id: 'g-1', name: 'Mở TK online', display_order: 0, active: true },
    { id: 'c-2', org_id: 'org-1', group_id: 'g-1', name: 'eKYC', display_order: 1, active: true },
  ];

  const mockCells = [
    { id: 'cell-1', org_id: 'org-1', component_id: 'c-1', bank_id: 'b-mb', score: 3, description: '' },
    { id: 'cell-2', org_id: 'org-1', component_id: 'c-2', bank_id: 'b-mb', score: 2, description: '' },
    { id: 'cell-3', org_id: 'org-1', component_id: 'c-1', bank_id: 'b-ctg', score: 1, description: '' },
    { id: 'cell-4', org_id: 'org-1', component_id: 'c-2', bank_id: 'b-ctg', score: null, description: '' },
  ];

  const groupScores = calculateGroupScores(mockBanks, mockGroups, mockComponents, mockCells);
  const mbG1 = groupScores.find((gs) => gs.bank_id === 'b-mb');
  assert.equal(mbG1?.group_score, 2.5);

  const ctgG1 = groupScores.find((gs) => gs.bank_id === 'b-ctg');
  assert.equal(ctgG1?.group_score, 0.5);
});

test('Excel Import: convertImportedRowsToBenchmark converts CSV rows and defaults score to NULL', () => {
  const rawRows = [
    ['Nhóm / Tính năng', 'BIZ MBBank', 'Techcombank Business'],
    ['A. ONBOARDING', ''],
    ['Mở TK online', 'Có — 3 phút', 'Có — cần xác minh'],
  ];

  const result = convertImportedRowsToBenchmark(rawRows, 'test.csv');
  assert.equal(result.bankColumns.length, 2);
  assert.equal(result.groups.length, 1);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].scores['MB'], null);
});
