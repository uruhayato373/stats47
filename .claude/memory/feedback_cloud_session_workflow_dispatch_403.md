---
name: feedback_cloud_session_workflow_dispatch_403
description: クラウドセッションの GitHub MCP は workflow_dispatch が 403 (Resource not accessible by integration)。R2 再生成などの手動 workflow はオーナーに Actions 画面から実行してもらう (2026-10-07)
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-07T07:30:00.000Z
---

**事象 (2026-10-07)**: svg-builder の丸め修正後、公開済み散布図 4 枚を作り直すため
`regenerate-blog-svgs.yml` (mode=scatter-canonical, dry_run=false) を `mcp__github__actions_run_trigger` で
起動しようとして `403 Resource not accessible by integration` になった。push・PR・CI の読み取りはできるが、
workflow の起動権限は無い。

**How to apply**:
- R2 の書き戻しや再生成を workflow_dispatch に頼る修正は、push の前に「誰がいつ起動するか」を決める。
  日次の検査 (例: blog-remediation-daily の Scatter integrity gate は develop を checkout して UTC 23:00 に走る)
  より前に起動が要るなら、起動手順 (ブランチ・inputs) をオーナーへ一度に伝える。
- 起動できないことを理由に、ローカルから R2 へ直接書かない (ローカル R2 書き込み禁止の規約)。
