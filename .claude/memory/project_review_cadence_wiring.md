---
name: project-review-cadence-wiring
description: 週次・月次レビューの配線 (2026-10-01、doboku-note から移植)。正本 review-wiring.json、判定 review-cadence.mjs 1 本を CLI・Stop hook・CI・DG084・管理画面・週次 Issue が共有
metadata:
  node_type: memory
  type: project
  originSessionId: fa5e5b41-8766-41aa-8380-805999b44c2e
  modified: 2026-10-01T11:43:43.057Z
---

2026-10-01 に週次・月次レビューを計測→記録→改善サイクルへ配線した。正本は `.claude/config/review-wiring.json`、判定は `.claude/scripts/management/lib/review-cadence.mjs` だけで、次がすべてこれを読む: `check-review-cadence.mjs` (旧 check-weekly-cadence.mjs を置換)、Stop hook `check-weekly-cadence-on-stop.js`、`review-cadence-guard.yml` (毎朝 08:30 JST、`review-cadence-alert` Issue を upsert/自動 close)、docs:check DG084、管理画面 `/strategy/reviews/{weekly,monthly}`、週次メトリクス Issue の「サイクルの健全性」節 (cycle-health.mjs)。

- 月次の振り返りは `/monthly-review` に独立 (保存先 `.claude/skills/management/monthly-review/reference/reviews/YYYY-MM.md`、毎月 3 日から前月分が必須)。`/monthly-plan` はそれを読むだけ。
- 契約は週次 2026-W40・月次 2026-09 から。申し送りの各項目の末尾に `→ 振り分け: <カード ID / EXP-NNN / #Issue / 定常 / 見送り>`。ID の実在は最新のレビューだけで見る (古い行き先は完了して消えるのが正常)。
- 期限切れ・計画欠落は DG084 では止めない (暦で決まり無関係な commit を止めるため)。CI と Stop hook の担当。

**Why:** レビューと計画だけが手動起動で、W26〜W28 の 3 週欠落や月次振り返りの未検査が起き、計測が改善へ戻らなかった。
**How to apply:** レビューの見出し・期限・入力を変えるときは review-wiring.json を直し、スキル本文と揃える (wiring-broken になる)。CLI の JSON は process.exit で切れるので exitCode を使う。関連: [[project_measurement_cycle_ci]]
