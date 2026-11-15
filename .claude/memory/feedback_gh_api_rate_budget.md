---
name: feedback-gh-api-rate-budget
description: "長い待機で gh run watch や workflow ごとの gh run list を回すと、全セッション共有の GitHub API 上限 5,000/時を使い切る"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d9226237-6147-499c-8c22-aa6dc38b033f
  modified: 2026-11-15T03:15:00.414Z
---

GitHub API の上限は 1 時間 5,000 回で、同じアカウントのすべてのセッションと CI の呼び出しで共有している。2026-11-15、open-data の実取得を 1 本ずつ流すスクリプトでこの上限に達し、起動が 403 で失敗した。

**Why:** `gh run watch` は既定で 3 秒おきに API を呼ぶ (1 時間で約 1,200 回)。加えて、r2-write の 20 workflow を `gh run list --workflow` で 1 本ずつ 2 分おきに調べていた。

**How to apply:** 長い待機では `gh run watch --interval 60` を使う。複数の workflow の状態は `gh api "repos/<repo>/actions/runs?status=<in_progress|queued|pending|waiting>"` で一度に取り、`.path` で絞る。間隔は 5 分以上にする。r2-write の待機枠を押し出さない待ち方は [[feedback_r2_write_pending_replaced]]。
