# GSC Operations Cycle — 2026-W35

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-08-31T18:04:24.353Z

計測週: 2026-W35 / 次週計画: 2026-W36 / 月次: 2026-09

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W35 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W35, expected>=2026-W35 |
| effect-verdict | PASS | 2026-W35 verdict 7件を記録済み |
| effect-target-ratchet | WARN | 既知の過去欠落 7件（新規欠落0） |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W35, age=2d |
| search-growth-sources | FAIL | stale/missing: inspection |
| search-growth-decision | PASS | 証拠不足または候補0のため判断を強制しない |
| url-inspection-freshness | PASS | latest=2026-08-31, age=1d |
| weekly-review | FAIL | 2026-W35 review が無い |
| weekly-plan | FAIL | plan=2026-W35, expected=2026-W36 |
| monthly-plan | FAIL | month=2026-08, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 3/4（必要 3以上） |

## 次のアクション

- **effect-target-ratchet**: 既知7件は推測で補わず、週次で終了または再計測を判断
- **search-growth-sources**: npm run search-growth:collect && npm run search-growth:all
- **weekly-review**: /weekly-review 2026-W35
- **weekly-plan**: /weekly-plan 2026-W36
- **monthly-plan**: /monthly-plan 2026-09

_SSOT: `.claude/config/gsc-operations-cycle.json`_
