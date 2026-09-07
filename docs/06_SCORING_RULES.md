# Scoring Rules

NULL=chưa đánh giá; 0=chưa có; 1=bán tự động; 2=100% online; 3=vượt trội.

`total_score = SUM(non-null)`
`max_score = active_components * 3`
`M3 = count(score=3)`
`group_score = SUM(COALESCE(score,0))/component_count_in_group`
Ranking: total DESC, M3 DESC, name ASC.
