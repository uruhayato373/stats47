# GSC Operations Cycle — 2026-W46

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-11-22T18:37:42.384Z

計測週: 2026-W46 / 次週計画: 2026-W48 / 月次: 2026-11

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W46 finalized7d coverage complete |
| snapshot-freshness | FAIL | latest=2026-W46, expected>=2026-W47 |
| effect-verdict | PASS | 2026-W46 verdict 1件 / data/effect-verdict/verdicts-2026-W46.json / decidedAt=2026-11-20T23:42:29.876Z |
| effect-target-ratchet | PASS | 想定効果値欠落0 |
| baseline-observation | PASS | ADSENSE-PLACEMENT-01: 4/4週 / missing=none / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W47, age=2d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W46 の承認/却下 2件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-11-21, age=2d |
| submitted-view-freshness | PASS | latest captured=2026-11-21, age=2d |
| weekly-review | PASS | 2026-W46 review の search-growth 節=あり |
| weekly-plan | PASS | plan=2026-W48, expected=2026-W48 |
| monthly-plan | PASS | month=2026-11, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **snapshot-freshness**: npm run fetch-gsc-snapshot -- 2026-W47

_SSOT: `.claude/config/gsc-operations-cycle.json`_
