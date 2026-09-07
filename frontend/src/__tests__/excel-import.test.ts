import { parseCsvText, convertImportedRowsToBenchmark, normalizeColumnKey } from '../lib/excelUtils';

describe('Excel / CSV Import Parser Suite', () => {
  test('normalizeColumnKey normalizes accents and special chars', () => {
    expect(normalizeColumnKey('Techcombank')).toBe('TECHCOMBANK');
    expect(normalizeColumnKey('VietinBank eFAST')).toBe('VIETINBANK_E');
    expect(normalizeColumnKey('Ngân hàng Quốc Tế (VIB)')).toBe('NGAN_HANG_QU');
  });

  test('parseCsvText handles quotes, commas, and newlines', () => {
    const csvContent = 'Header1,Header2\n"Row 1, with comma","Value 2"\n"Multi\nline","Cell"';
    const rows = parseCsvText(csvContent);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(['Header1', 'Header2']);
    expect(rows[1]).toEqual(['Row 1, with comma', 'Value 2']);
    expect(rows[2][0]).toBe('Multi\nline');
  });

  test('convertImportedRowsToBenchmark recognizes groups vs components and defaults score to NULL', () => {
    const rawRows = [
      ['Nhóm / Tính năng', 'BIZ MBBank', 'Techcombank Business', 'VPBank NEOBiz'],
      ['A. ONBOARDING', '', '', ''], // Group row
      ['Mở TK online', 'Có — 3 phút', 'Có — cần xác minh', 'Có — 5 phút'], // Component row
      ['eKYC', 'Tự động', 'Bán tự động', 'Tự động'], // Component row
      ['B. TÍN DỤNG', '', '', ''], // Group row
      ['Cấp hạn mức', 'Online 100%', 'Preapproved', 'Preapproved'], // Component row
    ];

    const result = convertImportedRowsToBenchmark(rawRows, 'test_matrix.csv');

    expect(result.bankColumns).toHaveLength(3);
    expect(result.bankColumns[0].isMB).toBe(true);
    expect(result.groups).toEqual(['A. ONBOARDING', 'B. TÍN DỤNG']);
    expect(result.rows).toHaveLength(3);

    // Check component 1
    const comp1 = result.rows[0];
    expect(comp1.feature).toBe('Mở TK online');
    expect(comp1.group).toBe('A. ONBOARDING');
    expect(comp1.values['MB']).toBe('Có — 3 phút');
    expect(comp1.scores['MB']).toBeNull(); // NULL default score rule
  });
});
