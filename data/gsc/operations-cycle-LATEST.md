# GSC Operations Cycle — 2026-W47

**Status**: FAIL / **Stage**: review / **Generated**: 2026-11-28T01:14:58.902Z

計測週: 2026-W47 / 次週計画: 2026-W49 / 月次: 2026-11

| Check | Result | Evidence |
|---|---|---|
| snapshot-period | PASS | 2026-W47 finalized7d coverage complete |
| snapshot-freshness | PASS | latest=2026-W47, expected>=2026-W47 |
| effect-verdict | PASS | 2026-W47 verdict 2件 / data/effect-verdict/verdicts-2026-W47.json / decidedAt=2026-11-28T00:58:17.807Z |
| effect-target-ratchet | FAIL | 新規の想定効果値欠落: BLOG-WAVE-2026-11-16-manual |
| baseline-observation | PASS | ADSENSE-PLACEMENT-01: 4/4週 / missing=none / review=2026-11-13 |
| effect-backlog-reconciliation | PASS | 確定 verdict と active 一覧の不整合0 |
| search-growth-freshness | PASS | week=2026-W48, age=0d |
| search-growth-sources | PASS | gsc/coverage/inspection は利用可能 |
| search-growth-decision | FAIL | 2026-W47 の承認/却下 0件（必要 1件以上） |
| url-inspection-freshness | FAIL | latest=2026-11-21, age=7d |
| submitted-view-freshness | PASS | latest captured=2026-11-21, age=7d |
| weekly-review | PASS | 2026-W47 review の search-growth 節=あり |

## 次のアクション

- **effect-target-ratchet**: デプロイ前の improvement-log に [target: ±N unit] を登録
- **search-growth-decision**: npm run search-growth:triage で最大3件を確認し、approve または dismiss を最低1件記録
- **url-inspection-freshness**: fetch-metrics-weekly の url-inspection job を確認

_SSOT: `.claude/config/gsc-operations-cycle.json`_
