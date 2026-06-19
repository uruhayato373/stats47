---
name: project_r2_writes_ci_only
description: 2026-06-20 方針転換: ローカル/CI 両方から remote R2 へ読み書き可。remote が唯一の真実源。ローカル R2 ミラー廃止。_assert-ci-write はデフォルト許可。
metadata: 
  node_type: memory
  type: project
  originSessionId: 4d930b3a-9dfc-4616-8afd-8dd5bbb85bc1
---

2026-06-20 方針転換: **ローカル / CI 両方から remote R2 へ読み書き可。remote が唯一の真実源。ローカル R2 ミラー (`.local/r2` / `.local/d1/r2`) 廃止。**

**変更内容:**
- `fetch.ts` の localFS 読み取り tier 削除（`fetchFromLocalFs` 関数と `findLocalR2Root` import を除去）。remote (binding/S3/公開URL) が唯一の read 経路。
- `_assert-ci-write.ts` をデフォルト許可に変更。ローカル書き込み時は `console.warn` で 1 行通知して続行。`process.exit(1)` によるブロックは廃止。
- `.local/r2` / `.local/d1/r2` ディレクトリ削除済み。

**ローカル書き込みの要件:** `.env.local` に R2 S3 creds (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT`) または `wrangler login` 認証が必要。S3 creds はユーザーが Cloudflare ダッシュボードで発行する。

**読み取りは引き続き認証不要:** `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`

ルール: `.claude/rules/local-environment.md` / `.claude/rules/r2-storage-design.md`。
