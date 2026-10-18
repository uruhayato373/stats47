# GSC Operations Cycle — 2026-W41

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-10-18T14:45:24.958Z

計測週: 2026-W41 / 次週計画: 2026-W43 / 月次: 2026-10

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W41 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W41, expected>=2026-W41 |
| effect-verdict | PASS | 2026-W41 verdict 1件 / data/effect-verdict/reassessments/2026-W41/2026-10-16T23-33-48.231Z.json / decidedAt=2026-10-16T23:33:48.231Z |
| effect-target-ratchet | PASS | 想定効果値欠落0 |
| baseline-observation | WARN | ADSENSE-PLACEMENT-01: 0/4週 / missing=2026-W42,2026-W43,2026-W44,2026-W45 / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W42, age=2d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W41 の承認/却下 1件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-10-18, age=0d |
| weekly-review | PASS | 2026-W41 review の search-growth 節=あり |
| weekly-plan | FAIL | plan=2026-W42, expected=2026-W43 |
| monthly-plan | PASS | month=2026-10, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **weekly-plan**: /weekly-plan 2026-W43

_SSOT: `.claude/config/gsc-operations-cycle.json`_
