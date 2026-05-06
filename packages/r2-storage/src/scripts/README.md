# R2 スクリプト

`.local/r2/` ディレクトリと Cloudflare R2 の操作を行うスクリプト集。

## 環境変数

`.env.local`（リポジトリルート）に設定してください。

| 変数 | 用途 |
|---|---|
| `R2_S3_ENDPOINT` | R2 S3 互換エンドポイント（例: `https://<accountId>.r2.cloudflarestorage.com`） |
| `R2_ACCESS_KEY_ID` | R2 API トークンの Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API トークンの Secret Access Key |
| `CLOUDFLARE_R2_BUCKET_NAME` | バケット名（省略時: `stats47`） |
| `CLOUDFLARE_API_TOKEN` | CDN キャッシュパージ専用（`purge-cache.ts` のみ） |
| `CLOUDFLARE_ZONE_ID` | CDN キャッシュパージ専用（`purge-cache.ts` のみ） |

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
```

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
