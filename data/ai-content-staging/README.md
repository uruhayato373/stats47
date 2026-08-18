# ai-content 公開 outbox (ephemeral)

ranking ai-content (AiContentSnapshotRow) の **git 経由公開キュー**。クラウド/webセッションは
R2 creds を持たないため、生成物 `<rankingKey>.json` をここへ置いて develop に push すると
`.github/workflows/publish-ai-content.yml` が gate → R2 `app/ranking/<key>/ai-content.json` push →
CDN purge → 本ファイル削除 (commit-back) まで自動実行する。

- **正典は R2**。このディレクトリは常に空が正常 (blog の docs/21 と同じ ephemeral outbox)
- ゲート: `.claude/scripts/ai-content/audit-ai-content.mjs` (blocker 1件でも R2 に到達しない)
- 生成手順: `.claude/todo/backlog.md` [AICONTENT-DBLESS-REBUILD] の再開手順参照
