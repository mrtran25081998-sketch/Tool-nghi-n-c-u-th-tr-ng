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

    // Consolidate any FACEBOOK_TOKEN_MISSING into a single alert
    let hasFbTokenAlert = false;
    const finalAlerts: typeof rawAlerts = [];
    for (const alert of deduplicatedAlerts) {
      const isFbMissing =
        alert.sourceType === 'facebook' &&
        (alert.errorCause?.includes('FACEBOOK_TOKEN_MISSING') || alert.errorMessage?.includes('FACEBOOK_TOKEN_MISSING'));
      if (isFbMissing) {
        if (!hasFbTokenAlert) {
          hasFbTokenAlert = true;
          finalAlerts.push({
            ...alert,
            bankId: 'ALL_BANKS',
            bankName: 'Fanpage Facebook (Tất cả ngân hàng)',
            errorMessage: 'Chưa cấu hình FACEBOOK_ACCESS_TOKEN trên máy chủ. Bỏ chọn Facebook nếu chỉ muốn quét Website.',
          });
        }
      } else {
        finalAlerts.push(alert);
      }
    }

    return NextResponse.json({ success: true, data: finalAlerts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
