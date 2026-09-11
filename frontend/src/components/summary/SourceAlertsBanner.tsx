'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ExternalLink, Globe, Radio } from 'lucide-react';
import { SourceAlert } from '@/types';

interface SourceAlertsBannerProps {
  alerts: SourceAlert[];
  onRetryAlert: (id: string) => void;
  isRetryingId?: string | null;
}

export default function SourceAlertsBanner({
  alerts,
  onRetryAlert,
  isRetryingId,
}: SourceAlertsBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4.5 mb-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-900 m-0">
              Một số nguồn cần rà soát ({alerts.length} cảnh báo)
            </h3>
            <p className="text-[11px] text-amber-700 m-0 mt-0.5">
              Phát hiện lỗi truy cập từ Website hoặc Facebook trong lượt quét gần nhất
            </p>
          </div>
        </div>

        <Link
          href="/sources"
          className="text-[11px] font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 no-underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở cấu hình nguồn
        </Link>
      </div>

      {/* List of alerts */}
      <div className="space-y-2">
        {alerts.map((alert) => {
          const isRetrying = isRetryingId === alert.id;
          return (
            <div
              key={alert.id}
              className="bg-white border border-amber-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0f2357] min-w-[120px]">
                  {alert.bankName}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                    alert.sourceType === 'website'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                  }`}
                >
                  {alert.sourceType === 'website' ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Radio className="w-3 h-3" />
                  )}
                  {alert.sourceType === 'website' ? 'Website' : 'Facebook'}
                </span>

                <span className="text-[#475467] font-medium">
                  {alert.errorCause}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#98a2b3]">
                  {alert.checkedAt ? new Date(alert.checkedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                </span>

                <button
                  type="button"
                  onClick={() => onRetryAlert(alert.id)}
                  disabled={isRetrying}
                  className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[11px] font-bold text-[#344054] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-[#1646d8]' : ''}`} />
                  {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
