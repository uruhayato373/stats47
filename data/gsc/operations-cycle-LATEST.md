# GSC Operations Cycle — 2026-W44

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-11-08T17:12:36.596Z

計測週: 2026-W44 / 次週計画: 2026-W46 / 月次: 2026-11

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W44 finalized7d coverage complete |
| snapshot-freshness | FAIL | latest=2026-W44, expected>=2026-W45 |
| effect-verdict | PASS | 2026-W44 verdict 1件 / data/effect-verdict/verdicts-2026-W44.json / decidedAt=2026-11-06T22:39:06.667Z |
| effect-target-ratchet | PASS | 想定効果値欠落0 |
| baseline-observation | WARN | ADSENSE-PLACEMENT-01: 3/4週 / missing=2026-W45 / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W45, age=2d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W44 の承認/却下 1件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-11-07, age=2d |
| weekly-review | PASS | 2026-W44 review の search-growth 節=あり |
| weekly-plan | FAIL | plan=2026-W45, expected=2026-W46 |
| monthly-plan | PASS | month=2026-11, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **snapshot-freshness**: npm run fetch-gsc-snapshot -- 2026-W45
- **weekly-plan**: /weekly-plan 2026-W46

_SSOT: `.claude/config/gsc-operations-cycle.json`_
