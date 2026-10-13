# GSC Operations Cycle — 2026-W40

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-10-11T16:43:45.686Z

計測週: 2026-W40 / 次週計画: 2026-W42 / 月次: 2026-10

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W40 finalized7d coverage complete |
| snapshot-freshness | FAIL | latest=2026-W40, expected>=2026-W41 |
| effect-verdict | PASS | 2026-W40 verdict 7件を記録済み |
| effect-target-ratchet | PASS | 想定効果値欠落0 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W40, age=8d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W40 の承認/却下 1件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-10-11, age=1d |
| weekly-review | PASS | 2026-W40 review の search-growth 節=あり |
| weekly-plan | PASS | plan=2026-W42, expected=2026-W42 |
| monthly-plan | PASS | month=2026-10, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **snapshot-freshness**: npm run fetch-gsc-snapshot -- 2026-W41

_SSOT: `.claude/config/gsc-operations-cycle.json`_
