---
name: feedback_workers_self_fetch_unbundle
description: OpenNext on Workers で大きな静的アセットを Worker バンドルから外すとき、サーバーから自ドメイン URL を fetch すると失敗する (self-fetch 落とし穴)。ASSETS binding か別ホスト R2 を使う
metadata: 
  node_type: memory
  type: feedback
  originSessionId: abc962fa-cd52-45d8-a9d7-ef6e59c349dd
---

OpenNext on Cloudflare Workers で、サーバーバンドルに焼き込まれた大きな静的アセット
(例: `public/search-index.json` 1.35MB を `require()`) を**バンドルから外して runtime fetch 化**
しようとするとき、**サーバーコードから自ドメインの公開 URL を `fetch()` してはいけない**。

**Why:** 2026-06-13 の T2-2 試行で、`search-server.ts` の `require(search-index.json)` を
`fetch("https://stats47.jp/search-index.json")` に置換 → 型チェック通過・デプロイ成功したが、
**本番でサーバー検索が degrade**（`/search?q=人口` が「結果0件」、本来109件）。原因は Workers が
**自ゾーンの URL を fetch すると正しく解決されない self-fetch 落とし穴**。型チェックでは捕まらず、
デプロイ + スモーク (`curl /search?q=<encoded>` で結果件数確認) で初めて発覚。revert で復旧。

**How to apply:**
- 自分の静的アセットをサーバーから読むなら **`ASSETS` binding** を使う
  (`getCloudflareContext().env.ASSETS.fetch(new URL("/file.json", "https://placeholder"))`)。
  公開 URL の自己 fetch は不可。
- もしくは **別ホストの R2 公開 URL** (`https://storage.stats47.jp/...`) から fetch する
  (self でないので可)。ただし build で R2 へ push する必要があり、R2 write は CI 専用 ([[project_r2_writes_ci_only]])。
- **検証は型チェックだけでは不十分**。この種の runtime 変更は必ずデプロイ後にスモーク
  (`curl` で実コンテンツを確認) する。日本語クエリは URL エンコードしないと 400 になる点も注意。
- search-index/provenance(648KB) の Worker 同梱解除 (audit T2-2) は未完。proper には上記
  ASSETS binding か R2 移行が要る。関連: docs/04_レビュー/2026-06-13-code-audit.md (削除済・git 履歴参照)
