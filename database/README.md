# Cloudflare D1 Database

このプロジェクトでは、e-Stat のメタデータを保存するために Cloudflare D1 を使用しています。

## セットアップ

### 1. ローカル開発環境

```bash
# D1データベースの作成
npx wrangler d1 create estat-db

# ローカル開発用のD1インスタンスを起動
npx wrangler d1 execute estat-db --local --file=./database/schemas/main.sql

# 開発サーバー起動
npm run dev
```

### 2. 本番環境

```bash
# 本番環境にデプロイ
npx wrangler d1 execute estat-db --file=./database/schemas/main.sql
npx wrangler deploy
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

- **データ変換**: `src/lib/estat/statsdata/EstatStatsDataService.ts`
- **データベース操作**: `src/lib/estat/metadata-database.ts`
- **API 呼び出し**: `src/services/estat-api.ts`
- **保存処理**: `src/app/api/estat/metadata/save/route.ts`
