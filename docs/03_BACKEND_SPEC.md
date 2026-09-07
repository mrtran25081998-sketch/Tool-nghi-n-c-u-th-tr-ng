# Backend Spec

## Next.js BFF
Auth, CRUD, validation, Supabase access, import, crawl job create/poll, analytics.

## FastAPI worker
Crawler jobs, extraction, dedupe, provider adapters.

## Security
Crawler reject localhost/private IP/metadata IP/non-http(s)/redirect-to-private. Render evidence as text only. Service role server only.

## Idempotency
Use bank_id + source_type + canonical_url/content_hash.
