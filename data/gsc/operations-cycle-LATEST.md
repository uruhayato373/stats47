# GSC Operations Cycle — 2026-W43

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-11-01T17:13:49.871Z

計測週: 2026-W43 / 次週計画: 2026-W45 / 月次: 2026-11

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W43 finalized7d coverage complete |
| snapshot-freshness | FAIL | latest=2026-W43, expected>=2026-W44 |
| effect-verdict | PASS | 2026-W43 verdict 2件 / data/effect-verdict/verdicts-2026-W43.json / decidedAt=2026-10-30T21:37:08.180Z |
| effect-target-ratchet | FAIL | 新規の想定効果値欠落: SEO-TITLE-CTR-EFFECT-01 |
| baseline-observation | WARN | ADSENSE-PLACEMENT-01: 2/4週 / missing=2026-W44,2026-W45 / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W44, age=3d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W43 の承認/却下 2件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-10-31, age=2d |
| weekly-review | PASS | 2026-W43 review の search-growth 節=あり |
| weekly-plan | PASS | plan=2026-W45, expected=2026-W45 |
| monthly-plan | PASS | month=2026-11, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **snapshot-freshness**: npm run fetch-gsc-snapshot -- 2026-W44
- **effect-target-ratchet**: デプロイ前の improvement-log に [target: ±N unit] を登録

_SSOT: `.claude/config/gsc-operations-cycle.json`_
