---
name: feedback_cloud_session_workflow_dispatch_403
description: クラウドセッションの GitHub MCP は workflow_dispatch が 403。代わりに data/workflow-dispatch-requests.json を develop へ push すると workflow-dispatch-proxy.yml が代理起動する (allowlist 内のみ)
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
- 直接 dispatch せず、`data/workflow-dispatch-requests.json` (`workflow` / `inputs` / `ref` / `reason` / `requestedAt`) を
  develop へ commit + push する。`workflow-dispatch-proxy.yml` が allowlist の workflow を代理起動し、request を消費する。
  `requestedAt` は毎回更新する (同じ内容では発火しない)。手順の正本は proxy workflow の冒頭コメント。
- proxy の run が緑でも、起動先の run が concurrency で cancelled になることがある。成果物 (R2 の中身など) を実測して確かめる。
- 当日はこの仕組みを知らず、オーナーに手動起動を頼んでしまった。オーナーに頼む前に proxy を使う。
- 起動できないことを理由に、ローカルから R2 へ直接書かない (ローカル R2 書き込み禁止の規約)。
