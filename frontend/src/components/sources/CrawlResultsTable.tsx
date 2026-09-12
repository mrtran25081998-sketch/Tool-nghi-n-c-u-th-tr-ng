'use client';

import React, { useState } from 'react';
import { ProductDiscovery, DiscoveryReviewStatus } from '@/types';
import { ExternalLink, Sparkles, Filter, CheckCircle2, AlertTriangle, EyeOff, Layers, Calendar, X } from 'lucide-react';

interface CrawlResultsTableProps {
  discoveries: ProductDiscovery[];
  onSelectDiscovery: (discovery: ProductDiscovery) => void;
  onUpdateStatus: (id: string, status: 'APPROVED_DISCOVERY' | 'NEEDS_REVIEW' | 'REJECTED') => void;
  dateFrom?: string;
  dateTo?: string;
  isDateFilterActive?: boolean;
  onToggleDateFilter?: () => void;
}

function formatExternalUrl(url: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function CrawlResultsTable({
  discoveries,
  onSelectDiscovery,
  onUpdateStatus,
  dateFrom,
  dateTo,
  isDateFilterActive = true,
  onToggleDateFilter,
}: CrawlResultsTableProps) {
  const [filterTab, setFilterTab] = useState<'APPROVED_DISCOVERY' | 'NEEDS_REVIEW' | 'ALL'>('APPROVED_DISCOVERY');
  const [bankFilter, setBankFilter] = useState<string>('ALL');

  const banks = Array.from(new Set(discoveries.map((d) => d.bank_name))).filter(Boolean);

  const checkDateMatch = (item: ProductDiscovery) => {
    if (!isDateFilterActive) return true;
    const dDetect = (item.detected_at || '').slice(0, 10);
    const dPub = (item.published_at || '').slice(0, 10);
    const dItem = dDetect || dPub;

    if (dateFrom && dateTo) {
      return (dDetect >= dateFrom && dDetect <= dateTo) ||
             (dPub >= dateFrom && dPub <= dateTo) ||
             (dItem >= dateFrom && dItem <= dateTo);
    }
    if (dateFrom) {
      return dDetect >= dateFrom || dPub >= dateFrom || dItem >= dateFrom;
    }
    if (dateTo) {
      return dDetect <= dateTo || dPub <= dateTo || dItem <= dateTo;
    }
    return true;
  };

  const filtered = discoveries.filter((item) => {
    const matchesTab = filterTab === 'ALL' || item.review_status === filterTab;
    const matchesBank = bankFilter === 'ALL' || item.bank_name === bankFilter;
    const matchesDate = checkDateMatch(item);

    return matchesTab && matchesBank && matchesDate;
  });

  const approvedCount = discoveries.filter((d) => {
    const matchesDate = checkDateMatch(d);
    return matchesDate && (d.review_status === 'APPROVED_DISCOVERY' || d.review_status === 'BENCHMARK_APPLIED');
  }).length;

  const needsReviewCount = discoveries.filter((d) => {
    const matchesDate = checkDateMatch(d);
    return matchesDate && d.review_status === 'NEEDS_REVIEW';
  }).length;

  return (
    <div className="bg-white border border-[#d9e2f2] rounded-xl p-3.5 shadow-card">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#0f2357] m-0 flex items-center gap-2">
            <span>1. Bảng tổng hợp dữ liệu cào Facebook + Website</span>
            <span className="text-xs bg-[#eef5ff] text-[#1646d8] px-2 py-0.5 rounded-full font-extrabold">
              {filtered.length} phát hiện
            </span>
          </h2>
          <p className="text-[#667085] text-xs mt-0.5">
            Dữ liệu phát hiện sản phẩm / tính năng mới được AI phân loại, khử trùng lặp và ánh xạ cấu phần
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Date Filter Chip */}
          {dateFrom && dateTo && (
            <button
              type="button"
              onClick={onToggleDateFilter}
              className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                isDateFilterActive
                  ? 'bg-[#eef5ff] border-[#97b7ff] text-[#1646d8] hover:bg-[#dbeafe]'
                  : 'bg-white border-[#d0d5dd] text-[#667085] hover:bg-[#f8fafc]'
              }`}
              title={isDateFilterActive ? 'Bấm để xem tất cả thời gian' : 'Bấm để lọc theo khoảng ngày đã chọn'}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isDateFilterActive ? `Khoảng: ${dateFrom} → ${dateTo}` : 'Xem tất cả thời gian'}
              </span>
              {isDateFilterActive ? (
                <X className="w-3 h-3 text-[#1646d8]/70 hover:text-[#1646d8]" />
              ) : (
                <span className="text-[10px] bg-[#f1f5f9] px-1 rounded">Bật lọc</span>
              )}
            </button>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center bg-[#f1f5f9] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterTab('APPROVED_DISCOVERY')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                filterTab === 'APPROVED_DISCOVERY'
                  ? 'bg-white text-[#1646d8] shadow-xs'
                  : 'text-[#475467] hover:text-[#0f2357]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#18a566]" />
              <span>Đã duyệt ({approvedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('NEEDS_REVIEW')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                filterTab === 'NEEDS_REVIEW'
                  ? 'bg-white text-[#b54708] shadow-xs'
                  : 'text-[#475467] hover:text-[#0f2357]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#f79009]" />
              <span>Cần xem xét ({needsReviewCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                filterTab === 'ALL'
                  ? 'bg-white text-[#0f2357] shadow-xs'
                  : 'text-[#475467] hover:text-[#0f2357]'
              }`}
            >
              Tất cả ({discoveries.length})
            </button>
          </div>

          {/* Bank Select Filter */}
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="h-8 px-2.5 border border-[#cdd8ea] rounded-lg text-xs font-semibold text-[#344054] bg-white focus:outline-none focus:border-[#1646d8]"
          >
            <option value="ALL">Tất cả ngân hàng</option>
            {banks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discovery Table */}
      <div className="border border-[#d9e2f2] rounded-lg discovery-table-scroll overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs min-w-[1100px]">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] w-10 text-center">#</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] whitespace-nowrap">Ngày phát hiện</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] whitespace-nowrap">Ngân hàng</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] whitespace-nowrap">Nguồn (kèm link)</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a]">Tiêu đề</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] whitespace-nowrap">Loại</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] whitespace-nowrap">Nhóm</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a]">Cấu phần</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a]">Sản phẩm / Tính năng</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] whitespace-nowrap">Mức mới</th>
              <th className="p-2.5 border-b border-[#d9e2f2] font-bold text-[#1f3d7a] text-center whitespace-nowrap">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-[#667085] text-xs">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="font-semibold text-[#0f2357]">
                      {isDateFilterActive && dateFrom && dateTo
                        ? `Không có phát hiện nào trong khoảng ${dateFrom} đến ${dateTo}.`
                        : 'Chưa có phát hiện nào trong danh mục này.'}
                    </p>
                    <p className="text-[#667085]">
                      Hãy bấm nút <strong className="text-[#1646d8]">&quot;🗄 Cào dữ liệu&quot;</strong> ở trên để thu thập và phân tích AI cho khoảng thời gian này.
                    </p>
                    {isDateFilterActive && (
                      <button
                        type="button"
                        onClick={onToggleDateFilter}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#eef5ff] text-[#1646d8] hover:bg-[#dbeafe] rounded-lg text-xs font-bold transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Xem tất cả phát hiện hiện có</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const confPercent = Math.round(r.final_confidence * 100);
                const primarySource = r.sources[0];

                return (
                  <tr
                    key={r.id || `disc-${i}`}
                    onClick={() => onSelectDiscovery(r)}
                    className="hover:bg-[#f3f7fd] cursor-pointer border-b border-[#e6ecf4] transition-colors group"
                  >
                    <td className="p-2.5 text-center text-[#667085] font-semibold">{i + 1}</td>
                    <td className="p-2.5 whitespace-nowrap text-[#475467] font-medium">{r.detected_at}</td>
                    <td className="p-2.5 font-bold text-[#0f2357] whitespace-nowrap">{r.bank_name}</td>
                    <td className="p-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {r.sources.map((s, sIdx) => {
                          const rawUrl = s.content_url || s.url;
                          const isFb = s.source_type === 'facebook';
                          const isBroken = s.url_validation_status === 'BROKEN';
                          const isMissing = !rawUrl || s.url_validation_status === 'MISSING';

                          // DEV Debug Info formatted for tooltip & inspect
                          const debugTooltip = [
                            `[DEV URL TRACE]`,
                            `Discovery ID: ${r.id}`,
                            `Crawl Content ID: ${s.crawl_content_id || 'N/A'}`,
                            `Seed URL: ${s.crawl_source_url || 'N/A'}`,
                            `Raw Href: ${s.raw_href || 'N/A'}`,
                            `Resolved URL: ${s.resolved_url || 'N/A'}`,
                            `Final URL: ${s.final_url || 'N/A'}`,
                            `Content URL: ${s.content_url || 'NULL'}`,
                            `Status: ${s.url_validation_status || 'VALID'}`,
                            `Extraction: ${s.extraction_method || 'ANCHOR'}`,
                          ].join('\n');

                          if (isBroken) {
                            return (
                              <span
                                key={s.id || `src-${sIdx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#fef3f2] text-[#b42318] border border-[#fecdca] cursor-not-allowed"
                                title={`${debugTooltip}\n\nLÝ DO: Link bị lỗi (404 hoặc không truy cập được). Hệ thống đã chặn truy cập.`}
                              >
                                <span>{isFb ? '🔵 FB · Link lỗi' : '🌐 Web · Link lỗi'}</span>
                              </span>
                            );
                          }

                          if (isMissing) {
                            return (
                              <span
                                key={s.id || `src-${sIdx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f1f5f9] text-[#94a3b8] border border-[#e2e8f0] cursor-not-allowed"
                                title={`${debugTooltip}\n\nLÝ DO: Không tìm thấy permalink trực tiếp. Hệ thống không tự tạo URL giả định.`}
                              >
                                <span>{isFb ? '🔵 FB · Thiếu link gốc' : '🌐 Web · Thiếu link gốc'}</span>
                              </span>
                            );
                          }

                          const href = formatExternalUrl(rawUrl);
                          return (
                            <a
                              key={s.id || `src-${sIdx}`}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all shadow-xs ${
                                isFb
                                  ? 'bg-[#e7f0fe] hover:bg-[#d0e2ff] text-[#1877f2] border border-[#bcd7ff]'
                                  : 'bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]'
                              }`}
                              title={`${debugTooltip}\n\nClick để mở chính xác URL bài viết đích.`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (process.env.NODE_ENV === 'development') {
                                  console.log('[DEBUG EXACT SOURCE URL]', {
                                    discoveryId: r.id,
                                    crawlContentId: s.crawl_content_id,
                                    crawlSourceUrl: s.crawl_source_url,
                                    rawHref: s.raw_href,
                                    resolvedUrl: s.resolved_url,
                                    finalUrl: s.final_url,
                                    contentUrl: s.content_url,
                                    validationStatus: s.url_validation_status,
                                    extractionMethod: s.extraction_method,
                                  });
                                }
                              }}
                            >
                              <span>{isFb ? '🔵 FB' : '🌐 Web'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-2.5 text-[#344054] min-w-[160px] max-w-[220px] whitespace-normal break-words leading-snug font-medium" title={r.feature_name}>
                      {r.feature_name}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.content_type === 'NEW_PRODUCT'
                            ? 'bg-[#ede9fe] text-[#6b21a8]'
                            : r.content_type === 'NEW_FEATURE'
                            ? 'bg-[#e0f2fe] text-[#0369a1]'
                            : r.content_type === 'PROMOTION'
                            ? 'bg-[#ecfdf3] text-[#027a48]'
                            : r.content_type === 'PROGRAM'
                            ? 'bg-[#fef3f2] text-[#b42318]'
                            : 'bg-[#f1f5f9] text-[#475467]'
                        }`}
                      >
                        {r.content_type}
                      </span>
                    </td>
                    <td className="p-2.5 text-[#475467] whitespace-nowrap font-medium">{r.journey}</td>
                    <td className="p-2.5 text-[#1646d8] font-semibold min-w-[150px] max-w-[200px] whitespace-normal break-words leading-snug" title={r.benchmark_component_name || r.suggested_component || ''}>
                      {r.benchmark_component_name || r.suggested_component || 'Chưa ánh xạ'}
                    </td>
                    <td className="p-2.5 font-bold text-[#0f2357] min-w-[180px] max-w-[260px] whitespace-normal break-words leading-snug">
                      {r.feature_name}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.newness === 'NEW'
                            ? 'bg-[#ecfdf3] text-[#027a48]'
                            : r.newness === 'UPDATED'
                            ? 'bg-[#fffaeb] text-[#b54708]'
                            : 'bg-[#f1f5f9] text-[#667085]'
                        }`}
                      >
                        {r.newness}
                      </span>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          confPercent >= 85
                            ? 'bg-[#ecfdf3] text-[#027a48]'
                            : confPercent >= 60
                            ? 'bg-[#fffaeb] text-[#b54708]'
                            : 'bg-[#fef3f2] text-[#b42318]'
                        }`}
                      >
                        {confPercent}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
