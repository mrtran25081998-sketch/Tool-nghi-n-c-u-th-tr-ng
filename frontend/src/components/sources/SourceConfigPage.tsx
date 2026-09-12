'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Trash2,
  Plus,
  Save,
  Building2,
  Radio,
  ShieldCheck,
  Globe,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
} from 'lucide-react';
import { SourcePair } from '@/types';
import AddBankModal from './AddBankModal';

/* ─────────────────────────── helpers ─────────────────────────── */

/** Generate a 2–3 letter abbreviation from a bank name */
function bankInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Deterministic colour from bank name */
const LOGO_PALETTE = [
  { bg: '#1646d8', text: '#fff' },
  { bg: '#e52b2b', text: '#fff' },
  { bg: '#007b5e', text: '#fff' },
  { bg: '#1a2e5a', text: '#fff' },
  { bg: '#0077b6', text: '#fff' },
  { bg: '#6d28d9', text: '#fff' },
  { bg: '#b45309', text: '#fff' },
  { bg: '#065f46', text: '#fff' },
];

function logoColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xfffffff;
  return LOGO_PALETTE[hash % LOGO_PALETTE.length];
}

/** Format datetime */
function fmtTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `Quét cuối: ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
}

/* ─────────────────────────── types ─────────────────────────── */

interface RowState {
  websiteUrl: string;
  facebookUrl: string;
  active: boolean;
  dirty: boolean;
}

/* ─────────────────────────── sub-components ─────────────────────────── */

function StatCard({
  icon,
  value,
  label,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#e4edf7] rounded-xl p-5 flex items-start gap-4 shadow-[0_2px_8px_rgba(16,42,89,0.05)]">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent ?? '#eef5ff' }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-[#0f2357] leading-none mb-0.5">{value}</div>
        <div className="text-[12px] font-semibold text-[#0f2357]">{label}</div>
        <div className="text-[11px] text-[#667085] mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function UrlCell({
  value,
  onChange,
  onRefresh,
  placeholder,
  refreshing,
}: {
  value: string;
  onChange: (v: string) => void;
  onRefresh: () => void;
  placeholder: string;
  refreshing?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-8 border border-[#d1ddef] rounded-lg px-2.5 text-[11.5px] text-[#344054] bg-white focus:outline-none focus:border-[#1646d8] focus:ring-1 focus:ring-[#1646d8]/20 transition-all placeholder:text-[#aab4c8]"
      />
      <button
        type="button"
        onClick={onRefresh}
        title="Quét lại ngay"
        className="w-8 h-8 shrink-0 border border-[#c9d8f0] rounded-lg flex items-center justify-center text-[#1646d8] hover:bg-[#eef5ff] transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */

interface SourceConfigPageProps {
  initialSources: SourcePair[];
}

export default function SourceConfigPage({ initialSources }: SourceConfigPageProps) {
  const MAX_BANKS = 20;

  // Rows state: track per-pair URL edits + active toggle
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const m: Record<string, RowState> = {};
    for (const s of initialSources) {
      m[s.id] = {
        websiteUrl: s.website_url,
        facebookUrl: s.facebook_url,
        active: s.is_active ?? true,
        dirty: false,
      };
    }
    return m;
  });

  const [sources, setSources] = useState<SourcePair[]>(initialSources);
  const [saving, setSaving] = useState(false);
  const [synced, setSynced] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeletePair, setConfirmDeletePair] = useState<SourcePair | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── derived stats ── */
  const totalSources = sources.length;
  const trackingCount = sources.reduce((n, s) => {
    const r = rows[s.id];
    const hasWeb = (r?.websiteUrl || s.website_url).trim().length > 0;
    const hasFb = (r?.facebookUrl || s.facebook_url).trim().length > 0;
    return n + (hasWeb ? 1 : 0) + (hasFb ? 1 : 0);
  }, 0);
  const healthyCount = sources.filter((s) => s.website_verified && rows[s.id]?.active !== false).length;

  // Filtered and paginated sources
  const filteredSources = useMemo(() => {
    if (!searchTerm.trim()) return sources;
    const q = searchTerm.toLowerCase().trim();
    return sources.filter((s) => (s.bank_name || '').toLowerCase().includes(q));
  }, [sources, searchTerm]);

  const totalPages = Math.ceil(filteredSources.length / pageSize) || 1;
  const paginatedSources = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSources.slice(start, start + pageSize);
  }, [filteredSources, currentPage, pageSize]);

  /* ── handlers ── */
  const setField = (id: string, field: 'websiteUrl' | 'facebookUrl', val: string) => {
    setSynced(false);
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val, dirty: true } }));
  };

  const toggleActive = (id: string) => {
    setSynced(false);
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], active: !prev[id].active, dirty: true } }));
  };

  const handleTestBank = async (bankId: string, bankName: string) => {
    setTestingId(bankId);
    try {
      const res = await fetch(`/api/banks/${bankId}/test-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ Kết nối tốt tới ${bankName} (${json.data.latency_ms}ms)`, 'ok');
      } else {
        showToast(`❌ Lỗi kết nối: ${json.error}`, 'err');
      }
    } catch {
      showToast('Không thể kiểm tra kết nối', 'err');
    } finally {
      setTestingId(null);
    }
  };

  const handleRefresh = useCallback(
    async (id: string, type: 'website' | 'facebook') => {
      setRefreshingId(`${id}-${type}`);
      try {
        const res = await fetch(`/api/source-pairs/${id}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });
        if (!res.ok) throw new Error('Verify thất bại');
        showToast('Đã xác thực URL thành công', 'ok');
      } catch {
        showToast('Không thể xác thực URL', 'err');
      } finally {
        setRefreshingId(null);
      }
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const dirtyIds = Object.entries(rows)
        .filter(([, r]) => r.dirty)
        .map(([id]) => id);

      await Promise.all(
        dirtyIds.map((id) =>
          fetch(`/api/source-pairs/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              website_url: rows[id].websiteUrl,
              facebook_url: rows[id].facebookUrl,
            }),
          }),
        ),
      );

      setRows((prev) => {
        const next = { ...prev };
        for (const id of dirtyIds) next[id] = { ...next[id], dirty: false };
        return next;
      });
      setSynced(true);
      showToast('Đã lưu cấu hình thành công', 'ok');
    } catch {
      showToast('Lưu thất bại, vui lòng thử lại', 'err');
    } finally {
      setSaving(false);
    }
  };

  const confirmAndExecuteDelete = async () => {
    if (!confirmDeletePair) return;
    const id = confirmDeletePair.id;
    setDeletingId(id);
    setConfirmDeletePair(null);
    try {
      const res = await fetch(`/api/source-pairs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSources((prev) => prev.filter((s) => s.id !== id));
      setRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast('Đã xoá cả cấu hình Website và Facebook của ngân hàng', 'ok');
    } catch {
      showToast('Xoá thất bại', 'err');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddBank = async (data: {
    bank_name: string;
    website_url: string;
    facebook_url: string;
  }) => {
    try {
      const res = await fetch('/api/source-pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const pair: SourcePair = json.data;
      setSources((prev) => [...prev, pair]);
      setRows((prev) => ({
        ...prev,
        [pair.id]: {
          websiteUrl: pair.website_url,
          facebookUrl: pair.facebook_url,
          active: true,
          dirty: false,
        },
      }));
      showToast('Đã thêm ngân hàng mới', 'ok');
    } catch {
      showToast('Thêm ngân hàng thất bại', 'err');
    }
  };

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-[#f5f7fc] p-6">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border transition-all animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'ok'
              ? 'bg-[#edfaf4] border-[#a7e9c9] text-[#0d6e45]'
              : 'bg-[#fff0f1] border-[#f9b7ba] text-[#c0212c]'
          }`}
        >
          {toast.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0f2357] leading-tight">
            Cấu hình nguồn
          </h1>
          <p className="text-[13px] text-[#667085] mt-0.5">
            Quản lý Website và fanpage chính thức của từng ngân hàng
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
            synced
              ? 'bg-[#edfaf4] border-[#a7e9c9] text-[#0d6e45]'
              : 'bg-[#fff7df] border-[#f9da6a] text-[#8a6000]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${synced ? 'bg-[#18a566]' : 'bg-[#f59e0b]'}`}
          />
          {synced ? 'Đã đồng bộ' : 'Có thay đổi chưa lưu'}
        </div>
      </div>

      {/* ── Section Card ── */}
      <div className="bg-white border border-[#e4edf7] rounded-2xl shadow-[0_4px_20px_rgba(16,42,89,0.06)] overflow-hidden">
        {/* Section header */}
        <div className="px-6 py-5 border-b border-[#edf1f8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#0f2357]">
              Nguồn Website và Facebook chính thức
            </h2>
            <p className="text-[12px] text-[#667085] mt-0.5">
              Quản lý toàn bộ danh sách ngân hàng đối thủ và liên kết Website / Fanpage Doanh nghiệp phục vụ quét tự động.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || synced}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-lg border border-[#c9d8f0] bg-white text-[#344054] hover:bg-[#f7f9fc] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-lg bg-gradient-to-r from-[#2465ed] to-[#1646d8] text-white hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm nguồn
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="flex flex-col sm:flex-row gap-4 px-6 py-5 border-b border-[#edf1f8] bg-[#fafbff]">
          <StatCard
            icon={<Building2 className="w-5 h-5 text-[#1646d8]" />}
            value={totalSources}
            label="Ngân hàng đã cấu hình"
            sub={`tối đa ${MAX_BANKS} ngân hàng`}
            accent="#eef5ff"
          />
          <StatCard
            icon={<Radio className="w-5 h-5 text-[#0d6e45]" />}
            value={trackingCount}
            label="Đang bắt theo dõi"
            sub={`${totalSources * 2} nguồn Website/Facebook`}
            accent="#edfaf4"
          />
          <StatCard
            icon={<ShieldCheck className="w-5 h-5 text-[#f59e0b]" />}
            value={healthyCount}
            label="Nguồn Website sẵn sàng"
            sub={`Facebook: Tạm ngưng (thiếu Token)`}
            accent="#fff7df"
          />
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-[#edf1f8] flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#98a2b3]" />
            <input
              type="text"
              placeholder="Tìm ngân hàng theo tên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#d0d5dd] focus:outline-none focus:border-[#1646d8]"
            />
          </div>
          <div className="text-xs text-[#667085]">
            Hiển thị <span className="font-bold text-[#0f2357]">{filteredSources.length}</span> ngân hàng
          </div>
        </div>

        {/* Table */}
        {filteredSources.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-[#98a2b3]">
            <Building2 className="w-10 h-10 opacity-40" />
            <span className="text-sm font-medium">Không tìm thấy ngân hàng phù hợp.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[#f4f7fd] border-b border-[#e4edf7]">
                  <th className="text-left px-6 py-3 text-[10.5px] font-extrabold text-[#667085] tracking-wider uppercase w-[200px]">
                    Ngân hàng
                  </th>
                  <th className="text-left px-4 py-3 text-[10.5px] font-extrabold text-[#667085] tracking-wider uppercase">
                    Website chính thức
                  </th>
                  <th className="text-left px-4 py-3 text-[10.5px] font-extrabold text-[#667085] tracking-wider uppercase">
                    Facebook chính thức
                  </th>
                  <th className="text-left px-4 py-3 text-[10.5px] font-extrabold text-[#667085] tracking-wider uppercase w-[230px]">
                    Trạng thái & Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f8]">
                {paginatedSources.map((s: SourcePair) => {
                  const row = rows[s.id] ?? {
                    websiteUrl: s.website_url,
                    facebookUrl: s.facebook_url,
                    active: true,
                    dirty: false,
                  };
                  const colors = logoColor(s.bank_name ?? s.id);
                  const initials = bankInitials(s.bank_name ?? '?');
                  const isDeleting = deletingId === s.id;
                  const isTesting = testingId === (s.bank_id || s.id);

                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors hover:bg-[#fafbff] ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      {/* Bank logo + name */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-extrabold shrink-0 shadow-sm"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-[#0f2357] truncate">
                              {s.bank_name || '(Chưa đặt tên)'}
                            </div>
                            <div className="text-[10.5px] text-[#98a2b3] mt-0.5">
                              {fmtTime(s.updated_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Website URL */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#98a2b3] shrink-0" />
                          <UrlCell
                            value={row.websiteUrl}
                            onChange={(v) => setField(s.id, 'websiteUrl', v)}
                            onRefresh={() => handleRefresh(s.id, 'website')}
                            placeholder="https://..."
                            refreshing={refreshingId === `${s.id}-website`}
                          />
                        </div>
                      </td>

                      {/* Facebook URL */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#1646d8] text-[13px] shrink-0">𝗳</span>
                            <UrlCell
                              value={row.facebookUrl}
                              onChange={(v) => setField(s.id, 'facebookUrl', v)}
                              onRefresh={() => handleRefresh(s.id, 'facebook')}
                              placeholder="https://facebook.com/..."
                              refreshing={refreshingId === `${s.id}-facebook`}
                            />
                          </div>
                          {!s.facebook_verified && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                              Thiếu Meta Graph Token (Tạm ngưng)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status & Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {/* Status badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                              row.active
                                ? 'bg-[#fff7df] text-[#8a6000] border border-[#f9da6a]'
                                : 'bg-[#f2f5fa] text-[#667085] border border-[#d9e2f2]'
                            }`}
                          >
                            {row.active ? 'Hoạt động' : 'Tắt'}
                          </span>

                          {/* Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleActive(s.id)}
                            aria-label="Bật/tắt nguồn"
                            className={`relative w-8 h-4.5 rounded-full transition-colors shrink-0 cursor-pointer ${
                              row.active ? 'bg-[#1646d8]' : 'bg-[#d0d5dd]'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                row.active ? 'translate-x-3.5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Quét thử từng nguồn */}
                          <button
                            type="button"
                            onClick={() => handleTestBank(s.bank_id || s.id, s.bank_name || '')}
                            disabled={isTesting}
                            title="Quét thử kết nối nguồn Website và Facebook"
                            className="px-2 py-1 rounded-md bg-[#eef5ff] hover:bg-[#dfeeff] text-[#1646d8] text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                            {isTesting ? 'Đang thử' : 'Quét thử'}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePair(s)}
                            title="Xoá ngân hàng này"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ef3f4b] hover:bg-[#fff0f1] transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[#edf1f8] flex items-center justify-between text-xs text-[#667085] bg-[#fafbff]">
            <span>
              Trang <span className="font-bold text-[#0f2357]">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-md border border-[#d0d5dd] bg-white font-medium hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                Trang trước
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-md border border-[#d0d5dd] bg-white font-medium hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeletePair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0f2357] mb-2">
              Xóa ngân hàng {confirmDeletePair.bank_name}?
            </h3>
            <p className="text-xs text-[#667085] leading-relaxed mb-6">
              Xóa hàng này sẽ xóa đồng thời cấu hình của cả <strong>Website</strong> và <strong>Facebook</strong> của ngân hàng khỏi hệ thống quét. Bạn có chắc chắn muốn xóa?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeletePair(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmAndExecuteDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Xác nhận xóa cả 2 nguồn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Bank Modal ── */}
      <AddBankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddBank}
      />
    </div>
  );
}
