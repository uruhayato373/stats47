# GSC Operations Cycle — 2026-W45

**Status**: FAIL / **Stage**: monitor / **Generated**: 2026-11-15T17:56:22.485Z

計測週: 2026-W45 / 次週計画: 2026-W47 / 月次: 2026-11

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W45 finalized7d coverage complete |
| snapshot-freshness | FAIL | latest=2026-W45, expected>=2026-W46 |
| effect-verdict | PASS | 2026-W45 verdict 1件 / data/effect-verdict/verdicts-2026-W45.json / decidedAt=2026-11-13T23:03:45.882Z |
| effect-target-ratchet | PASS | 想定効果値欠落0 |
| baseline-observation | PASS | ADSENSE-PLACEMENT-01: 4/4週 / missing=none / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W46, age=2d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W45 の承認/却下 3件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-11-14, age=2d |
| submitted-view-freshness | WARN | 送信済みビューの記録が未取得 (初回の記録待ち) |
| weekly-review | PASS | 2026-W45 review の search-growth 節=あり |
| weekly-plan | PASS | plan=2026-W47, expected=2026-W47 |
| monthly-plan | PASS | month=2026-11, GSC運用サイクル節=あり |
| monthly-review-coverage | PASS | 直近4週レビュー 4/4（必要 3以上） |

## 次のアクション

- **snapshot-freshness**: npm run fetch-gsc-snapshot -- 2026-W46
- **submitted-view-freshness**: weekly:collect の週次取得で data/gsc/coverage-submitted-history.csv が作られるのを待つ

_SSOT: `.claude/config/gsc-operations-cycle.json`_
