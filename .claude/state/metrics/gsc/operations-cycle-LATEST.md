# GSC Operations Cycle — 2026-W38

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-09-21T17:08:49.396Z

計測週: 2026-W38 / 次週計画: 2026-W39 / 月次: 2026-09

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W38 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W38, expected>=2026-W38 |
| effect-verdict | PASS | 2026-W38 verdict 7件を記録済み |
| effect-target-ratchet | WARN | 既知の過去欠落 7件（新規欠落0） |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W38, age=2d |
| search-growth-sources | FAIL | stale/missing: inspection |
| search-growth-decision | PASS | 証拠不足または候補0のため判断を強制しない |
| url-inspection-freshness | PASS | latest=2026-09-21, age=1d |
| weekly-review | PASS | 2026-W38 review の search-growth 節=あり |
| weekly-plan | PASS | plan=2026-W39, expected=2026-W39 |
| monthly-plan | PASS | month=2026-09, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **effect-target-ratchet**: 既知7件は推測で補わず、週次で終了または再計測を判断
- **search-growth-sources**: npm run search-growth:collect && npm run search-growth:all

_SSOT: `.claude/config/gsc-operations-cycle.json`_
