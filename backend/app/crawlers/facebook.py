import os
from datetime import date
import httpx
from .base import RawItem, SourceAdapter


class FacebookProviderNotConfigured(RuntimeError):
    """Raised when Meta Graph or approved FB provider is not configured."""
    pass


class FacebookAdapter(SourceAdapter):
    def __init__(self):
        self.provider = os.getenv("FACEBOOK_PROVIDER", "disabled")
        self.access_token = os.getenv("META_GRAPH_ACCESS_TOKEN", "")

    async def fetch(self, source_url: str, date_from: date, date_to: date) -> list[RawItem]:
        if self.provider == "disabled" or not self.access_token:
            raise FacebookProviderNotConfigured(
                "Facebook crawler requires META_GRAPH_ACCESS_TOKEN or approved provider configuration."
            )

        # Meta Graph API endpoint for public pages
        items: list[RawItem] = []
        page_id = source_url.rstrip("/").split("/")[-1]

        async with httpx.AsyncClient(timeout=20) as client:
            url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
            params = {
                "access_token": self.access_token,
                "fields": "id,message,created_time,permalink_url",
                "limit": 10,
            }
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for post in data:
                    msg = post.get("message", "")
                    if msg:
                        items.append(
                            RawItem(
                                url=post.get("permalink_url", source_url),
                                title=msg[:80] + "...",
                                text=msg,
                                published_at=post.get("created_time", ""),
                                source_type="facebook",
                            )
                        )

        return items
