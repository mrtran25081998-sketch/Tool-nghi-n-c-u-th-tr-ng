'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SourcePairPanel from '@/components/sources/SourcePairPanel';
import CrawlResultsTable from '@/components/sources/CrawlResultsTable';
import { SourcePair, CrawlItem } from '@/types';

export default function SummaryPage() {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1. Fetch Source Pairs
  const { data: sourcesData } = useQuery<{ data: SourcePair[] }>({
    queryKey: ['source-pairs'],
    queryFn: async () => {
      const res = await fetch('/api/source-pairs');
      return res.json();
    },
  });
  const sources = sourcesData?.data || [];

  // 2. Fetch Crawl Items
  const { data: crawlItemsData } = useQuery<{ data: CrawlItem[] }>({
    queryKey: ['crawl-items'],
    queryFn: async () => {
      const res = await fetch('/api/crawl-items');
      return res.json();
    },
  });
  const crawlItems = crawlItemsData?.data || [];

  // Mutations
  const addPairMutation = useMutation({
    mutationFn: async (payload: { bank_name?: string; facebook_url: string; website_url: string }) => {
      const res = await fetch('/api/source-pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-pairs'] });
      showToast('Đã thêm 1 hàng nguồn Facebook + Website');
    },
  });

  const updateUrlMutation = useMutation({
    mutationFn: async ({ id, type, url }: { id: string; type: 'facebook' | 'website'; url: string }) => {
      const payload = type === 'facebook' ? { facebook_url: url, facebook_verified: false } : { website_url: url, website_verified: false };
      const res = await fetch(`/api/source-pairs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-pairs'] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'facebook' | 'website' }) => {
      const res = await fetch(`/api/source-pairs/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['source-pairs'] });
      const bankName = data?.data?.bank_name || 'ngân hàng';
      showToast(`Đã verify link và nhận diện ${bankName}`);
    },
  });

  const deletePairMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/source-pairs/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-pairs'] });
      showToast('Đã xóa cả nguồn Facebook và Website');
    },
  });

  const crawlMutation = useMutation({
    mutationFn: async ({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) => {
      const res = await fetch('/api/crawl-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date_from: dateFrom, date_to: dateTo }),
      });
      return res.json();
    },
    onSuccess: () => {
      showToast('Cào dữ liệu hoàn tất. Đã cập nhật bảng phát hiện.');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['crawl-items'] });
      }, 1600);
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      const res = await fetch(`/api/crawl-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['crawl-items'] });
      showToast(vars.status === 'accepted' ? 'Đã chấp nhận dữ liệu' : 'Đã đánh dấu không liên quan');
    },
  });

  return (
    <div className="p-[14px_20px_26px] max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#0f2357] leading-tight m-0">Tổng hợp dữ liệu</h1>
          <p className="text-[#667085] text-xs mt-1">
            Thu thập và tổng hợp dữ liệu sản phẩm/tính năng đối thủ từ Facebook và Website
          </p>
        </div>
      </div>

      {/* Source Pair Panel */}
      <SourcePairPanel
        sources={sources}
        onAddPair={(data) => addPairMutation.mutate(data)}
        onUpdateUrl={(id, type, url) => updateUrlMutation.mutate({ id, type, url })}
        onVerify={(id, type) => verifyMutation.mutate({ id, type })}
        onDeletePair={(id) => {
          if (confirm('Bạn có chắc muốn xóa cả hàng Facebook và Website của ngân hàng này?')) {
            deletePairMutation.mutate(id);
          }
        }}
        onTriggerCrawl={(dateFrom, dateTo) => crawlMutation.mutate({ dateFrom, dateTo })}
        isCrawling={crawlMutation.isPending}
      />

      {/* Crawl Results Discovery Table */}
      <CrawlResultsTable
        items={crawlItems}
        onUpdateStatus={(id, status) => updateItemStatusMutation.mutate({ id, status })}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-[22px] bottom-[22px] bg-[#173d8f] text-white px-3.5 py-2.5 rounded-lg shadow-lg text-xs font-semibold z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
