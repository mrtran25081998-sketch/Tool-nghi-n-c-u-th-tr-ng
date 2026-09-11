import hashlib
import logging
import os
from datetime import date
from .crawlers.base import RawItem
from .crawlers.website import WebsiteAdapter
from .crawlers.facebook import FacebookAdapter, FacebookProviderNotConfigured
from .classifier import classify_text

logger = logging.getLogger("worker")


def compute_content_hash(url: str, text: str) -> str:
    content = f"{url}:{text[:1000]}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


async def execute_crawl_job(job_id: str, date_from_str: str = "2024-01-01", date_to_str: str = "2024-12-31"):
    logger.info(f"Starting crawl job: {job_id}")

    try:
        d_from = date.fromisoformat(date_from_str)
        d_to = date.fromisoformat(date_to_str)
    except Exception:
        d_from = date(2024, 1, 1)
        d_to = date(2024, 12, 31)

    website_adapter = WebsiteAdapter(max_pages=3)
    facebook_adapter = FacebookAdapter()

    # Target banks to scan (Top 10 Vietnamese Banks - Corporate / Enterprise)
    sample_targets = [
        {"bank": "MB Bank", "type": "website", "url": "https://business.mbbank.com.vn"},
        {"bank": "BIDV", "type": "website", "url": "https://www.bidv.com.vn/vi/khach-hang-doanh-nghiep"},
        {"bank": "Vietcombank", "type": "website", "url": "https://www.vietcombank.com.vn/khach-hang-doanh-nghiep"},
        {"bank": "VietinBank", "type": "website", "url": "https://www.vietinbank.vn/web/home/vn/product/corporate"},
        {"bank": "Agribank", "type": "website", "url": "https://www.agribank.com.vn/vn/khach-hang-doanh-nghiep"},
        {"bank": "Techcombank", "type": "website", "url": "https://techcombank.com/khach-hang-doanh-nghiep"},
        {"bank": "ACB", "type": "website", "url": "https://www.acb.com.vn/san-pham-dich-vu/khach-hang-doanh-nghiep"},
        {"bank": "VPBank", "type": "website", "url": "https://www.vpbank.com.vn/doanh-nghiep"},
        {"bank": "SHB", "type": "website", "url": "https://www.shb.com.vn/khach-hang-doanh-nghiep"},
        {"bank": "Sacombank", "type": "website", "url": "https://www.sacombank.com.vn/doanh-nghiep"},
    ]

    all_raw_items: list[RawItem] = []

    for target in sample_targets:
        try:
            if target["type"] == "website":
                items = await website_adapter.fetch(target["url"], d_from, d_to)
                all_raw_items.extend(items)
        except Exception as e:
            logger.warning(f"Error crawling {target['url']}: {e}")

    try:
        fb_items = await facebook_adapter.fetch("https://www.facebook.com/techcombank", d_from, d_to)
        all_raw_items.extend(fb_items)
    except FacebookProviderNotConfigured:
        logger.info("Facebook provider not configured. Continuing with website discoveries.")
    except Exception as e:
        logger.warning(f"Facebook adapter error: {e}")

    # Deduplicate & Classify
    processed_items = []
    seen_hashes = set()

    for item in all_raw_items:
        h = compute_content_hash(item.url, item.text)
        if h in seen_hashes:
            continue
        seen_hashes.add(h)

        classification = classify_text(item.text, item.title)
        processed_items.append({
            "job_id": job_id,
            "url": item.url,
            "title": item.title,
            "content_hash": h,
            "relevant": classification.relevant,
            "group_name": classification.group_name,
            "component_name": classification.component_name,
            "feature_name": classification.feature_name,
            "summary": classification.summary,
            "confidence": classification.confidence,
        })

    logger.info(f"Job {job_id} completed. Discovered {len(processed_items)} items.")
    return processed_items
