---
name: GitHub Actions が PR を作成する workflow には repo permission 設定が必要
description: gh pr create が GraphQL "is not permitted to create or approve pull requests" で落ちたら repo settings を確認
type: feedback
originSessionId: c8f7304c-235d-4e27-ad61-b3075b33f5a5
---
GitHub Actions workflow 内で `gh pr create` が失敗するときの典型エラー: `pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)`

**Why**: GitHub のデフォルトでは Actions が PR を作成できない。Repository Settings → Actions → General → Workflow permissions の「Allow GitHub Actions to create and approve pull requests」が無効。

**How to apply**: gh API で一発設定可能（dashboard 操作不要）:
```bash
gh api -X PUT /repos/<owner>/<repo>/actions/permissions/workflow \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=true
```
（`can_approve_pull_request_reviews` フィールド名は紛らわしいが、PR 作成も含めた toggle）

stats47 リポジトリは 2026-04-26 に Phase 9 P2-A workflow（sync-known-keys.yml）対応で有効化済み。新規 PR 作成系 workflow を追加する際は再設定不要。
