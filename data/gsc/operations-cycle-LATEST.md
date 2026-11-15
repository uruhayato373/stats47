# GSC Operations Cycle — 2026-W45

**Status**: WARN / **Stage**: review / **Generated**: 2026-11-14T04:56:28.912Z

計測週: 2026-W45 / 次週計画: 2026-W47 / 月次: 2026-11

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W45 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W45, expected>=2026-W45 |
| effect-verdict | PASS | 2026-W45 verdict 1件 / data/effect-verdict/verdicts-2026-W45.json / decidedAt=2026-11-13T23:03:45.882Z |
| effect-target-ratchet | PASS | 想定効果値欠落0 |
| baseline-observation | PASS | ADSENSE-PLACEMENT-01: 4/4週 / missing=none / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W46, age=0d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W45 の承認/却下 1件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-11-14, age=0d |
| submitted-view-freshness | WARN | 送信済みビューの記録が未取得 (初回の記録待ち) |
| weekly-review | PASS | 2026-W45 review の search-growth 節=あり |

## 次のアクション

- **submitted-view-freshness**: weekly:collect の週次取得で data/gsc/coverage-submitted-history.csv が作られるのを待つ

_SSOT: `.claude/config/gsc-operations-cycle.json`_
