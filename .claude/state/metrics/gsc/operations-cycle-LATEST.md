# GSC Operations Cycle — 2026-W40

**Status**: WARN / **Stage**: monitor / **Generated**: 2026-10-05T19:41:47.246Z

計測週: 2026-W40 / 次週計画: 2026-W41 / 月次: 2026-10

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W40 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W40, expected>=2026-W40 |
| effect-verdict | PASS | 2026-W40 verdict 7件を記録済み |
| effect-target-ratchet | WARN | 既知の過去欠落 7件（新規欠落0） |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W40, age=2d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W40 の承認/却下 1件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-10-05, age=1d |
| weekly-review | PASS | 2026-W40 review の search-growth 節=あり |
| weekly-plan | PASS | plan=2026-W41, expected=2026-W41 |
| monthly-plan | PASS | month=2026-10, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **effect-target-ratchet**: 既知7件は推測で補わず、週次で終了または再計測を判断

_SSOT: `.claude/config/gsc-operations-cycle.json`_
