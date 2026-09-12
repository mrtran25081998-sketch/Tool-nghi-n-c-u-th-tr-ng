import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scan_id') || searchParams.get('scanId') || undefined;
    const rawAlerts = await store.getSourceAlerts(scanId);

    // Keep only the latest unresolved alert per (bankId, sourceType) pair
    const alertMap = new Map<string, typeof rawAlerts[0]>();
    for (const alert of rawAlerts) {
      if (alert.resolved) continue;
      const key = `${alert.bankId}_${alert.sourceType}`;
      if (!alertMap.has(key)) {
        alertMap.set(key, alert);
      }
    }
    const deduplicatedAlerts = Array.from(alertMap.values());

    return NextResponse.json({ success: true, data: deduplicatedAlerts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
