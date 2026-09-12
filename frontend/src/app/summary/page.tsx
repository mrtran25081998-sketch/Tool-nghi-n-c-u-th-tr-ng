'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bank, IntelligenceItem, SourceAlert, ScanJobDetail, ScanMetrics, SourceExecutionResult, CandidateAuditItem } from '@/types';
import ScanSetupPanel from '@/components/summary/ScanSetupPanel';
import SummaryStatCards from '@/components/summary/SummaryStatCards';
import SourceAlertsBanner from '@/components/summary/SourceAlertsBanner';
import AggregatedResultsTable from '@/components/summary/AggregatedResultsTable';
import ScanDebugReport from '@/components/summary/ScanDebugReport';

export default function SummaryPage() {
  // 1. Core State
  const [banks, setBanks] = useState<Bank[]>([]);
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [alerts, setAlerts] = useState<SourceAlert[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2. Scan Filter State
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [scanSources, setScanSources] = useState<{ website: boolean; facebook: boolean }>({
    website: true,
    facebook: false,
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
  const [lastScanReport, setLastScanReport] = useState<{
    scanId?: string;
    metrics?: ScanMetrics;
    sourceResults?: SourceExecutionResult[];
    rejectedCandidates?: CandidateAuditItem[];
    status?: string;
  } | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Banks list from Cấu hình nguồn API
  const loadBanks = useCallback(async () => {
    try {
      setIsLoadingBanks(true);
      setBanksError(null);
      const res = await fetch('/api/banks');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        setBanks(json.data);
        const activeBanks = json.data.filter((b: Bank) => b.active !== false);
        setSelectedBankIds(activeBanks.map((b: Bank) => b.id));
      } else {
        throw new Error('Danh sách cấu hình nguồn trống');
      }
    } catch (e: any) {
      console.error('Failed to load banks', e);
      setBanksError('Không tải được cấu hình nguồn');
    } finally {
      setIsLoadingBanks(false);
    }
  }, []);

  // Load Source Alerts (scoped to scanId if provided)
  const loadAlerts = useCallback(async (scanId?: string) => {
    try {
      const url = scanId ? `/api/alerts?scan_id=${encodeURIComponent(scanId)}` : '/api/alerts';
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setAlerts(json.data.filter((a: SourceAlert) => !a.resolved));
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
      // Strict Scan Isolation: Clear previous scan items and report immediately!
      setItems([]);
      setScanProgress({ percent: 5, stage: 'Đang khởi tạo lượt quét...' });

      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromDate: dateFrom,
          toDate: dateTo,
          bankIds: selectedBankIds,
          sourceTypes: [
            ...(scanSources.website ? (['website'] as const) : []),
            ...(scanSources.facebook ? (['facebook'] as const) : []),
          ],
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Không thể khởi tạo lượt quét');
      }

      if (json.warning) {
        showToast(`⚠️ ${json.warning}`);
      }

      const job: ScanJobDetail = json.data;
      const jobId = job.id;

      const onScanComplete = async (completedJob: ScanJobDetail, sourcePayload?: any) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsScanning(false);
        setActiveScanId(null);
        setScanProgress({
          percent: 100,
          stage: completedJob.currentStage || 'Quét hoàn tất!',
          currentBankName: '',
        });
        setLastScanReport({
          scanId: completedJob.id,
          metrics: sourcePayload?.metrics || completedJob.metrics,
          sourceResults: sourcePayload?.sourceResults || completedJob.sourceResults,
          rejectedCandidates: sourcePayload?.rejectedCandidates || completedJob.rejectedCandidates,
          status: sourcePayload?.status || completedJob.status,
        });

        // Fetch verified scan results directly from results endpoint
        let fetchedItems: IntelligenceItem[] = [];
        try {
          const resResults = await fetch(`/api/scans/${completedJob.id}/results?mode=${isLiveMode ? 'live' : 'demo'}`);
          const jsonResults = await resResults.json();
          if (jsonResults.success && Array.isArray(jsonResults.items)) {
            fetchedItems = jsonResults.items;
          }
          if (jsonResults.rejectedCandidates && (!sourcePayload?.rejectedCandidates || sourcePayload.rejectedCandidates.length === 0)) {
            setLastScanReport((prev) => (prev ? { ...prev, rejectedCandidates: jsonResults.rejectedCandidates } : null));
          }
        } catch (e) {
          console.error('Failed to fetch scan results', e);
        }

        if (fetchedItems.length === 0 && sourcePayload?.items && sourcePayload.items.length > 0) {
          fetchedItems = sourcePayload.items;
        }

        const savedCount = (sourcePayload?.metrics || completedJob.metrics)?.itemsSaved || 0;
        if (savedCount > 0 && fetchedItems.length === 0) {
          showToast('Lỗi kỹ thuật: Dữ liệu đã lưu nhưng không đọc được (Data Contract Error)');
          setLastScanReport((prev) => (prev ? { ...prev, status: 'data_contract_error' } : null));
        } else {
          setItems(fetchedItems);
        }

        // Only load alerts of this current scan
        loadAlerts(completedJob.id);

        showToast(
          savedCount > 0
            ? `🎉 Quét hoàn tất: Thu thập ${savedCount} nội dung doanh nghiệp!`
            : 'Lượt quét hoàn thành (0 kết quả phù hợp với khoảng ngày/bộ lọc)'
        );
      };

      if (['completed', 'success', 'partial', 'empty'].includes(job.status)) {
        await onScanComplete(job, json);
        return;
      } else if (job.status === 'failed') {
        setIsScanning(false);
        setActiveScanId(null);
        setItems([]);
        setLastScanReport({
          scanId: job.id,
          metrics: json.metrics || job.metrics,
          sourceResults: json.sourceResults || job.sourceResults,
          rejectedCandidates: json.rejectedCandidates || job.rejectedCandidates,
          status: 'failed',
        });
        loadAlerts(job.id);
        const failMsg = job.currentStage || 'Lượt quét thất bại (Không có nguồn nào kết nối thành công)';
        showToast(failMsg);
        return;
      }

      setActiveScanId(jobId);

      // Start polling for progress
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/scans/${jobId}`);
          const pollJson = await pollRes.json();
          if (pollJson.data) {
            const currentJob: ScanJobDetail = pollJson.data;
            setScanProgress({
              percent: currentJob.progressPercent,
              stage: currentJob.currentStage,
              currentBankName: currentJob.currentBankName,
            });

            if (['completed', 'success', 'partial', 'empty'].includes(currentJob.status)) {
              await onScanComplete(currentJob, pollJson);
            } else if (currentJob.status === 'cancelled' || currentJob.status === 'failed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              setIsScanning(false);
              setActiveScanId(null);
              // Strict Scan Isolation: Keep items empty on failure
              setItems([]);
              setLastScanReport({
                scanId: currentJob.id,
                metrics: pollJson.metrics || currentJob.metrics,
                sourceResults: pollJson.sourceResults || currentJob.sourceResults,
                rejectedCandidates: pollJson.rejectedCandidates || currentJob.rejectedCandidates,
                status: pollJson.status || currentJob.status,
              });
              loadAlerts(currentJob.id);
              const failMsg = currentJob.currentStage || 'Lượt quét thất bại (Không có nguồn nào kết nối thành công)';
              showToast(currentJob.status === 'cancelled' ? 'Lượt quét đã bị hủy' : failMsg);
            }
          }
        } catch (pollErr) {
          console.error('Polling error', pollErr);
        }
      }, 1000);
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
        loadAlerts(activeScanId || lastScanReport?.scanId);
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
    const effectiveScanId = activeScanId || lastScanReport?.scanId;
    if (effectiveScanId) params.append('scan_id', effectiveScanId);
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
        isLoadingBanks={isLoadingBanks}
        banksError={banksError}
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
        sourceErrors={lastScanReport?.metrics?.sourceErrors ?? lastScanReport?.metrics?.sourcesFailed}
        isLoadingBanks={isLoadingBanks}
      />

      {/* 3. Cảnh báo nguồn lỗi */}
      <SourceAlertsBanner
        alerts={alerts}
        onRetryAlert={handleRetryAlert}
        isRetryingId={retryingAlertId}
      />

      {/* 4. Báo cáo kiểm soát kỹ thuật & Debug lượt quét */}
      <ScanDebugReport
        metrics={lastScanReport?.metrics}
        sourceResults={lastScanReport?.sourceResults}
        rejectedCandidates={lastScanReport?.rejectedCandidates}
        scanStatus={lastScanReport?.status}
        totalItems={items.length}
      />

      {/* 5. Bảng tổng hợp dữ liệu theo ngân hàng */}
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
