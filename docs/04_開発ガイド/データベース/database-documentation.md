---
title: stats47 データベース 完全ガイド
created: 2025-10-13
updated: 2025-10-16
tags:
  - domain/database
  - refactoring
---

# stats47 データベース 完全ガイド

## 目次

1. [概要](#概要)
2. [データベースアーキテクチャ](#データベースアーキテクチャ)
3. [テーブル一覧とスキーマ](#テーブル一覧とスキーマ)
4. [接続方法](#接続方法)
5. [マイグレーション管理](#マイグレーション管理)
6. [運用手順](#運用手順)
7. [パフォーマンス最適化](#パフォーマンス最適化)
8. [トラブルシューティング](#トラブルシューティング)
9. [開発ワークフロー](#開発ワークフロー)

---

## 概要

### プロジェクト情報

- **プロジェクト名**: stats47
- **データベース**: Cloudflare D1 (SQLite)
- **ORM**: なし（生SQLとプリペアドステートメント）
- **マイグレーション**: Wrangler D1 Migrations
- **バックアップ**: SQLダンプ

### データベース環境

| 環境 | データベース | 接続方法 | 用途 |
|------|------------|---------|------|
| **ローカル開発** | `.wrangler/state/.../xxx.sqlite` | better-sqlite3 | 開発・テスト |
| **ステージング** | Cloudflare D1 (dev) | REST API | 統合テスト |
| **本番** | Cloudflare D1 (prod) | REST API | 本番運用 |

### 主要機能

1. **認証・認可**: NextAuth.js を使用したユーザー管理
2. **e-Statメタデータ**: 政府統計データのメタ情報管理
3. **ランキングデータ**: 都道府県別ランキングのキャッシュ
4. **可視化設定**: 地図・グラフの表示設定管理

---

## データベースアーキテクチャ

### 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                     stats47 データベース                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │ 認証・認可        │   │ e-Statメタデータ  │                   │
│  ├──────────────────┤   ├──────────────────┤                   │
│  │ • users          │   │ • estat_metainfo │                   │
│  │ • accounts       │   │ • estat_data_    │                   │
│  │ • sessions       │   │   history        │                   │
│  │ • verification_  │   └──────────────────┘                   │
│  │   tokens         │                                           │
│  └──────────────────┘                                           │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐                   │
│  │ ランキング設定    │   │ ランキングデータ  │                   │
│  ├──────────────────┤   ├──────────────────┤                   │
│  │ • subcategory_   │   │ • estat_ranking_ │                   │
│  │   configs        │   │   values         │                   │
│  │ • ranking_items  │   │ • ranking_values │                   │
│  │ • subcategory_   │   │   (将来)         │                   │
│  │   ranking_items  │   └──────────────────┘                   │
│  │ • data_source_   │                                           │
│  │   metadata       │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### データフロー

```
┌──────────────┐
│ ユーザー      │
└──────┬───────┘
       │ ① ログイン
       ▼
┌──────────────┐
│ NextAuth.js  │──────► users テーブル
└──────┬───────┘        accounts テーブル
       │ ② 認証済み      sessions テーブル
       ▼
┌──────────────┐
│ API Route    │
└──────┬───────┘
       │ ③ データ取得
       ▼
┌──────────────────────────────────┐
│ キャッシュチェック                │
│ • estat_ranking_values にデータあり？│
└──────┬───────────────────────────┘
       │
       ├─ Yes ──► キャッシュから返却
       │
       └─ No ───► ④ e-Stat API 呼び出し
                  │
                  ▼
            ┌─────────────┐
            │ e-Stat API  │
            └──────┬──────┘
                   │ ⑤ データ整形
                   ▼
            ┌─────────────────────┐
            │ estat_ranking_values│◄─ INSERT
            │ (キャッシュ保存)     │
            └─────────────────────┘
                   │
                   └─► ⑥ クライアントへ返却
```

---

## テーブル一覧とスキーマ

### 1. 認証関連テーブル

#### `users`

ユーザーアカウント情報

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',           -- 'admin' | 'user'
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

**主要カラム**:
- `role`: 権限管理（admin/user）
- `is_active`: アカウント有効/無効
- `password_hash`: bcryptでハッシュ化（10 rounds）

#### `accounts`, `sessions`, `verification_tokens`

NextAuth.js が使用する標準テーブル（詳細は Auth.js ドキュメント参照）

### 2. e-Stat メタデータテーブル

#### `estat_metainfo`

e-Stat APIから取得した統計メタデータ

```sql
CREATE TABLE estat_metainfo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,           -- 統計表ID（例: '0000010102'）
  stat_name TEXT NOT NULL,               -- 統計名
  title TEXT NOT NULL,                   -- タイトル
  cat01 TEXT,                            -- カテゴリ1
  item_name TEXT,                        -- 項目名
  unit TEXT,                             -- 単位
  ranking_key TEXT,                      -- ランキングキー
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stats_data_id ON estat_metainfo(stats_data_id);
CREATE INDEX idx_stat_name ON estat_metainfo(stat_name);
CREATE INDEX idx_cat01 ON estat_metainfo(cat01);
CREATE INDEX idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);
```

**用途**:
- e-Stat APIから取得したメタデータのキャッシュ
- 統計データの検索とフィルタリング

#### `estat_data_history`

統計データの変更履歴

```sql
CREATE TABLE estat_data_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  action TEXT NOT NULL,               -- 'created' | 'updated' | 'deleted'
  user_id INTEGER,
  metadata_snapshot TEXT,             -- JSON形式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_history_stats_id ON estat_data_history(stats_data_id);
CREATE INDEX idx_history_user_id ON estat_data_history(user_id);
```

### 3. ランキング設定テーブル

#### `subcategory_configs`

サブカテゴリの設定

```sql
CREATE TABLE subcategory_configs (
  id TEXT PRIMARY KEY,                  -- 'land-area', 'land-use'
  category_id TEXT NOT NULL,            -- 'landweather'
  name TEXT NOT NULL,                   -- '土地面積'
  description TEXT,
  default_ranking_key TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subcategory_configs_category ON subcategory_configs(category_id);
```

#### `ranking_items`

ランキング項目の定義

```sql
CREATE TABLE ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  ranking_key TEXT NOT NULL,            -- 'totalAreaExcluding'
  label TEXT NOT NULL,                  -- UI表示用
  stats_data_id TEXT NOT NULL,          -- e-Stat統計表ID
  cd_cat01 TEXT NOT NULL,               -- e-Statカテゴリコード
  unit TEXT NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,

  -- 可視化設定
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, ranking_key)
);

CREATE INDEX idx_ranking_items_subcategory ON ranking_items(subcategory_id);
CREATE INDEX idx_ranking_items_active ON ranking_items(is_active);
```

**可視化設定の説明**:
- `map_color_scheme`: D3カラースキーム名
- `ranking_direction`: 'asc'（昇順）または 'desc'（降順）
- `conversion_factor`: データ表示時の変換係数（例: ha → km²は 0.01）
- `decimal_places`: 小数点以下の桁数

#### `subcategory_ranking_items` (将来実装)

サブカテゴリとランキング項目の多対多関係

```sql
CREATE TABLE subcategory_ranking_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  ranking_item_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, ranking_item_id)
);
```

#### `data_source_metadata` (将来実装)

データソース固有のメタデータ

```sql
CREATE TABLE data_source_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_item_id INTEGER NOT NULL,
  data_source_id TEXT NOT NULL,
  metadata TEXT NOT NULL,               -- JSON形式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. ランキングデータテーブル

#### `estat_ranking_values`

e-Stat APIから取得したランキングデータのキャッシュ

```sql
CREATE TABLE estat_ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  area_code TEXT NOT NULL,              -- 都道府県コード（例: '01000'）
  category_code TEXT NOT NULL,
  time_code TEXT NOT NULL,
  value TEXT NOT NULL,
  numeric_value REAL,
  display_value TEXT,
  rank INTEGER,
  unit TEXT,
  area_name TEXT,
  category_name TEXT,
  time_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stats_data_id, category_code, time_code, area_code)
);

CREATE INDEX idx_estat_ranking_lookup
  ON estat_ranking_values(stats_data_id, category_code, time_code);
CREATE INDEX idx_estat_ranking_area
  ON estat_ranking_values(area_code);
```

**キャッシュ戦略**:
- TTL: 30日（デフォルト）
- UNIQUE制約で重複防止
- INSERT ON CONFLICT で自動更新

#### `ranking_values` (将来実装)

汎用ランキングデータテーブル

```sql
CREATE TABLE ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ranking_key TEXT NOT NULL,            -- データソース非依存
  area_code TEXT NOT NULL,
  time_code TEXT NOT NULL,
  numeric_value REAL,
  rank INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ranking_key, time_code, area_code)
);
```

---

## 接続方法

### ローカル開発環境

#### better-sqlite3 を使用

```typescript
import { createLocalD1Database } from "@/lib/local-d1-client";

const db = await createLocalD1Database();
const result = await db
  .prepare("SELECT * FROM users WHERE email = ?")
  .bind("user@example.com")
  .first();
```

**特徴**:
- 高速（1-5ms）
- オフライン可能
- デバッグ容易

### 本番環境

#### Cloudflare D1 REST API を使用

```typescript
import { createD1Database } from "@/lib/d1-client";

const db = await createD1Database();
const result = await db
  .prepare("SELECT * FROM users WHERE email = ?")
  .bind("user@example.com")
  .first();
```

**特徴**:
- スケーラブル
- 自動バックアップ
- グローバル分散

### 環境自動判定

```typescript
// 環境に応じて自動選択
const db = process.env.NODE_ENV === "production"
  ? await createD1Database()
  : await createLocalD1Database();
```

---

## マイグレーション管理

### マイグレーションファイルの構造

```
database/
├── migrations/
│   ├── 001_auth_js_integration.sql
│   ├── 002_add_visualization_to_ranking_items.sql
│   └── 003_remove_unused_columns.sql
└── schemas/
    ├── main.sql
    ├── ranking_items.sql
    └── estat_ranking_values.sql
```

### マイグレーションの作成

```bash
# 新しいマイグレーションファイルを作成
touch database/migrations/004_add_new_feature.sql
```

**ファイル例**:
```sql
-- 004_add_new_feature.sql

-- テーブル作成
CREATE TABLE IF NOT EXISTS new_feature (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_new_feature_name ON new_feature(name);
```

### マイグレーションの適用

#### ローカル環境

```bash
# ローカルD1にマイグレーション適用
npx wrangler d1 migrations apply stats47 --local
```

#### 開発環境（リモート）

```bash
# 開発用D1にマイグレーション適用
npx wrangler d1 migrations apply stats47-dev --remote
```

#### 本番環境

```bash
# 本番D1にマイグレーション適用（注意！）
npx wrangler d1 migrations apply stats47 --remote

# ドライラン（実際には適用しない）
npx wrangler d1 migrations apply stats47 --remote --dry-run
```

### マイグレーションのロールバック

```bash
# 最後のマイグレーションを元に戻す
# ⚠️ D1は自動ロールバック非対応のため、手動でロールバックSQLを作成

# 例: 005_rollback_004.sql
DROP TABLE IF EXISTS new_feature;
DROP INDEX IF EXISTS idx_new_feature_name;

# 適用
npx wrangler d1 execute stats47 --local --file=database/migrations/005_rollback_004.sql
```

---

## 運用手順

### データベースの初期化

#### 1. ローカル環境

```bash
# 1. Wranglerを起動してローカルD1を生成
npx wrangler dev

# 2. マイグレーションを適用
npx wrangler d1 migrations apply stats47 --local

# 3. シードデータを投入（オプション）
npx wrangler d1 execute stats47 --local --file=database/seeds/users_seed.sql
```

#### 2. 本番環境

```bash
# 1. D1データベースを作成（初回のみ）
npx wrangler d1 create stats47

# 2. wrangler.toml にdatabase_idを記載

# 3. マイグレーションを適用
npx wrangler d1 migrations apply stats47 --remote

# 4. 初期管理ユーザーを作成
npx wrangler d1 execute stats47 --remote --file=database/seeds/admin_user.sql
```

### データのバックアップ

#### SQLダンプの作成

```bash
# ローカルD1のダンプ
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxx.sqlite .dump > backup-$(date +%Y%m%d).sql

# リモートD1のダンプ（Wrangler経由）
npx wrangler d1 export stats47 --remote --output=backup-$(date +%Y%m%d).sql
```

#### 定期バックアップスクリプト

```bash
#!/bin/bash
# database/backup.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="database/backups"
mkdir -p $BACKUP_DIR

# 本番DBをバックアップ
npx wrangler d1 export stats47 --remote --output="$BACKUP_DIR/backup-$DATE.sql"

echo "✅ Backup completed: $BACKUP_DIR/backup-$DATE.sql"

# 7日以上前のバックアップを削除
find $BACKUP_DIR -name "backup-*.sql" -mtime +7 -delete
```

```bash
# 実行権限を付与
chmod +x database/backup.sh

# cronで毎日午前2時に実行
# crontab -e
0 2 * * * cd /path/to/stats47 && ./database/backup.sh
```

### データのリストア

```bash
# バックアップから復元（ローカル）
npx wrangler d1 execute stats47 --local --file=backup-20250113.sql

# バックアップから復元（リモート - 注意！）
npx wrangler d1 execute stats47 --remote --file=backup-20250113.sql
```

### データのエクスポート/インポート

#### CSV形式でエクスポート

```bash
# SQLiteコマンドでCSVエクスポート
sqlite3 .wrangler/state/v3/d1/xxx.sqlite \
  -header -csv \
  "SELECT * FROM users;" > users.csv
```

#### CSVからインポート

```bash
# CSVからSQLに変換してインポート
sqlite3 .wrangler/state/v3/d1/xxx.sqlite <<EOF
.mode csv
.import users.csv users
EOF
```

---

## パフォーマンス最適化

### 1. インデックスの最適化

#### インデックスの確認

```sql
-- テーブルのインデックス一覧
SELECT name, sql FROM sqlite_master
WHERE type = 'index' AND tbl_name = 'users';

-- インデックスの使用状況を確認
EXPLAIN QUERY PLAN
SELECT * FROM users WHERE email = 'test@example.com';
```

#### インデックスの作成

```sql
-- よく検索されるカラムにインデックス
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- 複合インデックス
CREATE INDEX IF NOT EXISTS idx_ranking_composite
  ON estat_ranking_values(stats_data_id, category_code, time_code);
```

### 2. クエリの最適化

#### EXPLAIN を使った分析

```sql
-- クエリプランの確認
EXPLAIN QUERY PLAN
SELECT
  ri.ranking_key,
  ri.label,
  erv.numeric_value
FROM ranking_items ri
JOIN estat_ranking_values erv
  ON ri.stats_data_id = erv.stats_data_id
  AND ri.cd_cat01 = erv.category_code
WHERE ri.subcategory_id = 'land-area'
  AND erv.time_code = '2020000000';
```

#### スロークエリの特定

```typescript
// lib/db-monitor.ts

export async function monitorQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(`⚠️ Slow query: ${queryName} (${duration.toFixed(2)}ms)`);
  }

  return result;
}

// 使用例
const data = await monitorQuery(
  () => db.prepare("SELECT * FROM users").all(),
  "getAllUsers"
);
```

### 3. キャッシュ戦略

#### アプリケーションレベルのキャッシュ

```typescript
// lib/cache.ts

const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

export function setCache<T>(key: string, data: T, ttlSeconds: number = 300) {
  cache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

// 使用例
export async function getRankingData(rankingKey: string, timeCode: string) {
  const cacheKey = `ranking:${rankingKey}:${timeCode}`;

  // キャッシュチェック
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // DBから取得
  const db = await createD1Database();
  const result = await db
    .prepare("SELECT * FROM ranking_values WHERE ranking_key = ? AND time_code = ?")
    .bind(rankingKey, timeCode)
    .all();

  // キャッシュに保存
  setCache(cacheKey, result.results, 300); // 5分間キャッシュ

  return result.results;
}
```

### 4. バッチ処理

```typescript
// ❌ 非効率: N+1クエリ
for (const userId of userIds) {
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  // ...
}

// ✅ 効率的: INクエリ
const placeholders = userIds.map(() => "?").join(",");
const users = await db
  .prepare(`SELECT * FROM users WHERE id IN (${placeholders})`)
  .bind(...userIds)
  .all();
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. テーブルが存在しない

**エラー**:
```
no such table: users
```

**原因**: マイグレーションが適用されていない

**解決方法**:
```bash
# マイグレーションを適用
npx wrangler d1 migrations apply stats47 --local
```

#### 2. UNIQUE制約違反

**エラー**:
```
UNIQUE constraint failed: users.email
```

**原因**: 既に存在するメールアドレスで登録しようとしている

**解決方法**:
```sql
-- 既存レコードを確認
SELECT * FROM users WHERE email = 'test@example.com';

-- 必要に応じて更新または削除
UPDATE users SET email = 'newemail@example.com' WHERE email = 'test@example.com';
-- または
DELETE FROM users WHERE email = 'test@example.com';
```

#### 3. ローカルD1ファイルが見つからない

**エラー**:
```
ENOENT: no such file or directory
```

**原因**: Wranglerを起動していない、またはパスが間違っている

**解決方法**:
```bash
# 1. Wranglerを起動
npx wrangler dev

# 2. ファイルパスを確認
find .wrangler -name "*.sqlite"

# 3. .env.local にパスを設定
LOCAL_D1_PATH=actual_path_here
```

#### 4. マイグレーションの競合

**エラー**:
```
Migration 002 has already been applied
```

**原因**: 既に適用されたマイグレーションを再度適用しようとしている

**解決方法**:
```bash
# マイグレーション履歴を確認
npx wrangler d1 migrations list stats47 --local

# 必要に応じて手動でロールバックSQLを作成
```

#### 5. データベースロック

**エラー**:
```
database is locked
```

**原因**: 別のプロセスがデータベースをロックしている

**解決方法**:
```bash
# ローカルD1の場合: 他のプロセスを終了
pkill -f wrangler

# しばらく待ってから再試行
```

### デバッグツール

#### SQLiteコマンドラインツール

```bash
# ローカルD1に接続
sqlite3 .wrangler/state/v3/d1/xxx.sqlite

# テーブル一覧
.tables

# テーブル構造を確認
.schema users

# データを確認
SELECT * FROM users LIMIT 10;

# 終了
.quit
```

#### D1 Console (Cloudflare Dashboard)

```bash
# ブラウザでD1コンソールを開く
npx wrangler d1 info stats47 --remote
# 表示されるURLをブラウザで開く
```

---

## 開発ワークフロー

### 新機能開発の手順

#### 1. データベース設計

```markdown
## 機能: ユーザープロフィール

### 新規テーブル
- user_profiles (id, user_id, bio, avatar_url)

### 変更
- users テーブルに profile_completed カラムを追加
```

#### 2. マイグレーションファイル作成

```sql
-- database/migrations/006_add_user_profiles.sql

CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT 0;

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

#### 3. ローカルでテスト

```bash
# マイグレーション適用
npx wrangler d1 migrations apply stats47 --local

# データを確認
sqlite3 .wrangler/state/v3/d1/xxx.sqlite "SELECT * FROM user_profiles;"
```

#### 4. APIエンドポイント実装

```typescript
// app/api/profile/route.ts

import { createLocalD1Database } from "@/lib/local-d1-client";

export async function GET(request: Request) {
  const db = await createLocalD1Database();
  const userId = 1; // セッションから取得

  const profile = await db
    .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
    .bind(userId)
    .first();

  return Response.json({ profile });
}
```

#### 5. テストの作成

```typescript
// tests/profile.test.ts

describe("User Profile API", () => {
  it("should create a new profile", async () => {
    const response = await fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify({ bio: "Hello World" }),
    });

    expect(response.status).toBe(200);
  });
});
```

#### 6. 本番デプロイ

```bash
# 1. コードをGitHubにプッシュ
git add .
git commit -m "feat: add user profile feature"
git push origin main

# 2. 本番環境にマイグレーション適用
npx wrangler d1 migrations apply stats47 --remote

# 3. デプロイ（Vercel自動デプロイまたは手動）
```

### データベースレビューチェックリスト

開発者がマイグレーションをレビューする際のチェックリスト：

- [ ] テーブル名、カラム名が命名規則に従っているか
- [ ] 適切なインデックスが作成されているか
- [ ] 外部キー制約が適切に設定されているか
- [ ] UNIQUE制約が必要な箇所に設定されているか
- [ ] デフォルト値が適切か
- [ ] NULLを許可すべきか、NOT NULLにすべきか
- [ ] マイグレーションファイルに`IF NOT EXISTS`があるか
- [ ] ロールバックSQLが必要な場合、準備されているか
- [ ] 本番データへの影響を考慮しているか

---

## 関連ドキュメント

- [データベース設計](./database-design.md) - テーブル設計の詳細
- [データベーススキーマリファクタリング計画](database-refactoring-plan.md) - 将来の改善計画
- [データベース環境分離実装ガイド](./database-environment-setup.md) - 環境構築手順
- [Cloudflare D1 公式ドキュメント](https://developers.cloudflare.com/d1/)
- [SQLite 公式ドキュメント](https://www.sqlite.org/docs.html)

---

## 付録

### A. よく使うクエリ集

#### ユーザー管理

```sql
-- アクティブユーザー数
SELECT COUNT(*) FROM users WHERE is_active = 1;

-- 管理者一覧
SELECT username, email FROM users WHERE role = 'admin';

-- 最近ログインしたユーザー
SELECT username, last_login
FROM users
WHERE last_login IS NOT NULL
ORDER BY last_login DESC
LIMIT 10;
```

#### ランキングデータ

```sql
-- 特定年度のランキングデータ
SELECT
  area_name,
  numeric_value,
  rank
FROM estat_ranking_values
WHERE stats_data_id = '0000010102'
  AND category_code = 'B1101'
  AND time_code = '2020000000'
ORDER BY rank;

-- キャッシュヒット率の分析
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT stats_data_id) as unique_stats,
  COUNT(DISTINCT time_code) as time_periods
FROM estat_ranking_values;
```

#### メンテナンス

```sql
-- データベースサイズ
SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();

-- テーブルごとのレコード数
SELECT
  name,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as count
FROM sqlite_master m
WHERE type='table';

-- 古いキャッシュを削除
DELETE FROM estat_ranking_values
WHERE updated_at < datetime('now', '-30 days');
```

### B. パフォーマンスベンチマーク

| 操作 | ローカルD1 | リモートD1 | 備考 |
|------|-----------|-----------|------|
| 単純SELECT | 1-5ms | 100-300ms | 1件取得 |
| JOIN (2テーブル) | 5-20ms | 150-500ms | - |
| INSERT | 2-10ms | 100-300ms | 1件挿入 |
| バッチINSERT (100件) | 50-100ms | 1-3秒 | - |
| UNIQUE制約チェック | 1-5ms | 100-300ms | - |

### C. セキュリティベストプラクティス

1. **SQLインジェクション対策**
   ```typescript
   // ✅ プリペアドステートメント
   db.prepare("SELECT * FROM users WHERE email = ?").bind(email)

   // ❌ 文字列連結
   db.prepare(`SELECT * FROM users WHERE email = '${email}'`)
   ```

2. **センシティブデータの暗号化**
   ```typescript
   import bcrypt from "bcryptjs";

   const hashedPassword = await bcrypt.hash(password, 10);
   ```

3. **アクセス制御**
   ```typescript
   // ミドルウェアで権限チェック
   if (session.user.role !== "admin") {
     return Response.json({ error: "Unauthorized" }, { status: 403 });
   }
   ```

---

**作成者**: Claude Code
**最終更新**: 2025-01-13
**バージョン**: 1.0
