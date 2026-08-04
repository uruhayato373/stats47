---
name: feedback_cloud_github_api_mcp_only
description: クラウドセッションから GitHub API を curl で叩くと HTTP 200 で "GitHub access is not enabled" が返る。gh も無いので GitHub 操作は MCP ツールだけが使える
metadata:
  node_type: memory
  type: feedback
---

Claude Code on the web / クラウド実行環境には `gh` CLI が無い。その代わりに `curl` へ
逃げると、**GitHub API は必ず失敗する**:

```
$ curl -s -H "Authorization: bearer $GITHUB_TOKEN" https://api.github.com/repos/<owner>/<repo>/actions/runs
{"message":"GitHub access is not enabled for this session. ..."}
```

**Why:** 2026-08-04、develop→main のデプロイ中に CI と deploy run を追うため、
`curl` + `$GITHUB_TOKEN` で polling する background agent を 4 本走らせた。全部無駄になった。

厄介なのは失敗の見えなさで、理由が 2 つ重なる:

1. **このエラーは HTTP 200 で返る**。`curl -f` も `|| exit 1` も発火しない。
   `jq` で特定フィールドを抜くスクリプトだと空文字になるだけで、成功と区別がつかない。
2. **background agent の中で起きると出力が空ファイルになる**。「まだ結果が出ていない」のか
   「叩けていない」のか判別できず、数十分待ってから気づいた。

**How to apply:**
- クラウドで GitHub を触るときは **最初から `mcp__github__*` だけを使う**。
  `gh` が無いことを確認した時点で `curl` は選択肢から外す。
  - PR: `create_pull_request` / `update_pull_request` / `merge_pull_request` / `pull_request_read`
  - Actions: `actions_list` (`list_workflow_runs`) / `actions_get` / `get_job_logs`
- `actions_list` はトークン上限に当たることがある。その場合レスポンスがファイルに保存されるので
  `python3 -c "import json; ..."` で `run_number` / `head_sha` / `conclusion` だけ抜く (全文を読まない)。
- **GitHub の状態確認を background agent に投げない**。MCP ツールは agent 側から呼べないことがあり、
  curl に fallback されると上記の無言失敗になる。前面で MCP を呼ぶ。

正典: `.claude/skills/dev/deploy/SKILL.md`「実行環境の判定」/ `.claude/rules/branch-workflow.md`

関連: [[feedback_github_actions_pr_creation]] / [[feedback_ci_cancelled_looks_like_failure]]
