# GSC Operations Cycle — 2026-W35

**Status**: WARN / **Stage**: review / **Generated**: 2026-08-31T20:25:05.647Z

計測週: 2026-W35 / 次週計画: 2026-W36 / 月次: 2026-09

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W35 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W35, expected>=2026-W35 |
| effect-verdict | PASS | 2026-W35 verdict 7件を記録済み |
| effect-target-ratchet | WARN | 既知の過去欠落 7件（新規欠落0） |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W36, age=1d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W35 の承認/却下 2件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-08-31, age=1d |
| weekly-review | PASS | 2026-W35 review の search-growth 節=あり |

## 次のアクション

- **effect-target-ratchet**: 既知7件は推測で補わず、週次で終了または再計測を判断

_SSOT: `.claude/config/gsc-operations-cycle.json`_
