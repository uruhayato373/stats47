---
name: feedback_no_deploy_per_iteration
description: UI/ロジックの反復ごとに本番デプロイしない。localhost で確認し、まとまりで1回だけデプロイ。デプロイは明示指示か本番固有問題の検証時のみ
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4e1bea9e-bf94-448f-9899-14c1d278b244
---

**変更のたびに本番デプロイ（develop→main PR → CI → merge → Cloudflare deploy）を回さない。** CI 6-8分 + デプロイ 6-8分が毎回走り、時間もコストも無駄。

**How to apply:**
- UI/見た目/ロジックの反復は **localhost (`npm run dev:web`) で確認**して完結させる。デプロイしない。
- 複数の変更を**まとまりに溜めて、完成時に1回だけ**デプロイ（or コミット）。micro-commit ごとの PR/deploy を避ける。
- デプロイするのは (a) **ユーザーが明示的に求めたとき**、(b) **本番でしか再現しない問題の検証時**（例: Cloudflare Workers ランタイム固有の R2/env 問題 [[feedback_cloudflare_workers_env_r2_skip]]）のみ。
- 本番デプロイは outward-facing なので、明示指示が無ければ**実行前に確認する**。

**Why:** 2026-06-20 のテーマ UI 改修セッションで 7 回（PR #486/490/491/492/493/494/495）デプロイした。本番固有のデータ障害切り分け（#491-493）以外は localhost で十分で、UI 反復ごとのデプロイは不要だった。ユーザーから「なぜ毎回デプロイするのか、コストもかかる」と指摘された。
