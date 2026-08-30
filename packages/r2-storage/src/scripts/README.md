# R2 スクリプト

`.local/r2/` ディレクトリと Cloudflare R2 の操作を行うスクリプト集。

## 環境変数

`.env.local`（リポジトリルート）に設定してください。

| 変数                        | 用途                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `R2_S3_ENDPOINT`            | R2 S3 互換エンドポイント（例: `https://<accountId>.r2.cloudflarestorage.com`） |
| `R2_ACCESS_KEY_ID`          | R2 API トークンの Access Key ID                                                |
| `R2_SECRET_ACCESS_KEY`      | R2 API トークンの Secret Access Key                                            |
| `CLOUDFLARE_R2_BUCKET_NAME` | バケット名（省略時: `stats47`）                                                |
| `CLOUDFLARE_API_TOKEN`      | CDN キャッシュパージ専用（`purge-cache.ts` のみ）                              |
| `CLOUDFLARE_ZONE_ID`        | CDN キャッシュパージ専用（`purge-cache.ts` のみ）                              |
| `WORKER_CACHE_PURGE_SECRET` | Workers Cache 内部パージ API の Bearer 認証                                    |

## スクリプト一覧

### アップロード（.local/r2 → R2）

```bash
# 差分アップロード（マニフェストベース）
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts

# プレフィックス指定
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/ranking

# 差分のみ確認（実際にはアップロードしない）
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --dry-run
```

`diff-push-r2.ts`はJSON snapshot・記事等の通常staging用。生成画像には使わない。

### 生成画像（exact plan → R2）

```bash
# generatorが変更bundleだけをisolated stagingへ生成
npx tsx --tsconfig apps/web/scripts/tsconfig.ogp.json \
  apps/web/scripts/generate-ogp-images.ts --type ranking-cards

# planに列挙された画像だけをasset→manifestの順で反映
npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts \
  --plan .local/image-generation-publish-plan-ranking-cards.json

# 書込なしでlocal bundle + remote CAS前提だけを検証
npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts \
  --plan .local/image-generation-publish-plan-ranking-cards.json --dry-run
```

画像publisherは`.local/image-staging/<type>`以外を拒否し、plan外ファイルを走査しない。
2時間以内のplanに固定されたasset/manifest SHAと観測時remote manifest SHAを検証する。
各assetのSHA-256・MIME・寸法をdecode検証し、bytesが同じassetはPUTせず、変更時だけHEAD再検証する。
R2 distributed lock下で全asset成功後にentity manifestを`If-Match` / `If-None-Match`で更新し、
失敗時は旧bundleへrollbackする。
共通契約は`.claude/rules/ogp-image-standards.md` §5.0。

### manifestを持たない生成asset（exact bytes → R2）

```bash
# 明示したkeyだけをSHA-256/size/MIMEで比較し、変化したobjectだけPUT
npx tsx packages/r2-storage/src/scripts/push-exact-r2-assets.ts \
  --key app/blog/example/chart.svg

# idea等の十分狭いprefixでは拡張子も必須
npx tsx packages/r2-storage/src/scripts/push-exact-r2-assets.ts \
  --prefix sns/buzz-map/example --extension png,mp4

# GIS TopoJSON + provenance metadata
npx tsx packages/r2-storage/src/scripts/push-exact-r2-assets.ts \
  --prefix gis/mlit-ksj/G04-a/11 --extension topojson,json
```

対象は`.local/r2`配下だけ。空・広域prefix・候補0件・staging外参照を拒否し、
mtimeやローカルcacheを使わずR2 HEAD metadataとlocal bytesを比較する。PUT後もHEADを再検証する。

### ダウンロード（R2 → .local/r2）

```bash
# 全体ダウンロード
npx tsx packages/r2-storage/src/scripts/sync-download.ts

# プレフィックス指定
npx tsx packages/r2-storage/src/scripts/sync-download.ts --prefix app/ranking

# 確認のみ（実際にはダウンロードしない）
npx tsx packages/r2-storage/src/scripts/sync-download.ts --dry-run
```

### 削除

```bash
# プレフィックス配下を一括削除
npx tsx packages/r2-storage/src/scripts/delete-r2-prefix.ts app/old-prefix/
```

### 一覧・容量確認

```bash
# プレフィックス別ファイル数一覧
npx tsx packages/r2-storage/src/scripts/list-r2-prefixes.ts

# ディレクトリ別容量（du 相当）
npx tsx packages/r2-storage/src/scripts/r2-du.ts
npx tsx packages/r2-storage/src/scripts/r2-du.ts --prefix app/ranking --depth 2
```

### キャッシュパージ

```bash
# ISR キャッシュバケット（stats47-cache）を全削除
npx tsx packages/r2-storage/src/scripts/purge-cache-r2.ts

# CDN キャッシュ（storage.stats47.jp）をパージ
npx tsx packages/r2-storage/src/scripts/purge-cache.ts              # 全体
npx tsx packages/r2-storage/src/scripts/purge-cache.ts --prefix app/ranking
npx tsx packages/r2-storage/src/scripts/purge-cache.ts --files app/ranking/key/values.json

# Workers Cache（同一entrypointのassetを含む）を全体パージ
npx tsx packages/r2-storage/src/scripts/purge-worker-cache.ts --all

# Workers Cacheの公開data APIだけをパージ
npx tsx packages/r2-storage/src/scripts/purge-worker-cache.ts --data

# 公開ページの path tag だけをパージ（query variant も同時に無効化）
npx tsx packages/r2-storage/src/scripts/purge-worker-cache.ts --urls \
  https://stats47.jp/blog/example \
  https://stats47.jp/blog
```

zone CDN と Workers Cache は別のキャッシュであり、`purge-cache.ts` だけでは Workers Cache は
消えない。R2 snapshot を公開する Workflow は、R2 反映成功後に
`purge-worker-cache.ts` を実行する。URL 指定は最大100件ずつ自動分割し、異なる origin、
認証不足、Worker 側の purge 失敗は hard fail する。

## スナップショット一括更新

すべての snapshot を export して R2 に push するには `/sync-snapshots` スキルを使う:

```bash
# 全 snapshot を export → diff-push-r2.ts で R2 push
.claude/skills/db/sync-snapshots/run.sh

# 特定 snapshot のみ
.claude/skills/db/sync-snapshots/run.sh --only blog

# dry-run（export のみ、R2 push はスキップ）
.claude/skills/db/sync-snapshots/run.sh --dry-run
```
