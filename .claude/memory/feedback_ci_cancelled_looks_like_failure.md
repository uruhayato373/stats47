---
name: feedback_ci_cancelled_looks_like_failure
description: 後続 push が concurrency group で古い CI run を cancel すると全 job が cancelled になり、通知や PR 上では failure と区別がつかない。conclusion を見て superseded か判定する
metadata:
  node_type: memory
  type: feedback
---

同じブランチに後続の push が入ると、concurrency group が古い workflow run を **cancel** する。
このとき全 job の conclusion が `cancelled` になり、**PR の見た目・webhook 通知は failure と
区別がつかない**。

**Why:** 2026-08-04 の develop→main デプロイで 2 回誤読した。

- PR #722: 自分の run が別セッションの push に追い越されて cancelled → 「CI 失敗」と読んで原因調査を始めた
- PR #729: 同じことが commit `77a319bd` (別セッションの楽天 sync 修正) で起きた

どちらも実際には**何も壊れていない**。新しい run が緑になれば PR はマージできる。
job ログを読みに行っても「始まってすらいない」ので何も出てこない (ここで時間を使った)。

**How to apply:**
- CI が赤く見えたら、**まず conclusion が `failure` か `cancelled` か**を見る
  (`mcp__github__pull_request_read` / `actions_get`)。
- `cancelled` かつ同ブランチに自分の run より新しい run があれば **superseded**。対処は不要で、
  **新しい run の結果を待つ**。ログを読まない。
- 「全 job が一斉に cancelled」は superseded のサイン。本物の失敗なら特定 job だけが落ちる。
- 複数セッションが同じブランチへ push している時に起きやすい。
  同時実行の危険は [[feedback_shared_working_copy_git_race]] も参照。

正典: `.claude/skills/dev/deploy/SKILL.md`「CI が『失敗』に見えるが実は superseded」

関連: [[feedback_cloud_github_api_mcp_only]] / [[feedback_shared_working_copy_git_race]]
