---
name: project_r2_writes_ci_only
description: R2 は remote が唯一の真実源。書き込みは CI が既定で、ローカルは Mac で作る prefix だけ。作り直せる生成物の push は承認不要、正本の上書きと削除は承認 (2026-11-14)
metadata: 
  node_type: memory
  type: project
  originSessionId: 4d930b3a-9dfc-4616-8afd-8dd5bbb85bc1
---

**2026-11-14 改訂**: 書き込みは CI の workflow が既定。ローカルから書けるのは区分表 (`packages/r2-storage/src/scripts/r2-key-classes.ts`) で `origin: "mac"` の prefix だけで、それ以外は `_assert-ci-write.ts` が止める (`ALLOW_LOCAL_R2_WRITE=1` で明示的に通す)。作り直せる生成物 (`regenerable`) の push と再生成の workflow の起動は承認不要、正本 (`authoritative`) の上書きと削除はオーナーの承認が要る。正典は `.claude/rules/r2-storage-design.md`「書き込みの承認」。以下は 2026-06-20 時点の記録で、「デフォルト許可」は上の改訂で置き換わった。

2026-06-20 方針転換: **ローカル / CI 両方から remote R2 へ読み書き可。remote が唯一の真実源。ローカル R2 ミラー (`.local/r2` / `.local/d1/r2`) 廃止。**

**変更内容:**
- `fetch.ts` の localFS 読み取り tier 削除（`fetchFromLocalFs` 関数と `findLocalR2Root` import を除去）。remote (binding/S3/公開URL) が唯一の read 経路。
- `_assert-ci-write.ts` をデフォルト許可に変更。ローカル書き込み時は `console.warn` で 1 行通知して続行。`process.exit(1)` によるブロックは廃止。
- `.local/r2` / `.local/d1/r2` ディレクトリ削除済み。

**ローカル書き込みの要件:** `.env.local` に R2 S3 creds (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_S3_ENDPOINT`) または `wrangler login` 認証が必要。S3 creds はユーザーが Cloudflare ダッシュボードで発行する。

**読み取りは引き続き認証不要:** `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`

ルール: `.claude/rules/local-environment.md` / `.claude/rules/r2-storage-design.md`。

## GIS scope の commit marker 契約（2026-08-31）

**問題**: `gis/mlit-ksj/{dataId}/{version}/{scope}/manifest.json` の存在だけで取得済みと判定すると、変換・PUTの中断でmanifest宣言TopoJSONが欠けたscopeや、旧形式objectが残ったscopeを再実行で修復できない。

**原因**: manifest keyの存在確認だけでskipし、`manifest.files[].key` と実際のR2 object集合を照合していなかった。

**対策**: manifestをcommit markerとしてJSONを読み、宣言keyが全て同一scope内に存在するときだけskipする。欠損・不正・重複はscope全体をexact削除して再取得し、完全なscopeのmanifest外objectはexact削除する。実装は `packages/gis/src/mlit-ksj/published-scope.ts`、最終gateは `npm run audit:public-ksj-r2 --workspace packages/gis`。

**証拠**: 2026-08-31、初回監査 `missing manifests=202 / stale objects=19` から再投入し、`PASS datasets=29 manifests=1338 topologySamples=29 features=121545039` を確認。
