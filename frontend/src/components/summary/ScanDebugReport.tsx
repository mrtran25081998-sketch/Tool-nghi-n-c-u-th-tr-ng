'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Facebook,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Info,
} from 'lucide-react';
import { ScanMetrics, SourceExecutionResult } from '@/types';

interface ScanDebugReportProps {
  metrics?: ScanMetrics;
  sourceResults?: SourceExecutionResult[];
  scanStatus?: string;
  totalItems: number;
}

export default function ScanDebugReport({
  metrics,
  sourceResults,
  scanStatus,
  totalItems,
}: ScanDebugReportProps) {
  const [isOpen, setIsOpen] = useState(totalItems === 0);

  if (!metrics && (!sourceResults || sourceResults.length === 0)) {
    return null;
  }

  const m = metrics || {
    selectedBanks: 0,
    selectedSources: 0,
    sourcesAttempted: 0,
    sourcesSucceeded: 0,
    sourcesFailed: 0,
    pagesDiscovered: 0,
    pagesFetched: 0,
    itemsParsed: 0,
    itemsRejectedByDate: 0,
    itemsRejectedByAudience: 0,
    itemsMissingDate: 0,
    itemsDeduplicated: 0,
    itemsSaved: 0,
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d9e2f2] shadow-xs overflow-hidden mb-6 transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 bg-gradient-to-r from-[#fafbff] to-[#f4f7fd] border-b border-[#edf1f8] flex items-center justify-between cursor-pointer hover:bg-[#f2f6fd] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#eef5ff] border border-[#d0e1fd] flex items-center justify-center text-[#1646d8]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-[#0f2357] uppercase tracking-wide">
                Báo cáo kiểm soát kỹ thuật lượt quét (Debug Pipeline)
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  scanStatus === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : scanStatus === 'partial'
                    ? 'bg-amber-100 text-amber-800'
                    : scanStatus === 'empty'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                Trạng thái: {scanStatus || 'completed'}
              </span>
            </div>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Đã kiểm tra {m.sourcesAttempted} nguồn • Truy cập thành công {m.sourcesSucceeded} nguồn • Lưu{' '}
              {m.itemsSaved} bản ghi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#1646d8]">
          <span>{isOpen ? 'Thu gọn' : 'Xem chi tiết'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-6 space-y-5">
          {/* KPI Metrics Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-[#64748b]">Nguồn đã kiểm tra</div>
              <div className="text-lg font-black text-[#0f2357] mt-1">{m.sourcesAttempted}</div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">/ {m.selectedSources} đã chọn</div>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Truy cập thành công</div>
              <div className="text-lg font-black text-emerald-700 mt-1">{m.sourcesSucceeded}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">HTTP 200 OK</div>
            </div>

            <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-red-700">Nguồn lỗi / Thiếu API</div>
              <div className="text-lg font-black text-red-700 mt-1">{m.sourcesFailed}</div>
              <div className="text-[10px] text-red-600 mt-0.5">Timeout / Token</div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-blue-700">Bài / Trang phát hiện</div>
              <div className="text-lg font-black text-blue-700 mt-1">{m.pagesDiscovered}</div>
              <div className="text-[10px] text-blue-600 mt-0.5">Đã crawl {m.pagesFetched} trang</div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-amber-700">Loại do ngày</div>
              <div className="text-lg font-black text-amber-700 mt-1">{m.itemsRejectedByDate}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Ngoài khoảng lọc</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-600">Loại do phi KHDN</div>
              <div className="text-lg font-black text-slate-700 mt-1">{m.itemsRejectedByAudience}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cá nhân / Tin nội bộ</div>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-700">Bản ghi lưu hợp lệ</div>
              <div className="text-lg font-black text-indigo-700 mt-1">{m.itemsSaved}</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">Đã gộp {m.itemsDeduplicated} tin</div>
            </div>
          </div>

          {/* Zero items contextual explanation */}
          {totalItems === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong className="font-bold">Lượt quét hoàn thành nhưng không tìm thấy dữ liệu:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-amber-800">
                  {m.itemsRejectedByDate > 0 && (
                    <li>
                      Có <strong>{m.itemsRejectedByDate} bài viết</strong> được phát hiện nhưng có ngày đăng nằm
                      ngoài khoảng thời gian được chọn. Hãy thử nới rộng khoảng <em>Từ ngày</em> - <em>Đến ngày</em>.
                    </li>
                  )}
                  {m.itemsRejectedByAudience > 0 && (
                    <li>
                      Có <strong>{m.itemsRejectedByAudience} trang</strong> được crawler truy cập nhưng nội dung
                      thuộc mảng khách hàng cá nhân hoặc tuyển dụng nên hệ thống đã tự động lọc bỏ để bảo toàn độ sạch.
                    </li>
                  )}
                  {m.sourcesFailed > 0 && (
                    <li>
                      Một số nguồn (đặc biệt là Fanpage Facebook) chưa được cấp <code>FACEBOOK_ACCESS_TOKEN</code>{' '}
                      hoặc website ngân hàng chặn truy cập tự động. Hãy xem bảng chi tiết phía dưới để biết lý do.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Detailed Source-by-Source Execution Table */}
          {sourceResults && sourceResults.length > 0 && (
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#334155]">
                  Nhật ký chi tiết từng nguồn ({sourceResults.length} nguồn)
                </span>
                <span className="text-[11px] text-[#64748b]">Trạng thái thực tế từ máy chủ</span>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f1f5f9] text-[#475569] font-bold text-[11px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Ngân hàng</th>
                      <th className="px-3 py-2.5">Nguồn</th>
                      <th className="px-3 py-2.5">HTTP</th>
                      <th className="px-3 py-2.5">Trạng thái</th>
                      <th className="px-3 py-2.5">URL nguồn & Nguyên nhân</th>
                      <th className="px-3 py-2.5 text-right">Bài lưu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f7]">
                    {sourceResults.map((sr, idx) => (
                      <tr key={idx} className="hover:bg-[#fafcff] transition-colors">
                        <td className="px-4 py-2.5 font-bold text-[#0f2357] whitespace-nowrap">
                          {sr.bankName}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              sr.sourceType === 'website'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {sr.sourceType === 'website' ? (
                              <Globe className="w-3 h-3" />
                            ) : (
                              <Facebook className="w-3 h-3" />
                            )}
                            {sr.sourceType === 'website' ? 'Website' : 'Facebook'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">
                          {sr.httpStatus ? (
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                sr.httpStatus === 200
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {sr.httpStatus}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sr.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sr.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : sr.status === 'unavailable'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sr.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                            {sr.status === 'partial' && <AlertTriangle className="w-3 h-3" />}
                            {sr.status === 'unavailable' && <Info className="w-3 h-3" />}
                            {sr.status === 'failed' && <XCircle className="w-3 h-3" />}
                            {sr.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[#475569]">
                          <div className="font-mono text-[10.5px] truncate max-w-xs text-blue-600">
                            <a href={sr.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {sr.url}
                            </a>
                          </div>
                          {sr.errorCode && (
                            <div className="text-[10.5px] text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                              <span className="bg-red-50 px-1 rounded border border-red-200">
                                {sr.errorCode}
                              </span>
                              <span>{sr.errorMessage}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-[#0f2357]">
                          {sr.savedCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
