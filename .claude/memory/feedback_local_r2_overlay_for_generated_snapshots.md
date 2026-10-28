---
name: feedback-local-r2-overlay-for-generated-snapshots
description: 手元で生成した R2 snapshot (databook 等) を localhost で見るときは既存の .github/scripts/r2-overlay-server.mjs を使い、自作の中継を書かない
metadata:
  node_type: memory
  type: feedback
  originSessionId: 76c7f6c3-1eef-4cb9-bbcd-f0a5a6b1cce4
  modified: 2026-10-28T07:25:45.218Z
---

手元で生成した R2 の配信 snapshot (市区町村データブック・ランキングの item/values など) を localhost の画面で確かめるときは、PR CI と同じ中継 `.github/scripts/r2-overlay-server.mjs` を使う。返す種類は `.github/scripts/metric-release-paths.mjs` の `overlay: true` と同じ定義。dev サーバーは S3 の認証情報があると公開 URL より S3 を先に読むので、`R2_S3_ENDPOINT=` を空にし `R2_PUBLIC_FETCH_URL` を中継へ向けて起動する。

**Why:** 2026-10-28 の行政区の内訳の確認で、使い捨ての中継を scratchpad に自作した。CI と同じ定義を使わないと、手元で確かめた範囲と本番に出る範囲がずれる。

**How to apply:** 生成器を `--output-root .local/r2` で動かし、`node .github/scripts/r2-overlay-server.mjs <port>` を背景で起動してから dev を立てる。R2 には書かない (反映はデプロイの exact manifest)。関連: [[dev-server-web-only]]
