/**
 * Background Scan Worker for Bank Market Intelligence
 * Concurrency limited to 3 sources at a time, timeout per source (25s),
 * transient retry, granular updates to scan_job_sources and scan_jobs in Supabase.
 */

import { getSupabaseAdmin, getSupabaseClient } from '@/lib/supabase';
import { crawlBankWebsite, WebCrawlResult } from './serverCrawler';
import { crawlBankFacebook, FacebookCrawlResult } from './facebookConnector';
import { store } from '@/lib/store';
import { ScanMetrics } from '@/types';

function getClient() {
  return getSupabaseAdmin() || getSupabaseClient();
}

function assertDb(result: { error?: { message?: string } | null }, operation: string) {
  if (result.error) {
    throw new Error(`DATABASE_WRITE_FAILED (${operation}): ${result.error.message || 'unknown error'}`);
  }
}

/**
 * Concurrency pool runner: limits concurrent promises to `concurrency`
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 3
): Promise<T[]> {
  const results: T[] = [];
  let executing: Promise<any>[] = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p as any);

    if (concurrency <= tasks.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

/**
 * Run a single source task with timeout and retry
 */
async function executeWithTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 40000,
  maxRetries: number = 0
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`SOURCE_TIMEOUT: Vượt quá thời gian chờ ${timeoutMs}ms`));
        }, timeoutMs);
        // Do not keep Node event loop open
        if (timer.unref) timer.unref();
      });

      return await Promise.race([fn(), timeoutPromise]);
    } catch (err: any) {
      lastError = err;
      // If fatal error or timeout, do not retry
      if (
        err.message?.includes('FACEBOOK_TOKEN_MISSING') ||
        err.message?.includes('INVALID_URL') ||
        err.message?.includes('SOURCE_TIMEOUT')
      ) {
        break;
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

const CANONICAL_BANK_WEBSITES: Record<string, string> = {
  '10000000-0000-0000-0000-000000000001': 'https://www.mbbank.com.vn/khach-hang-doanh-nghiep',
  '10000000-0000-0000-0000-000000000002': 'https://techcombank.com/khach-hang-doanh-nghiep',
  '10000000-0000-0000-0000-000000000003': 'https://www.vietinbank.vn/doanh-nghiep',
  '10000000-0000-0000-0000-000000000004': 'https://bidv.com.vn/vn/doanh-nghiep/',
  '10000000-0000-0000-0000-000000000005': 'https://www.vpbank.com.vn/doanh-nghiep',
  '10000000-0000-0000-0000-000000000006': 'https://acb.com.vn/doanh-nghiep',
  '10000000-0000-0000-0000-000000000007': 'https://www.sacombank.com.vn/doanh-nghiep.html',
  '10000000-0000-0000-0000-000000000008': 'https://www.shb.com.vn/category/khach-hang-doanh-nghiep/',
  '10000000-0000-0000-0000-000000000009': 'https://hdbank.com.vn/vi/corporate',
  '10000000-0000-0000-0000-000000000010': 'https://tpb.vn/doanh-nghiep',
  '10000000-0000-0000-0000-000000000011': 'https://www.vib.com.vn/vn/khach-hang-doanh-nghiep',
  '10000000-0000-0000-0000-000000000012': 'https://www.msb.com.vn/vi/doanh-nghiep',
  '10000000-0000-0000-0000-000000000013': 'https://ocb.com.vn/vi/doanh-nghiep',
  '10000000-0000-0000-0000-000000000014': 'https://www.seabank.com.vn/doanh-nghiep.2',
  '10000000-0000-0000-0000-000000000015': 'https://www.agribank.com.vn/vn/doanh-nghiep',
  '10000000-0000-0000-0000-000000000016': 'https://www.vietcombank.com.vn/vi-VN/To-chuc/SMEs',
  MB: 'https://www.mbbank.com.vn/khach-hang-doanh-nghiep',
  TCB: 'https://techcombank.com/khach-hang-doanh-nghiep',
  CTG: 'https://www.vietinbank.vn/doanh-nghiep',
  BIDV: 'https://bidv.com.vn/vn/doanh-nghiep/',
  VPB: 'https://www.vpbank.com.vn/doanh-nghiep',
  ACB: 'https://acb.com.vn/doanh-nghiep',
  STB: 'https://www.sacombank.com.vn/doanh-nghiep.html',
  SHB: 'https://www.shb.com.vn/category/khach-hang-doanh-nghiep/',
  HDB: 'https://hdbank.com.vn/vi/corporate',
  TPB: 'https://tpb.vn/doanh-nghiep',
  VIB: 'https://www.vib.com.vn/vn/khach-hang-doanh-nghiep',
  MSB: 'https://www.msb.com.vn/vi/doanh-nghiep',
  OCB: 'https://ocb.com.vn/vi/doanh-nghiep',
  SSB: 'https://www.seabank.com.vn/doanh-nghiep.2',
  AGR: 'https://www.agribank.com.vn/vn/doanh-nghiep',
  VCB: 'https://www.vietcombank.com.vn/vi-VN/To-chuc/SMEs',
};

/**
 * Main Background Scan Worker function
 */
async function runScanWorkerInternal(scanId: string): Promise<void> {
  const supabase = getClient();
  console.log(`[ScanWorker] 🚀 Starting background worker for scan ${scanId}`);

  // 1. Fetch scan job record
  let scanJob: any;
  if (supabase) {
    const { data, error } = await supabase
      .from('scan_jobs')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error) {
      console.error(`[ScanWorker] Error fetching scan_jobs ${scanId}:`, error.message);
      throw new Error(`Database error fetching scan_job: ${error.message}`);
    }
    scanJob = data;
  } else {
    scanJob = await store.getScanJobDetail(scanId);
  }

  if (!scanJob) {
    console.error(`[ScanWorker] Scan job ${scanId} not found`);
    return;
  }

  // 2. Fetch scan job sources
  let jobSources: any[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from('scan_job_sources')
      .select('*')
      .eq('scan_id', scanId);

    if (error) {
      console.error(`[ScanWorker] Error fetching scan_job_sources:`, error.message);
      throw new Error(`Database error: ${error.message}`);
    }
    jobSources = data || [];
  }

  // If no jobSources created in DB yet, create them from selectedBanks and sourceTypes
  if (jobSources.length === 0) {
    const selectedBanks = scanJob.selected_banks || scanJob.selectedBanks || [];
    const sourceTypes = scanJob.source_types || scanJob.sourceTypes || ['website'];
    const allBanks = await store.getBanks();

    for (const bId of selectedBanks) {
      const bank = allBanks.find((b) => b.id === bId);
      for (const sType of sourceTypes) {
        const item = {
          scan_id: scanId,
          bank_id: bId,
          bank_name: bank?.name || 'Ngân hàng',
          source_type: sType,
          status: 'queued',
          items_found: 0,
        };
        jobSources.push(item);
        if (supabase) {
          assertDb(await supabase.from('scan_job_sources').insert(item), 'insert scan_job_sources');
        }
      }
    }
  }

  // Update scan_jobs status to running
  if (supabase) {
    assertDb(await supabase.from('scan_jobs').update({
      status: 'running',
      current_stage: 'Bắt đầu quét các nguồn...',
      progress_percent: 5,
    }).eq('id', scanId), 'mark scan running');
  }

  // 3. Prepare bank sources lookup
  const bankSourcesList = await store.getSourcePairs();
  const allBanksList = await store.getBanks();

  const totalSources = jobSources.length;
  let completedSources = 0;
  let totalSavedItems = 0;
  let totalFailedSources = 0;
  let facebookTokenAlertLogged = false;

  const aggregatedMetrics: ScanMetrics = {
    selectedBanks: (scanJob.selected_banks || scanJob.selectedBanks || []).length,
    selectedSources: totalSources,
    sourcesAttempted: 0,
    sourcesSucceeded: 0,
    sourcesFailed: 0,
    pagesDiscovered: 0,
    pagesFetched: 0,
    itemsParsed: 0,
    itemsAccepted: 0,
    itemsRejectedByDate: 0,
    itemsRejectedByAudience: 0,
    itemsMissingDate: 0,
    itemsDeduplicated: 0,
    itemsSaved: 0,
  };

  // 4. Create tasks with Concurrency = 3
  const tasks = jobSources.map((js) => async () => {
    const bankId = js.bank_id;
    const sourceType = js.source_type;
    const bank = allBanksList.find((b) => b.id === bankId);
    const bankName = bank?.name || js.bank_name || 'Ngân hàng';
    const sourceConfig = bankSourcesList.find((s) => s.bank_id === bankId);

    // Mark source running
    if (supabase) {
      assertDb(await supabase.from('scan_job_sources').update({
        status: 'running',
        started_at: new Date().toISOString(),
      }).match({ scan_id: scanId, bank_id: bankId, source_type: sourceType }), 'mark source running');
    }

    aggregatedMetrics.sourcesAttempted++;

    let crawlSuccess = false;
    let itemsFound = 0;
    let pagesDiscovered = 0;
    let pagesFetched = 0;
    let itemsParsed = 0;
    let itemsRejected = 0;
    let errorCode: string | undefined;
    let errorMessage: string | undefined;
    let httpStatus = 200;

    try {
      if (sourceType === 'website') {
        const fallbackUrl = CANONICAL_BANK_WEBSITES[bankId] || CANONICAL_BANK_WEBSITES[bank?.code || ''] || '';
        const websiteUrl = sourceConfig?.business_hub_url || sourceConfig?.website_url || fallbackUrl;
        const webResult: WebCrawlResult = await executeWithTimeoutAndRetry(() =>
          crawlBankWebsite({
            bankId,
            bankName,
            corporateHomepageUrl: websiteUrl,
            businessHubUrl: sourceConfig?.business_hub_url || fallbackUrl,
            newsUrls: sourceConfig?.news_urls,
            promotionUrls: sourceConfig?.promotion_urls,
            sitemapUrl: sourceConfig?.sitemap_url,
            rssUrl: sourceConfig?.rss_url,
            allowedDomains: sourceConfig?.allowed_domains,
            renderMode: sourceConfig?.render_mode,
            adaptorName: sourceConfig?.adaptor_name,
            dateFrom: scanJob.date_from || scanJob.dateFrom,
            dateTo: scanJob.date_to || scanJob.dateTo,
            maxPages: 8,
          })
        );

        pagesDiscovered = webResult.pagesDiscovered;
        pagesFetched = webResult.pagesFetched;
        itemsParsed = webResult.itemsParsed;
        itemsRejected = webResult.itemsRejectedByDate + webResult.itemsRejectedByAudience;
        httpStatus = webResult.httpStatus;

        aggregatedMetrics.pagesDiscovered += pagesDiscovered;
        aggregatedMetrics.pagesFetched += pagesFetched;
        aggregatedMetrics.itemsParsed += itemsParsed;
        aggregatedMetrics.itemsRejectedByDate += webResult.itemsRejectedByDate;
        aggregatedMetrics.itemsRejectedByAudience += webResult.itemsRejectedByAudience;
        aggregatedMetrics.itemsMissingDate += webResult.itemsMissingDate;

        if (webResult.status === 'failed') {
          errorCode = webResult.errorCode || 'FETCH_FAILED';
          errorMessage = webResult.errorMessage || 'Quét website thất bại';
        } else {
          crawlSuccess = true;
          // Persist verified items
          for (const art of webResult.articles) {
            if (supabase) {
              const hash = Buffer.from(art.url || crypto.randomUUID()).toString('base64url');
              const itemPayload = {
                org_id: '00000000-0000-0000-0000-000000000001',
                scan_id: scanId,
                bank_id: bankId,
                bank_name: bankName,
                source_type: 'website',
                source_url: art.url,
                canonical_url: art.url,
                title: art.title,
                summary: art.description || art.content.slice(0, 250),
                category: art.category,
                audience: art.audience,
                published_at: art.publishedAt,
                effective_from: art.effectiveFrom,
                effective_to: art.effectiveTo,
                date_source: art.dateSource,
                verification_status: 'verified',
                confidence_score: art.confidenceScore,
                evidence_text: art.content.slice(0, 500),
                website_url: art.url,
                source_types: ['website'],
                content_hash: hash,
                status: 'accepted',
                collected_at: new Date().toISOString(),
              };

              const { data: existingItem } = await supabase
                .from('crawl_items')
                .select('id')
                .eq('scan_id', scanId)
                .eq('canonical_url', art.url)
                .maybeSingle();

              let itemRowId: string;
              if (existingItem?.id) {
                itemRowId = existingItem.id;
                const { error: upErr } = await supabase.from('crawl_items').update(itemPayload).eq('id', itemRowId);
                if (upErr) throw new Error(`DATABASE_WRITE_FAILED (website item update): ${upErr.message}`);
              } else {
                const { data: inserted, error: inErr } = await supabase.from('crawl_items').insert(itemPayload).select('id').single();
                if (inErr) throw new Error(`DATABASE_WRITE_FAILED (website item insert): ${inErr.message}`);
                if (!inserted?.id) throw new Error('DATABASE_WRITE_FAILED (website item): missing id');
                itemRowId = inserted.id;
              }

              const sourcePayload = {
                crawl_item_id: itemRowId,
                scan_id: scanId,
                source_type: 'website',
                url: art.url,
                title: art.title,
                published_at: art.publishedAt ? new Date(art.publishedAt).toISOString() : null,
                evidence_text: art.content.slice(0, 300),
                is_verified: true,
              };

              const { data: existingSource } = await supabase
                .from('crawl_item_sources')
                .select('id')
                .eq('crawl_item_id', itemRowId)
                .eq('source_type', 'website')
                .eq('url', art.url)
                .maybeSingle();

              if (existingSource?.id) {
                await supabase.from('crawl_item_sources').update(sourcePayload).eq('id', existingSource.id);
              } else {
                const sourceWrite = await supabase.from('crawl_item_sources').insert(sourcePayload);
                assertDb(sourceWrite, 'website item source');
              }
            }
            itemsFound++;
            totalSavedItems++;
          }

          // Persist candidate audits
          if (supabase && webResult.candidateAudit && webResult.candidateAudit.length > 0) {
            const auditRows = webResult.candidateAudit.map((ca) => ({
              scan_id: scanId,
              bank_id: bankId,
              bank_name: bankName,
              source_type: 'website',
              url: ca.url,
              title: ca.title,
              page_type: ca.pageType,
              accepted: ca.accepted,
              rejection_reason: ca.rejectionReason,
              published_at: ca.publishedAt,
              effective_from: ca.effectiveFrom,
              effective_to: ca.effectiveTo,
              audience: ca.audience,
            }));
            assertDb(await supabase.from('candidate_audits').insert(auditRows), 'candidate audits');
          }
        }
      } else if (sourceType === 'facebook') {
        const facebookUrl = sourceConfig?.facebook_url || '';
        const facebookPageId = sourceConfig?.facebook_page_id || '';

        const fbResult: FacebookCrawlResult = await executeWithTimeoutAndRetry(() =>
          crawlBankFacebook({
            bankId,
            bankName,
            facebookUrl,
            facebookPageId,
            dateFrom: scanJob.date_from || scanJob.dateFrom,
            dateTo: scanJob.date_to || scanJob.dateTo,
          })
        );

        pagesDiscovered = fbResult.pagesDiscovered;
        pagesFetched = fbResult.pagesFetched;
        itemsParsed = fbResult.itemsParsed;
        itemsRejected = fbResult.itemsRejectedByDate + fbResult.itemsRejectedByAudience;
        httpStatus = fbResult.httpStatus;

        aggregatedMetrics.pagesDiscovered += pagesDiscovered;
        aggregatedMetrics.pagesFetched += pagesFetched;
        aggregatedMetrics.itemsParsed += itemsParsed;
        aggregatedMetrics.itemsRejectedByDate += fbResult.itemsRejectedByDate;
        aggregatedMetrics.itemsRejectedByAudience += fbResult.itemsRejectedByAudience;

        if (fbResult.status === 'failed') {
          errorCode = fbResult.errorCode || 'FACEBOOK_FAILED';
          errorMessage = fbResult.errorMessage || 'Quét Fanpage Facebook thất bại';
        } else {
          crawlSuccess = true;
          for (const art of fbResult.articles) {
            if (supabase) {
              const hash = Buffer.from(art.url || crypto.randomUUID()).toString('base64url');
              const itemPayload = {
                org_id: '00000000-0000-0000-0000-000000000001',
                scan_id: scanId,
                bank_id: bankId,
                bank_name: bankName,
                source_type: 'facebook',
                source_url: art.url,
                canonical_url: art.url,
                title: art.title,
                summary: art.description || art.content.slice(0, 250),
                category: art.category,
                audience: art.audience,
                published_at: art.publishedAt,
                effective_from: art.effectiveFrom,
                effective_to: art.effectiveTo,
                date_source: art.dateSource,
                verification_status: 'verified',
                confidence_score: art.confidenceScore,
                evidence_text: art.content.slice(0, 500),
                facebook_url: art.url,
                source_types: ['facebook'],
                content_hash: hash,
                status: 'accepted',
                collected_at: new Date().toISOString(),
              };

              const { data: existingItem } = await supabase
                .from('crawl_items')
                .select('id')
                .eq('scan_id', scanId)
                .eq('canonical_url', art.url)
                .maybeSingle();

              let itemRowId: string;
              if (existingItem?.id) {
                itemRowId = existingItem.id;
                const { error: upErr } = await supabase.from('crawl_items').update(itemPayload).eq('id', itemRowId);
                if (upErr) throw new Error(`DATABASE_WRITE_FAILED (facebook item update): ${upErr.message}`);
              } else {
                const { data: inserted, error: inErr } = await supabase.from('crawl_items').insert(itemPayload).select('id').single();
                if (inErr) throw new Error(`DATABASE_WRITE_FAILED (facebook item insert): ${inErr.message}`);
                if (!inserted?.id) throw new Error('DATABASE_WRITE_FAILED (facebook item): missing id');
                itemRowId = inserted.id;
              }

              const sourcePayload = {
                crawl_item_id: itemRowId,
                scan_id: scanId,
                source_type: 'facebook',
                url: art.url,
                permalink_url: art.url,
                title: art.title,
                published_at: art.publishedAt ? new Date(art.publishedAt).toISOString() : null,
                evidence_text: art.content.slice(0, 300),
                is_verified: true,
              };

              const { data: existingSource } = await supabase
                .from('crawl_item_sources')
                .select('id')
                .eq('crawl_item_id', itemRowId)
                .eq('source_type', 'facebook')
                .eq('url', art.url)
                .maybeSingle();

              if (existingSource?.id) {
                await supabase.from('crawl_item_sources').update(sourcePayload).eq('id', existingSource.id);
              } else {
                const sourceWrite = await supabase.from('crawl_item_sources').insert(sourcePayload);
                assertDb(sourceWrite, 'facebook item source');
              }
            }
            itemsFound++;
            totalSavedItems++;
          }
        }
      }
    } catch (err: any) {
      errorCode = err.message?.includes('SOURCE_TIMEOUT') ? 'SOURCE_TIMEOUT' : 'SOURCE_EXECUTION_ERROR';
      errorMessage = err.message || 'Lỗi xử lý nguồn';
      httpStatus = 500;
    }

    completedSources++;
    const finalSourceStatus = crawlSuccess ? (itemsFound > 0 ? 'success' : 'partial') : 'failed';

    if (finalSourceStatus === 'failed') {
      totalFailedSources++;
      aggregatedMetrics.sourcesFailed++;

      // Save alert to source_alerts
      if (supabase) {
        const targetBankId = sourceType === 'facebook' && errorCode === 'FACEBOOK_TOKEN_MISSING' ? 'ALL_BANKS' : bankId;

        // Resolve previous unresolved alerts for this bank + source_type before inserting new
        await supabase
          .from('source_alerts')
          .update({ resolved: true })
          .match({ bank_id: targetBankId, source_type: sourceType, resolved: false });

        if (sourceType === 'facebook' && errorCode === 'FACEBOOK_TOKEN_MISSING') {
          if (!facebookTokenAlertLogged) {
            facebookTokenAlertLogged = true;
            assertDb(await supabase.from('source_alerts').insert({
              org_id: '00000000-0000-0000-0000-000000000001',
              scan_id: scanId,
              bank_id: 'ALL_BANKS',
              bank_name: 'Fanpage Facebook (Tất cả ngân hàng)',
              source_type: sourceType,
              error_cause: 'FACEBOOK_TOKEN_MISSING: Chưa cấu hình FACEBOOK_ACCESS_TOKEN trên máy chủ. Bỏ chọn Facebook nếu chỉ muốn quét Website.',
              http_status: 401,
              checked_at: new Date().toISOString(),
              resolved: false,
            }), 'source alert');
          }
        } else {
          assertDb(await supabase.from('source_alerts').insert({
            org_id: '00000000-0000-0000-0000-000000000001',
            scan_id: scanId,
            bank_id: bankId,
            bank_name: bankName,
            source_type: sourceType,
            error_cause: errorCode || errorMessage || 'Lỗi không xác định',
            http_status: httpStatus,
            checked_at: new Date().toISOString(),
            resolved: false,
          }), 'source alert');
        }
      }
    } else {
      aggregatedMetrics.sourcesSucceeded++;
      aggregatedMetrics.itemsSaved += itemsFound;

      // Resolve prior alerts if this source now succeeds
      if (supabase) {
        await supabase
          .from('source_alerts')
          .update({ resolved: true })
          .match({ bank_id: bankId, source_type: sourceType, resolved: false });
      }
    }

    // Update scan_job_sources in Supabase
    if (supabase) {
      assertDb(await supabase.from('scan_job_sources').update({
        status: finalSourceStatus,
        items_found: itemsFound,
        pages_discovered: pagesDiscovered,
        pages_fetched: pagesFetched,
        items_parsed: itemsParsed,
        items_rejected: itemsRejected,
        error_code: errorCode,
        error_message: errorMessage,
        http_status: httpStatus,
        finished_at: new Date().toISOString(),
      }).match({ scan_id: scanId, bank_id: bankId, source_type: sourceType }), 'finish source');
    }

    // Granular update to scan_jobs progress after each source
    const percent = Math.min(98, Math.round((completedSources / totalSources) * 100));
    const stageDesc = `Đã quét ${completedSources}/${totalSources} nguồn: ${bankName} (${sourceType === 'website' ? 'Website' : 'Facebook'})`;

    if (supabase) {
      assertDb(await supabase.from('scan_jobs').update({
        progress_percent: percent,
        current_stage: stageDesc,
        current_bank_name: bankName,
        total_found: totalSavedItems,
        metrics: {
          ...aggregatedMetrics,
          itemsSaved: totalSavedItems,
          sourceErrors: totalFailedSources,
        },
      }).eq('id', scanId), 'update scan progress');
    }
  });

  // 5. Run all tasks with concurrency limit = 3
  await runWithConcurrency(tasks, 3);

  // 6. Determine final scan job status
  let finalStatus: 'completed' | 'partial' | 'failed' | 'empty' = 'completed';
  if (totalSavedItems === 0 && totalFailedSources === totalSources) {
    finalStatus = 'failed';
  } else if (totalSavedItems > 0 && totalFailedSources > 0) {
    finalStatus = 'partial';
  } else if (totalSavedItems === 0) {
    finalStatus = 'empty';
  }

  const finalStage =
    finalStatus === 'failed'
      ? `Lượt quét thất bại (${totalFailedSources} nguồn lỗi kết nối)`
      : `Hoàn tất quét: Thu thập ${totalSavedItems} nội dung`;

  if (supabase) {
    assertDb(await supabase.from('scan_jobs').update({
      status: finalStatus,
      progress_percent: 100,
      current_stage: finalStage,
      finished_at: new Date().toISOString(),
      total_found: totalSavedItems,
      metrics: {
        ...aggregatedMetrics,
        itemsSaved: totalSavedItems,
        sourceErrors: totalFailedSources,
      },
    }).eq('id', scanId), 'finish scan');
  }

  console.log(`[ScanWorker] 🏁 Scan ${scanId} finished with status: ${finalStatus}, items: ${totalSavedItems}, errors: ${totalFailedSources}`);
}

/**
 * Public entry point. A fatal worker/database error must be visible in the job
 * record; otherwise the UI waits forever on a misleading `queued` status.
 */
export async function runScanWorker(scanId: string): Promise<void> {
  try {
    await runScanWorkerInternal(scanId);
  } catch (error: any) {
    const message = error?.message || 'Lỗi worker không xác định';
    const supabase = getClient();
    if (supabase) {
      const result = await supabase
        .from('scan_jobs')
        .update({
          status: 'failed',
          progress_percent: 100,
          current_stage: `Lượt quét thất bại: ${message}`.slice(0, 500),
          error_summary: message.slice(0, 1000),
          finished_at: new Date().toISOString(),
        })
        .eq('id', scanId);
      if (result.error) {
        console.error(`[ScanWorker] Could not mark ${scanId} failed:`, result.error.message);
      }
    }
    throw error;
  }
}
