# API Contract

## Source pairs
- GET `/api/source-pairs`
- POST `/api/source-pairs`
- PATCH `/api/source-pairs/:id`
- DELETE `/api/source-pairs/:id`
- POST `/api/source-pairs/:id/verify` `{type: facebook|website}`

## Crawl
- POST `/api/crawl-jobs`
- GET `/api/crawl-jobs/:id`
- GET `/api/crawl-items`
- PATCH `/api/crawl-items/:id`

## Banks
- GET/POST/PATCH/DELETE `/api/banks`
- POST `/api/banks/reorder`

## Groups
- GET/POST/PATCH/DELETE `/api/benchmark/groups`
- POST `/api/benchmark/groups/reorder`

## Components
- GET/POST/PATCH/DELETE `/api/benchmark/components`
- POST `/api/benchmark/components/reorder`

## Cells
- GET `/api/benchmark/cells`
- PUT `/api/benchmark/cells/:component_id/:bank_id`
- PUT `/api/benchmark/cells/batch`

## Import
- POST `/api/benchmark/import/preview`
- POST `/api/benchmark/import/commit`

## Analytics
- GET `/api/analytics/position`
- GET `/api/analytics/group-scores`
- GET `/api/matrix`
