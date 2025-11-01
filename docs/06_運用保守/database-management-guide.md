# データベース管理ガイド

作成日: 2025-10-29

---

## 目次

1. [基本概念](#基本概念)
2. [ディレクトリ構造](#ディレクトリ構造)
3. [スキーマ（Schema）](#スキーマschema)
4. [マイグレーション（Migration）](#マイグレーションmigration)
5. [シード（Seed）](#シードseed)
6. [環境別運用](#環境別運用)
7. [実践的なワークフロー](#実践的なワークフロー)
8. [ベストプラクティス](#ベストプラクティス)
9. [トラブルシューティング](#トラブルシューティング)

---

## 基本概念

### データベース管理の3つの柱

| 概念 | 役割 | タイミング | ファイル形式 |
|------|------|------------|--------------|
| **スキーマ** | データベース構造の定義 | 初期構築時 | `schemas/main.sql` |
| **マイグレーション** | スキーマの変更履歴管理 | 構造変更時 | `migrations/XXX_*.sql` |
| **シード** | 初期データの投入 | 開発・テスト時 | `seeds/*_seed.sql` |

### 比喩で理解する

- **スキーマ**: 建物の設計図（全体の構造）
- **マイグレーション**: 増改築の記録（変更履歴）
- **シード**: 家具の配置（初期データ）

---

## ディレクトリ構造

```
database/
├── README.md                       # データベース管理の概要
├── manage.sh                       # データベース管理スクリプト
│
├── schemas/                        # スキーマ定義
│   └── main.sql                    # メインスキーマ（全テーブル定義）
│
├── migrations/                     # マイグレーション履歴
│   ├── 025_simplify_ranking_schema.sql
│   └── 026_refactor_data_source_metadata_to_ranking_key.sql
│
├── seeds/                          # シードデータ
│   ├── users_seed.sql              # ユーザーサンプルデータ
│   ├── estat_ranking_mappings_seed.sql  # e-Stat ランキングマッピングデータ
│   ├── ranking_groups_seed.sql     # ランキンググループデータ
│   ├── dashboard_configs_seed.sql  # ダッシュボード設定データ
│   └── ...
│   ├── dashboard_widgets_seed.sql  # ダッシュボードウィジェットデータ
│   └── widget_templates_seed.sql   # ウィジェットテンプレートデータ
│
├── scripts/                        # ユーティリティスクリプト
│   └── check-duplicates.sql        # 重複データチェック
│
└── backups/                        # バックアップファイル
    └── 20251015/
        ├── production_dump.sql     # 本番データダンプ
        └── import_to_staging.sql   # ステージング用インポート
```

---

## スキーマ（Schema）

### 概要

**スキーマ**は、データベースの全体構造（テーブル、カラム、インデックス、制約）を定義するものです。

### 役割

- データベースの**完全な構造**を1つのファイルで表現
- 新規環境構築時の**唯一の真実の源**
- すべてのテーブル定義を一元管理

### このプロジェクトのスキーマ

**ファイル**: `database/schemas/main.sql`

**含まれるテーブル群**:

#### 1. 認証関連（Auth.js準拠）
```sql
-- users: ユーザー管理
-- accounts: OAuth連携
-- sessions: セッション管理
-- verification_tokens: メール認証トークン
```

#### 2. e-Stat API関連
```sql
-- estat_metainfo: e-Stat統計メタデータ
-- estat_metainfo_cache: キャッシュデータ
```

#### 3. ランキング関連
```sql
-- ranking_items: ランキングアイテム
-- ranking_groups: ランキンググループ
-- ranking_values: ランキング値データ
```

#### 4. ダッシュボード関連
```sql
-- dashboard_configs: ダッシュボード設定
-- dashboard_widgets: ダッシュボードウィジェット
-- widget_templates: ウィジェットテンプレート
```

#### 5. カテゴリ・地域関連
```sql
-- categories: カテゴリマスタ
-- subcategories: サブカテゴリマスタ
-- prefectures: 都道府県マスタ
-- cities: 市区町村マスタ
```

### スキーマの適用

#### 開発環境（ローカルD1）

```bash
# 方法1: wranglerコマンド
npx wrangler d1 execute stats47 --local --file=./database/schemas/main.sql

# 方法2: 管理スクリプト
./database/manage.sh schema
```

#### ステージング環境

```bash
npx wrangler d1 execute stats47_staging \
  --env staging \
  --remote \
  --file=./database/schemas/main.sql
```

#### 本番環境

```bash
# ⚠️ 本番環境では通常スキーマを直接適用しません
# マイグレーションを使用してください
npx wrangler d1 migrations apply stats47 --remote
```

### スキーマファイルの構造

```sql
-- ============================================================================
-- 1. 認証関連テーブル（Auth.js準拠）
-- ============================================================================

-- users: ユーザー認証・管理テーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  -- ...
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================================================
-- 2. e-Stat API関連テーブル
-- ============================================================================
-- ...
```

### スキーマ変更時の注意点

#### ❌ やってはいけないこと

```sql
-- 既存のテーブルを削除して再作成
DROP TABLE users;
CREATE TABLE users (...);
```

これを行うと**すべてのデータが消失**します。

#### ✅ 正しい方法

```sql
-- 新しいカラムを追加（マイグレーション）
ALTER TABLE users ADD COLUMN last_login DATETIME;
```

マイグレーションファイルを作成し、変更履歴を管理します。

---

## マイグレーション（Migration）

### 概要

**マイグレーション**は、データベーススキーマの**変更履歴**を管理する仕組みです。

### なぜマイグレーションが必要か？

#### 問題点: スキーマを直接変更する場合

```bash
# 開発者Aがusersテーブルに新しいカラムを追加
ALTER TABLE users ADD COLUMN last_login DATETIME;

# 開発者Bの環境では？
# → このカラムが存在しない！
# → アプリケーションがエラー！
```

#### 解決策: マイグレーションで管理

```bash
# マイグレーションファイルを作成
database/migrations/027_add_last_login_to_users.sql

# 全員が同じマイグレーションを適用
npx wrangler d1 migrations apply stats47 --local
```

全員が**同じデータベース構造**になります。

### マイグレーションの命名規則

```
database/migrations/
├── 025_simplify_ranking_schema.sql          # 連番_変更内容.sql
├── 026_refactor_data_source_metadata_to_ranking_key.sql
└── 027_add_last_login_to_users.sql          # 次のマイグレーション
```

**形式**: `{連番3桁}_{変更内容のスネークケース}.sql`

- **連番**: `001`, `002`, ..., `025`, `026`, ...
- **変更内容**: 何を変更したかを簡潔に記述

### マイグレーションファイルの作成

#### ステップ1: ファイル作成

```bash
# 次の連番を確認
ls database/migrations/ | tail -1
# → 026_refactor_data_source_metadata_to_ranking_key.sql

# 新しいマイグレーションファイルを作成
touch database/migrations/027_add_last_login_to_users.sql
```

#### ステップ2: SQL文を記述

```sql
-- database/migrations/027_add_last_login_to_users.sql
-- ユーザーテーブルに最終ログイン日時を追加

-- last_loginカラムを追加
ALTER TABLE users ADD COLUMN last_login DATETIME;

-- インデックスを作成（必要な場合）
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
```

#### ステップ3: マイグレーションを適用

```bash
# 開発環境
npx wrangler d1 migrations apply stats47 --local

# ステージング環境
npx wrangler d1 migrations apply stats47_staging --env staging --remote

# 本番環境
npx wrangler d1 migrations apply stats47 --remote
```

### マイグレーションの種類

#### 1. テーブル作成

```sql
-- 新しいテーブルを追加
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 2. カラム追加

```sql
-- 既存テーブルに新しいカラムを追加
ALTER TABLE users ADD COLUMN phone_number TEXT;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0;
```

#### 3. インデックス追加

```sql
-- パフォーマンス向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_ranking_values_ranking_key
  ON ranking_values(ranking_key);
```

#### 4. テーブル名変更（注意が必要）

```sql
-- テーブル名を変更
ALTER TABLE old_table_name RENAME TO new_table_name;
```

#### 5. データ移行を伴う変更

```sql
-- 新しいカラムを追加
ALTER TABLE ranking_items ADD COLUMN group_id INTEGER;

-- 既存データを移行
UPDATE ranking_items
SET group_id = (
  SELECT group_id FROM ranking_group_items
  WHERE ranking_group_items.item_id = ranking_items.id
);

-- 古いテーブルを削除
DROP TABLE IF EXISTS ranking_group_items;
```

### マイグレーションのベストプラクティス

#### ✅ DO（推奨）

1. **小さく、頻繁に**
   ```sql
   -- Good: 1つの変更に1つのマイグレーション
   -- 027_add_last_login.sql
   ALTER TABLE users ADD COLUMN last_login DATETIME;

   -- 028_add_phone_number.sql
   ALTER TABLE users ADD COLUMN phone_number TEXT;
   ```

2. **IF NOT EXISTS / IF EXISTS を使用**
   ```sql
   -- テーブル作成
   CREATE TABLE IF NOT EXISTS notifications (...);

   -- インデックス作成
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

   -- テーブル削除
   DROP TABLE IF EXISTS old_table;
   ```

3. **コメントを記述**
   ```sql
   -- ユーザーの最終ログイン日時を追跡するためのカラム追加
   -- 要件: セキュリティ監視機能の実装（Issue #123）
   ALTER TABLE users ADD COLUMN last_login DATETIME;
   ```

4. **main.sqlにも反映**
   ```sql
   -- マイグレーション適用後、schemas/main.sql も更新する
   -- これにより、新規環境では最初からlast_loginカラムが存在
   ```

#### ❌ DON'T（非推奨）

1. **既存のマイグレーションを変更しない**
   ```bash
   # Bad: 既に適用されたマイグレーションを編集
   vim database/migrations/025_simplify_ranking_schema.sql
   ```

   新しいマイグレーションを作成してください。

2. **DROP TABLEを安易に使わない**
   ```sql
   -- Bad: 既存データが消える
   DROP TABLE users;
   CREATE TABLE users (...);

   -- Good: 必要なカラムだけ追加
   ALTER TABLE users ADD COLUMN new_column TEXT;
   ```

3. **複数の無関係な変更を1つに混ぜない**
   ```sql
   -- Bad: 複数のテーブル変更を1つのマイグレーションに
   ALTER TABLE users ADD COLUMN last_login DATETIME;
   ALTER TABLE rankings ADD COLUMN is_featured BOOLEAN;
   ALTER TABLE dashboard_configs ADD COLUMN theme TEXT;

   -- Good: 別々のマイグレーションに分ける
   ```

### マイグレーション状態の確認

```bash
# 適用済みマイグレーションの確認
npx wrangler d1 migrations list stats47 --local

# 未適用のマイグレーションがあるか確認
npx wrangler d1 migrations list stats47 --remote
```

---

## シード（Seed）

### 概要

**シード**は、データベースに**初期データ**を投入することです。

### シードデータの種類

#### 1. マスターデータ（必須データ）

本番環境でも必要なデータ：

```sql
-- prefectures_seed.sql（都道府県マスタ）
INSERT INTO prefectures (code, name, region) VALUES
  ('01', '北海道', '北海道'),
  ('13', '東京都', '関東'),
  ('27', '大阪府', '近畿'),
  -- ...
  ('47', '沖縄県', '沖縄');
```

#### 2. サンプルデータ（開発・テスト用）

開発環境でのみ使用するデータ：

```sql
-- users_seed.sql（開発用ユーザー）
INSERT INTO users (id, name, email, username, password_hash, role, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Administrator', 'admin@stats47.local', 'admin', '$2b$10$...', 'admin', 1),
  ('00000000-0000-0000-0000-000000000002', 'Test User', 'user@stats47.local', 'testuser', '$2b$10$...', 'user', 1);
```

#### 3. デモデータ

プレゼンテーションやデモ用のリアルなデータ：

```sql
-- ranking_itemsテーブルはR2→D1同期機能で自動生成されます
-- 管理画面の「R2→D1同期（ranking_items自動生成）」から実行してください
-- 詳細: docs/01_技術設計/03_ドメイン設計/17_eStat-API-ランキング管理.md
```

### このプロジェクトのシードファイル

```
database/seeds/
├── users_seed.sql                # 開発用ユーザー（admin, testuser）
├── estat_metainfo_seed.sql       # e-Stat メタ情報
├── estat_ranking_mappings_seed.sql  # e-Stat ランキングマッピング
├── ranking_groups_seed.sql       # ランキンググループ
├── dashboard_configs_seed.sql    # ダッシュボード設定のサンプル
├── dashboard_widgets_seed.sql    # ダッシュボードウィジェットのサンプル
└── widget_templates_seed.sql     # ウィジェットテンプレート
```

**注意**: `ranking_items_seed.sql`は削除されました。`ranking_items`テーブルはR2→D1同期機能で自動生成・更新されます。

### シードデータの投入方法

#### 方法1: 個別に投入

```bash
# 開発環境: ユーザーシードを投入
npx wrangler d1 execute stats47 \
  --local \
  --file=./database/seeds/users_seed.sql

# ランキングアイテムはR2→D1同期機能で自動生成されます
# 管理画面の「R2→D1同期（ranking_items自動生成）」から実行してください
```

#### 方法2: 一括投入スクリプト

```bash
#!/bin/bash
# database/scripts/seed-all.sh

# 全てのシードファイルを順番に投入
for seed_file in database/seeds/*.sql; do
  echo "Applying seed: $seed_file"
  npx wrangler d1 execute stats47 --local --file="$seed_file"
done
```

実行:
```bash
chmod +x database/scripts/seed-all.sh
./database/scripts/seed-all.sh
```

#### 方法3: 初期化スクリプトに組み込み

```bash
# scripts/init-local-db.sh の例

# スキーマ適用
npx wrangler d1 execute stats47 --local --file=./database/schemas/main.sql

# マイグレーション適用
npx wrangler d1 migrations apply stats47 --local

# シードデータ投入（開発環境のみ）
if [ "$NODE_ENV" != "production" ]; then
  npx wrangler d1 execute stats47 --local --file=./database/seeds/users_seed.sql
  # ranking_itemsはR2→D1同期機能で自動生成されます
fi
```

### シードデータ作成のベストプラクティス

#### 1. べき等性を保つ

何度実行しても同じ結果になるようにする：

```sql
-- Bad: 重複エラーが発生する
INSERT INTO users (id, email, ...) VALUES ('uuid-1', 'admin@local', ...);

-- Good: 既存データを削除してから挿入
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
INSERT INTO users (id, email, ...) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@stats47.local', ...);

-- Better: UPSERT（SQLiteではREPLACEを使用）
REPLACE INTO users (id, email, ...) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@stats47.local', ...);
```

#### 2. コメントで説明を追加

```sql
-- 開発用サンプルユーザー
-- パスワード: admin123 (ハッシュ化済み)
INSERT INTO users (id, name, email, username, password_hash, role)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Administrator',
   'admin@stats47.local',
   'admin',
   '$2b$10$pp6HL4f9XElzUtMSGU4SD.88T/CUuxHxu83f3k871IZ7zmALZ0YiK',  -- admin123
   'admin');
```

#### 3. 環境に応じて使い分ける

```sql
-- production_seeds/      # 本番環境用（マスターデータのみ）
-- development_seeds/     # 開発環境用（サンプルデータ）
-- testing_seeds/         # テスト環境用（テストデータ）
```

---

## 環境別運用

### 環境構成

| 環境 | データベース名 | 用途 | リモート/ローカル |
|------|----------------|------|-------------------|
| **Development** | `stats47` | ローカル開発 | ローカル（SQLite） |
| **Staging** | `stats47_staging` | テスト・検証 | リモート（Cloudflare D1） |
| **Production** | `stats47` | 本番運用 | リモート（Cloudflare D1） |

### Development（開発環境）

#### 特徴

- ローカルのSQLiteファイル（`.wrangler/state/v3/d1/`）
- 自由に破壊・再構築可能
- シードデータを使って開発

#### セットアップ

```bash
# 初期化スクリプトで一括セットアップ
npm run db:init:local

# 内部で実行される処理:
# 1. スキーマ適用
# 2. マイグレーション適用
# 3. シードデータ投入
```

#### リセット方法

```bash
# データベースを完全リセット
npm run db:reset:local

# または手動で:
rm -rf .wrangler/state/v3/d1
npm run db:init:local
```

#### 日常的な操作

```bash
# テーブル一覧確認
npx wrangler d1 execute stats47 --local \
  --command "SELECT name FROM sqlite_master WHERE type='table';"

# データ確認
npx wrangler d1 execute stats47 --local \
  --command "SELECT * FROM users LIMIT 5;"

# マイグレーション適用
npm run db:migrations:local
```

### Staging（ステージング環境）

#### 特徴

- 本番環境と同等の構成
- 本番デプロイ前の最終確認
- リモートD1を使用

#### セットアップ

```bash
# マイグレーション適用
npm run db:migrations:staging

# シードデータ投入（初回のみ）
npx wrangler d1 execute stats47_staging \
  --env staging \
  --remote \
  --file=./database/seeds/users_seed.sql
```

#### 本番データの同期

```bash
# 本番データをステージングにコピー
npx wrangler d1 execute stats47 --remote \
  --command ".dump" > database/backups/production_dump.sql

npx wrangler d1 execute stats47_staging \
  --env staging \
  --remote \
  --file=database/backups/production_dump.sql
```

### Production（本番環境）

#### 特徴

- **慎重な操作が必須**
- マイグレーションは必ずテスト後に適用
- データバックアップを常に取る

#### マイグレーション適用の手順

```bash
# ステップ1: バックアップ
npm run db:dump:staging  # まずステージングでテスト

# ステップ2: ステージングで動作確認
npm run db:migrations:staging
# → アプリケーションの動作確認

# ステップ3: 本番環境にバックアップ
npx wrangler d1 execute stats47 --remote \
  --command ".dump" > database/backups/production_$(date +%Y%m%d).sql

# ステップ4: 本番マイグレーション適用
npm run db:migrations:production
```

#### データ確認（読み取り専用）

```bash
# テーブル一覧
npx wrangler d1 execute stats47 --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table';"

# データ件数確認
npx wrangler d1 execute stats47 --remote \
  --command "SELECT COUNT(*) FROM users;"
```

---

## 実践的なワークフロー

### シナリオ1: 新しいテーブルを追加したい

#### ステップ1: マイグレーションファイル作成

```bash
# 次の連番を確認
ls database/migrations/ | tail -1
# → 026_refactor_data_source_metadata_to_ranking_key.sql

# 新しいマイグレーションを作成
touch database/migrations/027_create_notifications_table.sql
```

#### ステップ2: SQL文を記述

```sql
-- database/migrations/027_create_notifications_table.sql
-- 通知機能のためのテーブル作成

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',  -- info, warning, error, success
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
```

#### ステップ3: ローカルで適用・テスト

```bash
# マイグレーション適用
npx wrangler d1 migrations apply stats47 --local

# テーブルが作成されたか確認
npx wrangler d1 execute stats47 --local \
  --command "SELECT sql FROM sqlite_master WHERE name='notifications';"

# テストデータ挿入
npx wrangler d1 execute stats47 --local \
  --command "INSERT INTO notifications (id, user_id, title, message) VALUES ('test-1', '00000000-0000-0000-0000-000000000001', 'テスト通知', 'これはテストです');"
```

#### ステップ4: main.sqlに反映

```sql
-- database/schemas/main.sql
-- 最後に notifications テーブル定義を追加

-- ============================================================================
-- 6. 通知関連テーブル
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
```

#### ステップ5: コミット

```bash
git add database/migrations/027_create_notifications_table.sql
git add database/schemas/main.sql
git commit -m "feat(db): 通知テーブルを追加"
```

#### ステップ6: ステージング・本番に展開

```bash
# ステージング
npm run db:migrations:staging

# 動作確認後、本番
npm run db:migrations:production
```

### シナリオ2: 既存テーブルにカラムを追加したい

#### ステップ1: マイグレーション作成

```bash
touch database/migrations/028_add_two_factor_to_users.sql
```

#### ステップ2: SQL記述

```sql
-- database/migrations/028_add_two_factor_to_users.sql
-- ユーザーテーブルに2要素認証フラグを追加

ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
```

#### ステップ3: 適用・テスト

```bash
npx wrangler d1 migrations apply stats47 --local

# カラムが追加されたか確認
npx wrangler d1 execute stats47 --local \
  --command "PRAGMA table_info(users);"
```

#### ステップ4: main.sqlにも反映

```sql
-- database/schemas/main.sql
-- users テーブル定義に追加

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  -- ... 既存のカラム ...
  two_factor_enabled BOOLEAN DEFAULT 0,      -- 追加
  two_factor_secret TEXT,                    -- 追加
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### シナリオ3: 開発環境をリセットして最新状態にしたい

```bash
# ステップ1: ローカルDBを削除
npm run db:reset:local

# ステップ2: 最新のスキーマとマイグレーションを適用
# (npm run db:reset:local 内で自動実行)

# ステップ3: シードデータを投入（必要に応じて）
npx wrangler d1 execute stats47 --local \
  --file=./database/seeds/users_seed.sql
```

### シナリオ4: 本番データをローカルに持ってきたい

```bash
# ステップ1: 本番データをダンプ
npx wrangler d1 execute stats47 --remote \
  --command ".dump" > database/backups/production_$(date +%Y%m%d).sql

# ステップ2: ローカルDBをリセット
npm run db:reset:local

# ステップ3: ダンプファイルを適用
npx wrangler d1 execute stats47 --local \
  --file=database/backups/production_$(date +%Y%m%d).sql
```

---

## ベストプラクティス

### スキーマ設計

#### ✅ DO

1. **適切な型を使用**
   ```sql
   -- Good
   CREATE TABLE events (
     id TEXT PRIMARY KEY,              -- UUID
     user_id TEXT NOT NULL,            -- UUID (外部キー)
     event_date DATE,                  -- 日付のみ
     created_at DATETIME,              -- 日時
     is_active BOOLEAN DEFAULT 1,      -- 真偽値
     count INTEGER DEFAULT 0           -- 整数
   );
   ```

2. **外部キー制約を設定**
   ```sql
   CREATE TABLE posts (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   ```

3. **インデックスを適切に作成**
   ```sql
   -- 検索頻度の高いカラム
   CREATE INDEX idx_posts_user_id ON posts(user_id);

   -- 複合インデックス
   CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
   ```

4. **NOT NULL制約を活用**
   ```sql
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,      -- 必須
     name TEXT,                        -- オプション
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   ```

#### ❌ DON'T

1. **過度に正規化しない**
   ```sql
   -- Bad: 3回もJOINが必要
   SELECT * FROM users
   JOIN addresses ON users.address_id = addresses.id
   JOIN cities ON addresses.city_id = cities.id
   JOIN prefectures ON cities.prefecture_id = prefectures.id;

   -- Good: 適度な非正規化
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     prefecture_code TEXT,  -- 都道府県コードを直接保持
     city_code TEXT         -- 市区町村コードを直接保持
   );
   ```

2. **TEXT型を乱用しない**
   ```sql
   -- Bad
   CREATE TABLE events (
     count TEXT,           -- 数値なのにTEXT
     is_active TEXT        -- 真偽値なのにTEXT
   );

   -- Good
   CREATE TABLE events (
     count INTEGER,
     is_active BOOLEAN
   );
   ```

### マイグレーション管理

#### ✅ DO

1. **小さく分割する**
   ```bash
   # Good: 1つの変更に1つのマイグレーション
   027_add_notifications_table.sql
   028_add_two_factor_to_users.sql
   029_add_last_login_to_users.sql

   # Bad: 複数の変更を1つに
   027_multiple_changes.sql
   ```

2. **わかりやすい命名**
   ```bash
   # Good
   027_create_notifications_table.sql
   028_add_two_factor_authentication.sql
   029_remove_deprecated_columns.sql

   # Bad
   027_update.sql
   028_fix.sql
   029_changes.sql
   ```

3. **ロールバック可能にする（可能な限り）**
   ```sql
   -- マイグレーション: 027_add_column.sql
   ALTER TABLE users ADD COLUMN phone_number TEXT;

   -- ロールバック: 027_add_column_rollback.sql（参考）
   -- ALTER TABLE users DROP COLUMN phone_number;
   -- ※ SQLiteはDROP COLUMNをサポートしていません
   ```

#### ❌ DON'T

1. **適用済みマイグレーションを編集しない**
   ```bash
   # Bad: 既にデプロイされたマイグレーションを変更
   git commit -m "fix: マイグレーション025を修正"

   # Good: 新しいマイグレーションで修正
   git commit -m "feat: マイグレーション030で025の問題を修正"
   ```

2. **本番環境で試験的なマイグレーションを実行しない**
   ```bash
   # Bad
   npx wrangler d1 migrations apply stats47 --remote  # テストしていない

   # Good
   npx wrangler d1 migrations apply stats47 --local   # ローカルでテスト
   npx wrangler d1 migrations apply stats47_staging --remote  # ステージングでテスト
   npx wrangler d1 migrations apply stats47 --remote  # 本番適用
   ```

### シードデータ管理

#### ✅ DO

1. **べき等性を保つ**
   ```sql
   -- 何度実行しても同じ結果
   DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
   INSERT INTO users (...) VALUES (...);
   ```

2. **環境を分ける**
   ```
   seeds/
   ├── development/      # 開発用サンプルデータ
   ├── staging/          # ステージング用データ
   └── production/       # 本番マスターデータ
   ```

3. **パスワードをハッシュ化**
   ```sql
   -- Good: bcryptでハッシュ化
   INSERT INTO users (password_hash) VALUES ('$2b$10$...');

   -- Bad: 平文パスワード
   INSERT INTO users (password) VALUES ('password123');
   ```

#### ❌ DON'T

1. **本番環境にテストデータを投入しない**
   ```bash
   # Bad
   npx wrangler d1 execute stats47 --remote \
     --file=./database/seeds/test_users.sql
   ```

2. **機密情報をシードに含めない**
   ```sql
   -- Bad
   INSERT INTO api_keys (key, secret) VALUES
     ('prod-key-123', 'super-secret-value');

   -- Good: 環境変数から読み込む設計にする
   ```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. マイグレーションが適用されない

**症状**:
```bash
npx wrangler d1 migrations apply stats47 --local
# → "No migrations to apply"
```

**原因**:
- マイグレーションファイルが認識されていない
- 既に適用済み

**解決方法**:
```bash
# マイグレーション一覧を確認
npx wrangler d1 migrations list stats47 --local

# ファイル名を確認
ls database/migrations/

# wrangler.tomlの設定を確認
grep "migrations_dir" wrangler.toml
# → migrations_dir = "database/migrations"
```

#### 2. "table already exists" エラー

**症状**:
```bash
Error: table "users" already exists
```

**原因**:
- スキーマを2回適用した
- マイグレーションとスキーマが重複

**解決方法**:
```sql
-- CREATE TABLE に IF NOT EXISTS を付ける
CREATE TABLE IF NOT EXISTS users (...);
```

#### 3. 外部キー制約エラー

**症状**:
```bash
Error: FOREIGN KEY constraint failed
```

**原因**:
- 参照先のレコードが存在しない
- 外部キー制約が有効になっていない（SQLite）

**解決方法**:
```bash
# 外部キー制約を有効化（SQLite）
npx wrangler d1 execute stats47 --local \
  --command "PRAGMA foreign_keys = ON;"

# 参照先のレコードを先に挿入
INSERT INTO users (id, ...) VALUES ('user-1', ...);
INSERT INTO posts (user_id, ...) VALUES ('user-1', ...);
```

#### 4. マイグレーションの順序が狂った

**症状**:
```bash
026_xxx.sql より 025_yyy.sql が後に作られた
```

**解決方法**:
```bash
# ファイル名を変更して順序を修正
mv database/migrations/025_yyy.sql database/migrations/027_yyy.sql

# または、ローカルをリセット
npm run db:reset:local
```

#### 5. ローカルDBが破損した

**症状**:
```bash
Error: database disk image is malformed
```

**解決方法**:
```bash
# ローカルDBを完全リセット
rm -rf .wrangler/state/v3/d1
npm run db:init:local
```

#### 6. ステージング環境と本番環境が同期していない

**症状**:
本番環境で動作するが、ステージング環境でエラーが発生

**解決方法**:
```bash
# 本番環境のマイグレーション状態を確認
npx wrangler d1 migrations list stats47 --remote

# ステージング環境のマイグレーション状態を確認
npx wrangler d1 migrations list stats47_staging --env staging --remote

# ステージング環境に未適用のマイグレーションを適用
npm run db:migrations:staging
```

---

## チートシート

### よく使うコマンド一覧

#### ローカル開発

```bash
# 初期化
npm run db:init:local

# リセット
npm run db:reset:local

# マイグレーション適用
npm run db:migrations:local

# テーブル一覧
npx wrangler d1 execute stats47 --local \
  --command "SELECT name FROM sqlite_master WHERE type='table';"

# データ確認
npx wrangler d1 execute stats47 --local \
  --command "SELECT * FROM users LIMIT 5;"

# シード投入
npx wrangler d1 execute stats47 --local \
  --file=./database/seeds/users_seed.sql
```

#### ステージング環境

```bash
# マイグレーション適用
npm run db:migrations:staging

# データ確認
npx wrangler d1 execute stats47_staging --env staging --remote \
  --command "SELECT COUNT(*) FROM users;"

# バックアップ
npm run db:dump:staging
```

#### 本番環境

```bash
# マイグレーション適用（慎重に）
npm run db:migrations:production

# バックアップ
npx wrangler d1 execute stats47 --remote \
  --command ".dump" > database/backups/production_$(date +%Y%m%d).sql
```

---

## まとめ

### 重要なポイント

1. **スキーマ**: データベースの全体構造を定義（`schemas/main.sql`）
2. **マイグレーション**: スキーマの変更履歴を管理（`migrations/XXX_*.sql`）
3. **シード**: 初期データ・サンプルデータを投入（`seeds/*_seed.sql`）

### 開発フロー

```
1. ローカルで開発
   ├── マイグレーション作成
   ├── ローカルでテスト
   └── main.sqlに反映

2. ステージング環境で検証
   ├── マイグレーション適用
   └── 動作確認

3. 本番環境にデプロイ
   ├── バックアップ取得
   ├── マイグレーション適用
   └── 動作確認
```

### 次に読むべきドキュメント

- [database/README.md](../../database/README.md) - データベース管理の概要
- [Cloudflare D1 公式ドキュメント](https://developers.cloudflare.com/d1/)
- [wrangler CLI リファレンス](https://developers.cloudflare.com/workers/wrangler/commands/)

---

作成日: 2025-10-29
最終更新日: 2025-10-29
