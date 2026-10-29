---
name: project_instagram_paused_2026_10_27
description: 2026-10-27 オーナー判断で Instagram の自動投稿を一旦停止。投稿 workflow 5 本を GitHub 側で disabled_manually、Business Suite 予約の未コミット作業は破棄。コードは残置
metadata:
  node_type: memory
  type: project
  originSessionId: 2e4ed7f8-e981-42e3-a15a-3159fb113618
  modified: 2026-10-27T10:56:59.949Z
---

2026-10-27、オーナーが「Instagram は一旦全て削除」と指示し、範囲を確認すると「自動投稿も止める（コードは残す）」を選んだ。

- GitHub の workflow を `gh workflow disable` で止めた (yml は未変更): `post-instagram-scheduled.yml` / `sns-port-bubble-daily.yml` / `migration-flow-weekly.yml` / `migration-flow-monthly.yml` / `migration-flow-annual.yml`。再開は `gh workflow enable <file>`
- 計測 `sns-metrics-weekly.yml` とトークン延長 `instagram-token-refresh.yml` は動かしたまま (投稿しない・再開時にトークン切れを避ける)
- 未コミットだった Business Suite 予約の作業 (`schedule-business-suite.ts`・launchd plist/sh・post-from-schedule の印判定) は破棄。launchd は未登録だった

**Why:** 2026-10-11 の継続判断 ([[feedback_portfolio_keep_decision_2026_10]]) を Instagram についてはオーナーが上書きした。

**How to apply:** Instagram の投稿・予約を新しく作らない、無効化した workflow を勝手に enable しない。migration-flow の 3 本は Instagram 投稿用の workflow なので、移動データの他の用途で必要になったら投稿 step を外してから再開を相談する。関連: [[project_sns_reorg_2026_07]] [[project_instagram_graph_api_setup]]
