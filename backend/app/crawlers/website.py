import hashlib
import logging
from datetime import date
from urllib.parse import urljoin, urlparse
import httpx
from bs4 import BeautifulSoup

try:
    import trafilatura
except ImportError:
    trafilatura = None

from .base import RawItem, SourceAdapter, validate_url_safe

logger = logging.getLogger("crawler.website")


class WebsiteAdapter(SourceAdapter):
    def __init__(self, max_pages: int = 5, timeout: int = 20):
        self.max_pages = max_pages
        self.timeout = timeout

    async def fetch(self, source_url: str, date_from: date, date_to: date) -> list[RawItem]:
        validate_url_safe(source_url)
        discovered_items: list[RawItem] = []
        urls_to_visit = [source_url]
        visited_urls = set()

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True, headers=headers) as client:
            # 1. Check sitemap / feed
            sitemap_url = urljoin(source_url, "/sitemap.xml")
            try:
                validate_url_safe(sitemap_url)
                r = await client.get(sitemap_url)
                if r.status_code == 200:
                    soup = BeautifulSoup(r.text, "xml")
                    locs = [loc.get_text(strip=True) for loc in soup.find_all("loc")]
                    for loc in locs[: self.max_pages]:
                        if loc not in urls_to_visit:
                            urls_to_visit.append(loc)
            except Exception:
                pass

            # 2. Fetch pages up to max_pages
            while urls_to_visit and len(visited_urls) < self.max_pages:
                target_url = urls_to_visit.pop(0)
                if target_url in visited_urls:
                    continue
                visited_urls.add(target_url)

                try:
                    validate_url_safe(target_url)
                    resp = await client.get(target_url)
                    if resp.status_code != 200:
                        continue

                    html = resp.text
                    soup = BeautifulSoup(html, "html.parser")
                    title = soup.title.get_text(strip=True) if soup.title else ""

                    text = ""
                    if trafilatura:
                        try:
                            text = trafilatura.extract(html) or ""
                        except Exception:
                            text = ""

                    if not text:
                        # Fallback to BeautifulSoup clean text
                        for tag in soup(["script", "style", "nav", "footer", "header"]):
                            tag.extract()
                        text = soup.get_text(separator=" ", strip=True)

                    if text:
                        discovered_items.append(
                            RawItem(
                                url=target_url,
                                title=title,
                                text=text[:5000],
                                source_type="website",
                            )
                        )
                except Exception as err:
                    logger.warning(f"Error fetching {target_url}: {err}")

        return discovered_items
