# Crawler Spec

## Website
Discover explicit URL, sitemap.xml, RSS/Atom, same-domain product/business/news pages. Fetch with httpx, fallback Playwright. Extract with trafilatura + BeautifulSoup.

## Facebook
Provider interface only. Implement Meta Graph when permissions exist or approved provider. No brittle HTML scraper as core implementation.

## Classifier output
```json
{
  "relevant": true,
  "group_name": "D. TÍN DỤNG",
  "component_name": "Cấp hạn mức",
  "feature_name": "Cấp hạn mức online",
  "summary": "...",
  "confidence": 0.91
}
```
