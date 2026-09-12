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
  timeoutMs: number = 25000,
  maxRetries: number = 2
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
      // If fatal token missing error, do not retry
      if (err.message?.includes('FACEBOOK_TOKEN_MISSING') || err.message?.includes('INVALID_URL')) {
        break;
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Main Background Scan Worker function
 */
export async function runScanWorker(scanId: string): Promise<void> {
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
          await supabase.from('scan_job_sources').insert(item);
        }
      }
    }
  }

  // Update scan_jobs status to running
  if (supabase) {
    await supabase.from('scan_jobs').update({
      status: 'running',
      current_stage: 'Bắt đầu quét các nguồn...',
      progress_percent: 5,
    }).eq('id', scanId);
  }

  // 3. Prepare bank sources lookup
  const bankSourcesList = await store.getSourcePairs();
  const allBanksList = await store.getBanks();

  const totalSources = jobSources.length;
  let completedSources = 0;
  let totalSavedItems = 0;
  let totalFailedSources = 0;

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
      await supabase.from('scan_job_sources').update({
        status: 'running',
        started_at: new Date().toISOString(),
      }).match({ scan_id: scanId, bank_id: bankId, source_type: sourceType });
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
        const websiteUrl = sourceConfig?.business_hub_url || sourceConfig?.website_url || '';
        const webResult: WebCrawlResult = await executeWithTimeoutAndRetry(() =>
          crawlBankWebsite({
            bankId,
            bankName,
            corporateHomepageUrl: websiteUrl,
            businessHubUrl: sourceConfig?.business_hub_url,
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
            itemsFound++;
            totalSavedItems++;
            if (supabase) {
              const { data: itemData, error: itemErr } = await supabase.from('crawl_items').upsert(
                {
                  org_id: '00000000-0000-0000-0000-000000000001',
                  scan_id: scanId,
                  bank_id: bankId,
                  bank_name: bankName,
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
                  collected_at: new Date().toISOString(),
                },
                { onConflict: 'scan_id,bank_id,canonical_url' }
              ).select('id').single();

              if (!itemErr && itemData?.id) {
                await supabase.from('crawl_item_sources').upsert(
                  {
                    crawl_item_id: itemData.id,
                    scan_id: scanId,
                    source_type: 'website',
                    url: art.url,
                    title: art.title,
                    published_at: art.publishedAt ? new Date(art.publishedAt).toISOString() : null,
                    evidence_text: art.content.slice(0, 300),
                    is_verified: true,
                  },
                  { onConflict: 'crawl_item_id,source_type,url' }
                );
              }
            }
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
            await supabase.from('candidate_audits').insert(auditRows);
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
            itemsFound++;
            totalSavedItems++;
            if (supabase) {
              const { data: itemData, error: itemErr } = await supabase.from('crawl_items').upsert(
                {
                  org_id: '00000000-0000-0000-0000-000000000001',
                  scan_id: scanId,
                  bank_id: bankId,
                  bank_name: bankName,
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
                  collected_at: new Date().toISOString(),
                },
                { onConflict: 'scan_id,bank_id,canonical_url' }
              ).select('id').single();

              if (!itemErr && itemData?.id) {
                await supabase.from('crawl_item_sources').upsert(
                  {
                    crawl_item_id: itemData.id,
                    scan_id: scanId,
                    source_type: 'facebook',
                    url: art.url,
                    permalink_url: art.url,
                    title: art.title,
                    published_at: art.publishedAt ? new Date(art.publishedAt).toISOString() : null,
                    evidence_text: art.content.slice(0, 300),
                    is_verified: true,
                  },
                  { onConflict: 'crawl_item_id,source_type,url' }
                );
              }
            }
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
        await supabase.from('source_alerts').insert({
          org_id: '00000000-0000-0000-0000-000000000001',
          scan_id: scanId,
          bank_id: bankId,
          bank_name: bankName,
          source_type: sourceType,
          error_cause: errorCode || errorMessage || 'Lỗi không xác định',
          http_status: httpStatus,
          checked_at: new Date().toISOString(),
          resolved: false,
        });
      }
    } else {
      aggregatedMetrics.sourcesSucceeded++;
      aggregatedMetrics.itemsSaved += itemsFound;
    }

    // Update scan_job_sources in Supabase
    if (supabase) {
      await supabase.from('scan_job_sources').update({
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
      }).match({ scan_id: scanId, bank_id: bankId, source_type: sourceType });
    }

    // Granular update to scan_jobs progress after each source
    const percent = Math.min(98, Math.round((completedSources / totalSources) * 100));
    const stageDesc = `Đã quét ${completedSources}/${totalSources} nguồn: ${bankName} (${sourceType === 'website' ? 'Website' : 'Facebook'})`;

    if (supabase) {
      await supabase.from('scan_jobs').update({
        progress_percent: percent,
        current_stage: stageDesc,
        current_bank_name: bankName,
        total_found: totalSavedItems,
        metrics: {
          ...aggregatedMetrics,
          itemsSaved: totalSavedItems,
          sourceErrors: totalFailedSources,
        },
      }).eq('id', scanId);
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
    await supabase.from('scan_jobs').update({
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
    }).eq('id', scanId);
  }

  console.log(`[ScanWorker] 🏁 Scan ${scanId} finished with status: ${finalStatus}, items: ${totalSavedItems}, errors: ${totalFailedSources}`);
}
