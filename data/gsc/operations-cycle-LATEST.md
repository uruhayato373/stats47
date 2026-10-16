# GSC Operations Cycle — 2026-W41

**Status**: FAIL / **Stage**: review / **Generated**: 2026-10-16T23:20:29.914Z

計測週: 2026-W41 / 次週計画: 2026-W43 / 月次: 2026-10

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W41 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W41, expected>=2026-W41 |
| effect-verdict | PASS | 2026-W41 verdict 1件を記録済み |
| effect-target-ratchet | FAIL | 新規の想定効果値欠落: ADSENSE-PLACEMENT-01 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W42, age=1d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | PASS | 2026-W41 の承認/却下 1件（必要 1件以上） |
| url-inspection-freshness | PASS | latest=2026-10-16, age=1d |
| weekly-review | PASS | 2026-W41 review の search-growth 節=あり |

## 次のアクション

- **effect-target-ratchet**: デプロイ前の improvement-log に [target: ±N unit] を登録

_SSOT: `.claude/config/gsc-operations-cycle.json`_
