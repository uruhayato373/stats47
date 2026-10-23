# GSC Operations Cycle — 2026-W42

**Status**: FAIL / **Stage**: review / **Generated**: 2026-10-23T23:13:09.336Z

計測週: 2026-W42 / 次週計画: 2026-W44 / 月次: 2026-10

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W42 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W42, expected>=2026-W42 |
| effect-verdict | PASS | 2026-W42 verdict 2件 / data/effect-verdict/verdicts-2026-W42.json / decidedAt=2026-10-22T23:00:25.740Z |
| effect-target-ratchet | FAIL | 新規の想定効果値欠落: SEO-TITLE-CTR-EFFECT-01 |
| baseline-observation | WARN | ADSENSE-PLACEMENT-01: 1/4週 / missing=2026-W43,2026-W44,2026-W45 / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W43, age=1d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W42 の承認/却下 2件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-10-23, age=1d |
| weekly-review | PASS | 2026-W42 review の search-growth 節=あり |

## 次のアクション

- **effect-target-ratchet**: デプロイ前の improvement-log に [target: ±N unit] を登録

_SSOT: `.claude/config/gsc-operations-cycle.json`_
