# Frontend Spec

## Component map
- `layout/AppSidebar.tsx`
- `layout/Topbar.tsx`
- `sources/SourcePairPanel.tsx`
- `sources/SourcePairRow.tsx`
- `sources/CrawlResultsTable.tsx`
- `benchmark/BenchmarkGrid.tsx`
- `benchmark/BenchmarkGroupRow.tsx`
- `benchmark/BenchmarkComponentRow.tsx`
- `benchmark/BankHeader.tsx`
- `benchmark/EditComponentModal.tsx`
- `benchmark/ImportExcelModal.tsx`
- `matrix/PositionRankingCard.tsx`
- `matrix/RadarComparisonCard.tsx`
- `matrix/MatrixDetailTable.tsx`

## Rules
- Bank columns từ API, không hardcode.
- Stable UUID cho DnD, không dùng array index làm identity.
- Optimistic reorder có rollback.
- Matrix derived from server data.
- Desktop matrix: left 36–40%, right 60–64%.
