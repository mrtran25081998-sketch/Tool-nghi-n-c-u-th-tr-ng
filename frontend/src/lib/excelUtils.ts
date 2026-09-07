import type { Bank, BenchmarkGroup, BenchmarkComponent, BenchmarkCell, ScoreValue } from '../types/index.ts';

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        quoted = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else if (ch !== '\r') {
        cell += ch;
      }
    }
  }

  row.push(cell);
  if (row.some((v) => String(v).trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

export function normalizeColumnKey(value: string): string {
  return String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 12);
}

export function importedBankKey(header: string, usedKeys: Set<string>): string {
  const upper = normalizeColumnKey(header);
  let preferred: string;

  if (/MBBANK|BIZ_MB|BIZMBBANK|^MB$/.test(upper)) preferred = 'MB';
  else if (/TECHCOMBANK|TCB/.test(upper)) preferred = 'TCB';
  else if (/VIETINBANK|EFAST|CTG/.test(upper)) preferred = 'CTG';
  else if (/BIDV/.test(upper)) preferred = 'BIDV';
  else if (/VPBANK|NEOBIZ|VPB/.test(upper)) preferred = 'VPB';
  else if (/VIETCOMBANK|VCB/.test(upper)) preferred = 'VCB';
  else preferred = upper || 'BANK';

  let key = preferred;
  let n = 2;
  while (usedKeys.has(key)) {
    key = `${preferred}_${n++}`;
  }
  usedKeys.add(key);
  return key;
}

export interface ParsedImportData {
  fileName: string;
  bankColumns: { name: string; code: string; isMB: boolean }[];
  groups: string[];
  rows: {
    group: string;
    feature: string;
    values: Record<string, string>;
    scores: Record<string, ScoreValue>;
  }[];
}

export function convertImportedRowsToBenchmark(rows: string[][], fileName: string): ParsedImportData {
  const cleaned = (rows || [])
    .map((r) => (r || []).map((v) => (v === null || v === undefined ? '' : String(v).trim())))
    .filter((r) => r.some((v) => v !== ''));

  if (cleaned.length < 2) {
    throw new Error('File không có đủ dữ liệu để import');
  }

  let headerIndex = cleaned.findIndex((r) => {
    const first = (r[0] || '').toLowerCase();
    return first.includes('nhóm') || first.includes('tính năng') || first.includes('cấu phần') || first.includes('group') || first.includes('feature');
  });
  if (headerIndex < 0) headerIndex = 0;

  const header = cleaned[headerIndex];
  const bankHeaders = header.slice(1).filter(Boolean);

  if (!bankHeaders.length) {
    throw new Error('Không tìm thấy các cột ngân hàng trong header');
  }

  const usedKeys = new Set<string>();
  const importedColumns = bankHeaders.map((name) => {
    const code = importedBankKey(name, usedKeys);
    return {
      name,
      code,
      isMB: code === 'MB',
    };
  });

  const body = cleaned.slice(headerIndex + 1);
  const importedRows: {
    group: string;
    feature: string;
    values: Record<string, string>;
    scores: Record<string, ScoreValue>;
  }[] = [];

  let currentGroup = '';
  const discoveredGroups: string[] = [];

  for (const row of body) {
    const first = (row[0] || '').trim();
    if (!first) continue;

    const bankValues = bankHeaders.map((_, i) => (row[i + 1] || '').trim());
    const nonEmptyBanks = bankValues.filter(Boolean).length;

    // A row with only the first cell populated is treated as a group heading
    if (nonEmptyBanks === 0) {
      currentGroup = first;
      if (!discoveredGroups.includes(currentGroup)) {
        discoveredGroups.push(currentGroup);
      }
      continue;
    }

    if (!currentGroup) {
      currentGroup = 'DỮ LIỆU IMPORT';
      if (!discoveredGroups.includes(currentGroup)) {
        discoveredGroups.push(currentGroup);
      }
    }

    const values: Record<string, string> = {};
    const scores: Record<string, ScoreValue> = {};

    importedColumns.forEach((col, i) => {
      values[col.code] = bankValues[i] || '';
      scores[col.code] = null; // score default NULL
    });

    importedRows.push({
      group: currentGroup,
      feature: first,
      values,
      scores,
    });
  }

  if (!importedRows.length) {
    throw new Error('Không tìm thấy hàng cấu phần có dữ liệu ngân hàng');
  }

  return {
    fileName,
    bankColumns: importedColumns,
    groups: discoveredGroups,
    rows: importedRows,
  };
}

export function exportBenchmarkToCsv(
  banks: Bank[],
  groups: BenchmarkGroup[],
  components: BenchmarkComponent[],
  cells: BenchmarkCell[]
): void {
  const cellMap = new Map<string, BenchmarkCell>();
  for (const cell of cells) {
    cellMap.set(`${cell.component_id}_${cell.bank_id}`, cell);
  }

  const groupMap = new Map<string, BenchmarkGroup>();
  for (const group of groups) {
    groupMap.set(group.id, group);
  }

  const activeBanks = [...banks].filter((b) => b.active).sort((a, b) => a.display_order - b.display_order);
  const activeComponents = [...components].filter((c) => c.active).sort((a, b) => a.display_order - b.display_order);

  const header = ['Nhóm / Journey', 'Tính năng / Cấu phần', ...activeBanks.map((b) => b.name)];
  const rows: string[][] = [header];

  for (const comp of activeComponents) {
    const group = groupMap.get(comp.group_id);
    const row = [
      group ? group.name : '',
      comp.name,
      ...activeBanks.map((b) => {
        const cell = cellMap.get(`${comp.id}_${b.id}`);
        return cell ? cell.description : '';
      }),
    ];
    rows.push(row);
  }

  const csvContent = rows
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `MB_Benchmark_Export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
