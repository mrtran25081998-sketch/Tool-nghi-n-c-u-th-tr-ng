'use client';

import React, { useState } from 'react';
import { ProductDiscovery, ScoreValue, BenchmarkComponent } from '@/types';
import {
  X,
  ExternalLink,
  Check,
  EyeOff,
  AlertTriangle,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface DiscoveryDetailDrawerProps {
  discovery: ProductDiscovery | null;
  components: BenchmarkComponent[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'APPROVED_DISCOVERY' | 'NEEDS_REVIEW' | 'REJECTED') => void;
  onApplyToBenchmark: (
    id: string,
    score: ScoreValue,
    description: string,
    componentId?: string
  ) => void;
}

export default function DiscoveryDetailDrawer({
  discovery,
  components,
  onClose,
  onUpdateStatus,
  onApplyToBenchmark,
}: DiscoveryDetailDrawerProps) {
  const [selectedScore, setSelectedScore] = useState<ScoreValue>(3);
  const [description, setDescription] = useState('');
  const [targetComponentId, setTargetComponentId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Sync state when discovery changes
  React.useEffect(() => {
    if (discovery) {
      setSelectedScore(discovery.suggested_score ?? 3);
      setDescription(discovery.suggested_description || discovery.change_summary || '');
      setTargetComponentId(discovery.benchmark_component_id || components[0]?.id || '');
      setShowConfirmModal(false);
    }
  }, [discovery, components]);

  if (!discovery) return null;

  const handleConfirmApply = () => {
    setIsApplying(true);
    onApplyToBenchmark(discovery.id, selectedScore, description, targetComponentId);
    setTimeout(() => {
      setIsApplying(false);
      setShowConfirmModal(false);
      onClose();
    }, 250);
  };

  const confidencePercent = Math.round(discovery.final_confidence * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0f2357]/35 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl h-screen max-h-screen shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-[#edf1f6] bg-[#f8fafc] flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-extrabold text-sm text-[#0f2357]">{discovery.bank_name}</span>
              <span className="text-xs px-2 py-0.5 rounded font-bold bg-[#1646d8] text-white">
                {discovery.content_type}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  discovery.newness === 'NEW'
                    ? 'bg-[#ecfdf3] text-[#027a48]'
                    : discovery.newness === 'UPDATED'
                    ? 'bg-[#fffaeb] text-[#b54708]'
                    : 'bg-[#f1f5f9] text-[#475467]'
                }`}
              >
                Mức mới: {discovery.newness}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#eef5ff] text-[#1646d8]">
                Confidence: {confidencePercent}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#1e293b] m-0 leading-snug">
              {discovery.feature_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#667085] hover:text-[#0f2357] p-1.5 rounded-lg hover:bg-[#e6ecf4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs">
            <div>
              <span className="text-[#667085] block font-medium">Ngày phát hiện</span>
              <strong className="text-[#0f2357] font-semibold">{discovery.detected_at}</strong>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Ngày đăng tin</span>
              <strong className="text-[#0f2357] font-semibold">{discovery.published_at || 'Không có'}</strong>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Nhóm hành trình</span>
              <strong className="text-[#1646d8] font-semibold">{discovery.journey}</strong>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Cấu phần ánh xạ</span>
              <strong className="text-[#0f2357] font-semibold">
                {discovery.benchmark_component_name || discovery.suggested_component || 'Chưa ánh xạ'}
              </strong>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Số lượng nguồn</span>
              <strong className="text-[#0f2357] font-semibold">{discovery.source_count} nguồn hợp nhất</strong>
            </div>
            <div>
              <span className="text-[#667085] block font-medium">Trạng thái duyệt</span>
              <strong
                className={`font-bold ${
                  discovery.review_status === 'APPROVED_DISCOVERY'
                    ? 'text-[#027a48]'
                    : discovery.review_status === 'BENCHMARK_APPLIED'
                    ? 'text-[#1646d8]'
                    : discovery.review_status === 'NEEDS_REVIEW'
                    ? 'text-[#b54708]'
                    : 'text-[#b42318]'
                }`}
              >
                {discovery.review_status}
              </strong>
            </div>
          </div>

          {/* Sources List (Merged Facebook + Web with Exact Content URLs & Traceability) */}
          <div>
            <label className="block text-xs font-bold text-[#475467] mb-1.5 flex items-center gap-1.5">
              <span>🌐 Nguồn đối chiếu ({discovery.sources.length} liên kết bằng chứng gốc)</span>
            </label>
            <div className="space-y-2">
              {discovery.sources.map((src, idx) => {
                const rawUrl = (src.content_url || src.url || '').trim();
                const isFb = src.source_type === 'facebook';
                const isBroken = src.url_validation_status === 'BROKEN';
                const isMissing = !rawUrl || src.url_validation_status === 'MISSING';
                const hasUrl = Boolean(rawUrl) && !isBroken;
                const cleanHref = hasUrl
                  ? rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
                    ? rawUrl
                    : `https://${rawUrl}`
                  : null;

                return (
                  <div
                    key={src.id || `drawer-src-${idx}`}
                    className={`p-3 bg-white border rounded-xl text-xs space-y-2 shadow-xs transition-colors ${
                      isBroken
                        ? 'border-[#fda29b] bg-[#fffbfa]'
                        : isMissing
                        ? 'border-[#e2e8f0] bg-[#f8fafc]'
                        : 'border-[#cdd8ea] hover:border-[#1646d8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isFb ? 'bg-[#e7f0fe] text-[#1877f2]' : 'bg-[#f0fdf4] text-[#166534]'
                          }`}
                        >
                          {isFb ? '🔵 Facebook Post' : '🌐 Website Article'}
                        </span>

                        {src.url_validation_status && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              src.url_validation_status === 'VALID'
                                ? 'bg-[#ecfdf3] text-[#027a48]'
                                : src.url_validation_status === 'BROKEN'
                                ? 'bg-[#fef3f2] text-[#b42318]'
                                : 'bg-[#fffaeb] text-[#b54708]'
                            }`}
                          >
                            {src.url_validation_status === 'VALID'
                              ? '✓ Link hợp lệ'
                              : src.url_validation_status === 'BROKEN'
                              ? '⚠ Link lỗi (404)'
                              : '✕ Thiếu link gốc'}
                          </span>
                        )}

                        {src.extraction_method && (
                          <span className="text-[10px] bg-[#f1f5f9] text-[#475467] px-1.5 py-0.5 rounded font-mono">
                            {src.extraction_method}
                          </span>
                        )}

                        {src.published_at && (
                          <span className="text-[11px] text-[#64748b] font-medium">
                            Ngày đăng: {src.published_at.slice(0, 10)}
                          </span>
                        )}
                      </div>

                      {cleanHref ? (
                        <a
                          href={cleanHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-[#1646d8] text-white hover:bg-[#0c53e8] rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs text-xs"
                          title={`Mở trực tiếp trang/bài viết gốc: ${cleanHref}`}
                        >
                          <span>Mở bài viết đích</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : isBroken ? (
                        <span className="px-2.5 py-1 bg-[#fef3f2] text-[#b42318] rounded-lg font-bold text-[11px] border border-[#fecdca]">
                          Link bị lỗi (404)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#94a3b8] rounded-lg font-semibold text-[11px] border border-[#e2e8f0]">
                          Không có liên kết trực tiếp
                        </span>
                      )}
                    </div>

                    {src.title && src.title !== discovery.feature_name && (
                      <div className="text-[#1e293b] font-semibold text-xs leading-snug">
                        {src.title}
                      </div>
                    )}

                    {rawUrl && (
                      <div className="text-[#3b82f6] text-[11px] truncate font-mono bg-[#f8fafc] p-1.5 rounded border border-[#e2e8f0]" title={rawUrl}>
                        {rawUrl}
                      </div>
                    )}

                    {src.url_validation_reason && (
                      <div className="text-[#b42318] text-[11px] font-medium bg-[#fef3f2] p-1.5 rounded border border-[#fecdca]">
                        Ghi chú kiểm tra: {src.url_validation_reason}
                      </div>
                    )}

                    {src.evidence_text && (
                      <div className="text-[#475467] text-[11px] leading-relaxed bg-[#f8fafc] p-2 rounded-lg italic border-l-2 border-[#1646d8]/40">
                        &ldquo;{src.evidence_text}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Change Summary */}
          <div>
            <label className="block text-xs font-bold text-[#475467] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1646d8]" />
              <span>Tóm tắt phát hiện & Đánh giá từ AI</span>
            </label>
            <div className="p-3 bg-[#f0f5ff] border border-[#bfd7ff] rounded-xl text-xs text-[#1e293b] leading-relaxed">
              {discovery.change_summary}
            </div>
          </div>

          {/* Original Evidence */}
          <div>
            <label className="block text-xs font-bold text-[#475467] mb-1">
              Trích dẫn bằng chứng gốc (Original Evidence)
            </label>
            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#475467] leading-relaxed italic max-h-36 overflow-y-auto">
              &ldquo;{discovery.evidence}&rdquo;
            </div>
          </div>

          {/* Benchmark Mapping & Review Decision Box (Safety Rules XXVII & XXVIII) */}
          <div className="p-4 bg-gradient-to-br from-[#fafcff] to-[#f0f5ff] border-2 border-[#97b7ff] rounded-xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#1646d8]" />
              <h4 className="text-xs font-extrabold text-[#0f2357] m-0 uppercase tracking-wide">
                Đối chiếu & Đề xuất Cập nhật Benchmark Matrix
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Chọn Cấu phần Benchmark đích:
                </label>
                <select
                  value={targetComponentId}
                  onChange={(e) => setTargetComponentId(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#cdd8ea] rounded-lg text-xs font-medium text-[#1e293b] focus:outline-none focus:border-[#1646d8]"
                >
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Điểm số Benchmark đề xuất (0: Chưa có, 1: Cơ bản, 2: Tốt, 3: Xuất sắc):
                </label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelectedScore(val as ScoreValue)}
                      className={`flex-1 h-8 rounded-lg font-bold text-xs transition-all ${
                        selectedScore === val
                          ? 'bg-[#1646d8] text-white shadow-sm ring-2 ring-[#1646d8]/30'
                          : 'bg-white border border-[#cdd8ea] text-[#475467] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      Mức {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">
                  Mô tả tính năng áp dụng vào Benchmark Matrix:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#cdd8ea] rounded-lg text-xs text-[#1e293b] resize-none focus:outline-none focus:border-[#1646d8]"
                  placeholder="Nhập mô tả tính năng ngân hàng đối thủ..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions Pinned to Bottom */}
        <div className="mt-auto shrink-0 p-4 px-6 border-t border-[#edf1f6] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-3 shadow-md z-20">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(discovery.id, 'REJECTED')}
              className="px-3.5 py-2 text-xs font-semibold text-[#b42318] bg-white border border-[#fda29b] rounded-lg hover:bg-[#fff0f1] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Không liên quan</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(discovery.id, 'NEEDS_REVIEW')}
              className="px-3.5 py-2 text-xs font-semibold text-[#b54708] bg-white border border-[#fedf89] rounded-lg hover:bg-[#fffaeb] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần xem xét</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#344054] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f1f5f9] cursor-pointer transition-colors"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isApplying}
              onClick={() => setShowConfirmModal(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#1646d8] to-[#0c53e8] rounded-lg hover:opacity-95 shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-opacity"
            >
              <Zap className="w-4 h-4" />
              <span>Áp dụng vào Benchmark Matrix</span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#0f2357]/45 backdrop-blur-xs p-4 animate-in fade-in duration-100">
            <div className="bg-white rounded-xl shadow-2xl border border-[#d9e2f2] w-full max-w-md p-5 animate-in zoom-in-95 duration-100">
              <div className="flex items-center gap-2.5 text-[#1646d8] mb-3">
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <h4 className="text-sm font-bold text-[#0f2357] m-0">
                  Xác nhận Áp dụng vào Benchmark Matrix
                </h4>
              </div>
              <p className="text-xs text-[#475467] leading-relaxed mb-4">
                Bạn đang chuẩn bị cập nhật điểm số <strong>Mức {selectedScore}</strong> cho ngân hàng{' '}
                <strong>{discovery.bank_name}</strong> tại cấu phần{' '}
                <strong>
                  {components.find((c) => c.id === targetComponentId)?.name || 'Cấu phần đã chọn'}
                </strong>.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#344054] bg-white border border-[#cbd5e1] rounded-lg hover:bg-[#f1f5f9]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={handleConfirmApply}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#18a566] to-[#0f8c52] rounded-lg hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'Đang cập nhật...' : 'Xác nhận áp dụng'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
