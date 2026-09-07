import { NextRequest, NextResponse } from 'next/server';
import { parseCsvText, convertImportedRowsToBenchmark } from '@/lib/excelUtils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsvText(text);
    const preview = convertImportedRowsToBenchmark(rows, file.name);

    return NextResponse.json({ data: preview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi đọc file import' }, { status: 400 });
  }
}
