---
name: feedback_cloudflare_workers_env_r2_skip
description: 本番 Worker で R2 snapshot 読みが空/skip されたら wrangler.toml env.production.vars の CLOUDFLARE_WORKERS=true を疑う。shouldSkipRemoteR2Read の落とし穴
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4e1bea9e-bf94-448f-9899-14c1d278b244
---

本番テーマページが「データの取得に失敗しました」(error fallback)、home の featured が空、ranking の SSR にデータが無い等、**本番 Worker ランタイムで R2 snapshot 読みが黙って空になる**症状が出たら、まず `apps/web/wrangler.toml` の `[env.production.vars]` に **`CLOUDFLARE_WORKERS = "true"`** があるか確認する。

**Why (2026-06-20 に丸一日溶かした真因)**: R2 remote-only 移行で導入した `shouldSkipRemoteR2Read()`（`packages/r2-storage/src/lib/utils/should-skip-remote-r2-read.ts`）は、`CLOUDFLARE_WORKERS!=="true"` かつ CI でも S3creds でも `R2_PUBLIC_FETCH_URL` でもないと **true(skip)** を返す。これが `readRankingItemFromR2` 等の snapshot reader（`read-ranking-items-snapshot.ts` が `if (!shouldSkipRemoteR2Read())` でラップ）を本番ランタイムで skip させ、**エラーを出さず空 `ok([])` を返す**。`loadThemeData` は items 空 → null → error fallback。本番 vars には `R2_PUBLIC_URL`/`NEXT_PUBLIC_R2_PUBLIC_URL` はあったが `R2_PUBLIC_FETCH_URL` ではなく、`CLOUDFLARE_WORKERS` も無かったため全条件を外し skip していた。

**症状の見分け方**: `wrangler tail --env production` でリクエストは `Ok` だが loadThemeData のエラーログが**一切出ない**（throw ではなく黙って空）。`x-nextjs-cache` も無く force-dynamic は効いている（＝キャッシュではなくランタイムで genuinely 空）。

**How to apply**:
- 本番 R2 読み skip を疑ったら `wrangler.toml [env.production.vars]` に `CLOUDFLARE_WORKERS = "true"` を入れる（fetchFromR2AsJson の binding 読み自体は env.isCloudflareWorkers ヒューリスティックで動くが、上位の shouldSkipRemoteR2Read ゲートは明示 env を見る）。
- 関連: テーマダッシュボードは指標値を **R2 `app/ranking/<key>/values.json` のみ**から読む（e-Stat ライブ取得は Workers で失敗するため廃止。`loadThemeData` → `readAllYearsRankingValuesFromR2`）。全国行は R2 に無いので未選択時は県平均。正典 `apps/web/src/features/theme-dashboard/README.md`。
- テーマページは `force-dynamic` 必須（SSG だと build 時に R2 読めず error fallback が prerender に焼かれる。[[feedback_home_pure_ssg_r2_empty]] と同型）。
- 関連: [[project_r2_writes_ci_only]]
