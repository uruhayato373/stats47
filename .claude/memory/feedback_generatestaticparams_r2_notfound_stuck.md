---
name: feedback_generatestaticparams_r2_notfound_stuck
description: R2依存の動的routeの generateStaticParams はキー列を返すと notFound 固着、関数なしだと ISR が効かず毎回描画。空配列 + revalidate が正解 (2026-11-21 訂正)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: dd984b85-3da3-487f-8187-c5fbd2088407
  modified: 2026-11-21
---

R2 snapshot を読んで描画する動的 route の `generateStaticParams` は **空配列だけを返す** (`return [];`) + `revalidate`。

- **キー列を返す** → `● SSG` でビルド時に描かれるが、`next build` 時点では R2 を読めず (`readRankingItemFromR2` は
  build 時 `ok(null)`) **notFound が焼かれて再デプロイまで固着**する (2026-06-22 障害。`/ranking/*` 全件「見つかりません」)。
- **関数ごと外す** → `ƒ` になり **`revalidate` を書いても毎リクエスト描画**。2026-06-22 の修正 (#504) はこちらを選び、
  「ƒ でも ISR キャッシュされる」と書いたが誤りだった。2026-11-21 に、`/ranking/*`・`/areas/*` が 5 か月毎回 1.7 秒の
  CPU で描かれ、Workers CPU 課金の約 7 割を占めていたと分かった (CF-CPU-ISR-01)。Next.js 公式: 実行時の ISR には
  空配列か force-static が要る (https://nextjs.org/docs/app/api-reference/functions/generate-static-params 、2026-11-21 確認)。

**Why**: 2 つの失敗は「ビルド時に描くか」と「実行時に保存するか」を 1 つの関数で切り替えていると気づかずに、
片方の症状だけを見て直したことから来た。

**How to apply**:
- `next build` の表で `ƒ` なら ISR は効いていない。空配列なら `●` でビルド時の件数 (prerender-manifest の routes) は増えない。
- 本番での確かめ方: Workers Cache を避けるクエリ付きで同じ URL を 2 回取る。2 回目も秒単位なら毎回描画。
- ISR は描いた結果を保存するので、主データの読み取り失敗は `notFound()` にせず例外を投げる (500 は保存されない)。
- 機械の止め: 関数なし → `apps/web/src/__tests__/render-mode-contract.test.ts`、キー列 → `check-r2-route-ssg.cjs`。
- 診断 (notFound 固着): `x-nextjs-prerender:1` + `x-nextjs-cache:STALE` + `x-nextjs-stale-time:4294967294`。

正典: `.claude/rules/nextjs-ssg-preservation.md` §generateStaticParams 固着。
関連: [[feedback_cloudflare_workers_env_r2_skip]] [[feedback_home_pure_ssg_r2_empty]] [[feedback_nextjs_ssg_cookies]] [[feedback_blog_revise_isr_stale_entry]]
