'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ScanSetupPanel from '@/components/summary/ScanSetupPanel';
import SummaryStatCards from '@/components/summary/SummaryStatCards';
import SourceAlertsBanner from '@/components/summary/SourceAlertsBanner';
import AggregatedResultsTable from '@/components/summary/AggregatedResultsTable';
import { Bank, IntelligenceItem, SourceAlert, ScanJobDetail } from '@/types';

export default function SummaryPage() {
  // 1. Core State
  const [banks, setBanks] = useState<Bank[]>([]);
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [alerts, setAlerts] = useState<SourceAlert[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2. Scan Filter State
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [scanSources, setScanSources] = useState<{ website: boolean; facebook: boolean }>({
    website: true,
    facebook: true,
  });

  // 3. Live Mode vs Demo Mode
  const [isLiveMode, setIsLiveMode] = useState(true);

  // 4. Scanning & Progress State
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<{
    percent: number;
    stage: string;
    currentBankName?: string;
  }>({
    percent: 0,
    stage: '',
  });

  const [retryingAlertId, setRetryingAlertId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Banks list from Cấu hình nguồn API
  const loadBanks = useCallback(async () => {
    try {
      const res = await fetch('/api/banks');
      const json = await res.json();
      if (json.data) {
        setBanks(json.data);
        // Default select all active banks
        if (selectedBankIds.length === 0) {
          setSelectedBankIds(json.data.map((b: Bank) => b.id));
        }
      }
    } catch (e) {
      console.error('Failed to load banks', e);
    }
  }, [selectedBankIds.length]);

  // Load Source Alerts
  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      const json = await res.json();
      if (json.data) {
        setAlerts(json.data);
      }
    } catch (e) {
      console.error('Failed to load alerts', e);
    }
  }, []);

  // Load Intelligence Results
  const loadResults = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (selectedBankIds.length > 0 && selectedBankIds.length < banks.length) {
        params.append('bank_ids', selectedBankIds.join(','));
      }
      params.append('mode', isLiveMode ? 'live' : 'demo');

      const res = await fetch(`/api/results?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setItems(json.data);
      }
    } catch (e) {
      console.error('Failed to load results', e);
    }
  }, [dateFrom, dateTo, selectedBankIds, banks.length, isLiveMode]);

  useEffect(() => {
    loadBanks();
    loadAlerts();
  }, [loadBanks, loadAlerts]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Start Scan handler
  const handleStartScan = async () => {
    try {
      setIsScanning(true);
      setScanProgress({ percent: 5, stage: 'Đang khởi tạo lượt quét...' });

      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_from: dateFrom,
          date_to: dateTo,
          selected_banks: selectedBankIds,
          source_types: [
            ...(scanSources.website ? (['website'] as const) : []),
            ...(scanSources.facebook ? (['facebook'] as const) : []),
          ],
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Không thể khởi tạo lượt quét');
      }

      const jobId = json.data.id;
      setActiveScanId(jobId);

      // Start polling for progress
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/scans/${jobId}`);
          const pollJson = await pollRes.json();
          if (pollJson.data) {
            const job: ScanJobDetail = pollJson.data;
            setScanProgress({
              percent: job.progressPercent,
              stage: job.currentStage,
              currentBankName: job.currentBankName,
            });

            if (job.status === 'completed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              setIsScanning(false);
              setActiveScanId(null);
              loadResults();
              showToast('🎉 Quét và tổng hợp dữ liệu thành công!');
            } else if (job.status === 'cancelled' || job.status === 'failed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              setIsScanning(false);
              setActiveScanId(null);
              showToast(job.status === 'cancelled' ? 'Lượt quét đã bị hủy' : 'Lượt quét gặp lỗi');
            }
          }
        } catch (pollErr) {
          console.error('Polling error', pollErr);
        }
      }, 600);
    } catch (err: any) {
      setIsScanning(false);
      showToast(`Lỗi: ${err.message}`);
    }
  };

  // Cancel Scan handler
  const handleCancelScan = async () => {
    if (!activeScanId) return;
    try {
      await fetch(`/api/scans/${activeScanId}/cancel`, { method: 'POST' });
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setIsScanning(false);
      setActiveScanId(null);
      setScanProgress({ percent: 0, stage: 'Đã hủy lượt quét' });
      showToast('Đã dừng lượt quét theo yêu cầu');
    } catch (e) {
      console.error('Cancel error', e);
    }
  };

  // Retry Alert handler
  const handleRetryAlert = async (alertId: string) => {
    try {
      setRetryingAlertId(alertId);
      const res = await fetch(`/api/alerts/${alertId}/retry`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        loadAlerts();
      } else {
        showToast(json.message || 'Thử lại thất bại');
      }
    } catch (e) {
      showToast('Lỗi khi thử lại kết nối');
    } finally {
      setRetryingAlertId(null);
    }
  };

  // Export CSV handler
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (selectedBankIds.length > 0 && selectedBankIds.length < banks.length) {
      params.append('bank_ids', selectedBankIds.join(','));
    }
    params.append('mode', isLiveMode ? 'live' : 'demo');

    window.open(`/api/results/export?${params.toString()}`, '_blank');
    showToast('Đang tải file CSV UTF-8...');
  };

  return (
    <div className="p-[16px_22px_32px] max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#0f2357] leading-tight m-0">
            Tổng hợp dữ liệu thị trường ngân hàng
          </h1>
          <p className="text-xs text-[#667085] mt-1 mb-0">
            Hệ thống quét, thu thập và đối chiếu sản phẩm/tính năng số đối thủ dành cho khách hàng Doanh nghiệp (SME & Corporate)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[11px] text-[#667085]">Thời gian máy chủ: </span>
            <span className="font-mono text-xs font-semibold text-[#0f2357]">
              {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Khu thiết lập lượt quét */}
      <ScanSetupPanel
        banks={banks}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        selectedBankIds={selectedBankIds}
        onSelectedBankIdsChange={setSelectedBankIds}
        scanSources={scanSources}
        onScanSourcesChange={setScanSources}
        isScanning={isScanning}
        scanProgress={scanProgress}
        onStartScan={handleStartScan}
        onCancelScan={handleCancelScan}
        isLiveMode={isLiveMode}
        onToggleLiveMode={() => setIsLiveMode(!isLiveMode)}
      />

      {/* 2. Thẻ thống kê 4 ô */}
      <SummaryStatCards
        items={items}
        totalSelectedBanks={selectedBankIds.length}
        alerts={alerts}
      />

      {/* 3. Cảnh báo nguồn lỗi */}
      <SourceAlertsBanner
        alerts={alerts}
        onRetryAlert={handleRetryAlert}
        isRetryingId={retryingAlertId}
      />

      {/* 4. Bảng tổng hợp dữ liệu theo ngân hàng */}
      <AggregatedResultsTable
        items={items}
        banks={banks}
        dateFrom={dateFrom}
        dateTo={dateTo}
        isLiveMode={isLiveMode}
        onExportCsv={handleExportCsv}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 bottom-6 bg-[#0f2357] text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-[#97b7ff]/30">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
