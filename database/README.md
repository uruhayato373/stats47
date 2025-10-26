# Cloudflare D1 Database

このプロジェクトでは、e-Stat のメタデータを保存するために Cloudflare D1 を使用しています。

## 環境別データベース構成

| 環境            | データベース名    | データベース ID                        | 接続方法                          |
| --------------- | ----------------- | -------------------------------------- | --------------------------------- |
| **Development** | `stats47`         | `e6533698-d05a-475b-9f39-5558703feef7` | `--local`（ローカル SQLite）      |
| **Staging**     | `stats47_staging` | `39f18714-83bf-423c-9956-dcc9e466affb` | `--env staging --remote` **必須** |
| **Production**  | `stats47`         | `e6533698-d05a-475b-9f39-5558703feef7` | `--remote` **必須**               |

⚠️ **重要**: Staging/Production 環境では必ず`--remote`フラグを使用してください。

## クイックリファレンス

### Development 環境（ローカル D1）

```bash
# スキーマ適用
npx wrangler d1 execute stats47 --local --file=./database/schemas/main.sql

# テーブル一覧確認
npx wrangler d1 execute stats47 --local --command "SELECT name FROM sqlite_master WHERE type='table';"

# データ確認
npx wrangler d1 execute stats47 --local --command "SELECT * FROM users LIMIT 5;"

# マイグレーション適用
npx wrangler d1 migrations apply stats47 --local

# 開発サーバー起動
npm run dev
```

### Staging 環境（リモート D1）

```bash
# ⚠️ 必ず --remote フラグを使用

# テーブル一覧確認
npx wrangler d1 execute stats47_staging --env staging --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# データ確認
npx wrangler d1 execute stats47_staging --env staging --remote --command "SELECT * FROM users LIMIT 5;"

# マイグレーション適用
npx wrangler d1 migrations apply stats47_staging --env staging --remote

# 本番データのコピー
node scripts/import-to-staging.js
```

### Production 環境（リモート D1）

```bash
# ⚠️ 必ず --remote フラグを使用
# ⚠️ 本番環境では慎重に操作してください

# テーブル一覧確認
npx wrangler d1 execute stats47 --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# データ確認（読み取りのみ）
npx wrangler d1 execute stats47 --remote --command "SELECT * FROM users LIMIT 5;"

# マイグレーション適用（注意して実行）
npx wrangler d1 migrations apply stats47 --remote
```

## データベーススキーマ

### estat_metainfo テーブル

```sql
CREATE TABLE IF NOT EXISTS estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT,
  item_name TEXT,
  unit TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX idx_stat_name ON estat_metainfo(stat_name);
CREATE INDEX idx_cat01 ON estat_metainfo(cat01);
```

## 使用方法

### 1. データベースクライアントの使用

```typescript
import { createD1Database } from "@/lib/db";

// 環境に応じて自動的に適切なクライアントが選択される
const db = await createD1Database();

// クエリの実行
const result = await db.prepare("SELECT * FROM estat_metainfo").all();
```

### 2. 個別クライアントの使用

```typescript
import { createRemoteD1Database, createLocalD1Database } from "@/lib/db";

// 強制的にリモートD1を使用
const remoteDb = await createRemoteD1Database();

// 強制的にローカルD1を使用
const localDb = await createLocalD1Database();
```

## トラブルシューティング

### よくある問題

1. **D1 接続エラー**

   - `wrangler.toml`の設定を確認
   - ローカル D1 インスタンスが起動しているか確認

2. **e-Stat API エラー**

   - 統計表 ID が正しいか確認
   - API キーが設定されているか確認

3. **データ変換エラー**
   - レスポンスの形式を確認
   - データ変換ロジックを確認

## 開発者向け情報

- **データ変換**: `src/infrastructure/estat/statsdata/EstatStatsDataService.ts`
- **データベース操作**: `src/infrastructure/estat/metadata-database.ts`
- **API 呼び出し**: `src/services/estat-api.ts`
- **保存処理**: `src/app/api/estat/metadata/save/route.ts`
