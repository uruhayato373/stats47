---
name: feedback-check-ci-job-scope-before-launch
description: 長い CI ジョブ (data-refresh 等) を起動する前に、何を作り直すかと前回の所要時間を確かめる。狭い範囲で足りるのに全範囲を回すと 1 時間以上を無駄にする
metadata:
  node_type: memory
  type: feedback
  originSessionId: 76c7f6c3-1eef-4cb9-bbcd-f0a5a6b1cce4
  modified: 2026-10-28T10:23:03.478Z
---

data-refresh などの長い CI ジョブを起動する前に、そのジョブがどこまで作り直すか (範囲) と、前回の所要時間を確かめてから起動する。

**Why:** 2026-10-28 に市区町村だけの財政指標 8 件を取り込んだとき、範囲を確かめずに全範囲で起動した。必要な作り直しは数分 (観測値の書き込みは 1 分、市区町村ランキングは 20 分台で完了) なのに、関係ない派生の作り直しで 75 分かかった。オーナーに「開発が遅すぎる」と指摘された。

**How to apply:** 範囲の選び方は data-refresh の `snapshot_scope=auto` が既定で決める (判定 `packages/ranking/src/scripts/lib/refresh-scope.ts`)。`all` を明示しない。ほかの長いジョブでも、起動前に `gh run list --workflow <file> --status success --limit 3` で過去の所要時間を見て、狭い範囲の指定があるかを確かめる。待つ間は別の作業を並行させ、約 5 分おきに進捗を伝える ([[periodic-progress-reports]])。
