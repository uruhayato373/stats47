---
title: データベースマイグレーションガイド
created: 2025-10-17
updated: 2025-10-17
tags:
  - domain/database
  - specifications
  - migration
---

# データベースマイグレーションガイド

## 概要

stats47 プロジェクトにおけるデータベースマイグレーションの管理方法、作成手順、ベストプラクティスについて説明します。

## マイグレーション管理システム

### Wrangler D1 マイグレーション

Cloudflare D1 では、Wrangler を使用してマイグレーションを管理します。

- **マイグレーションディレクトリ**: `database/migrations/`
- **ファイル命名規則**: `{番号}_{説明}.sql`
- **実行順序**: ファイル名の番号順

## マイグレーション作成手順

### 1. 新しいマイグレーションの作成

```bash
# 新しいマイグレーションファイルを作成
touch database/migrations/018_add_new_table.sql
```

### 2. マイグレーション内容の記述

```sql
-- database/migrations/018_add_new_table.sql

-- 新しいテーブルの作成
CREATE TABLE new_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX idx_new_table_name ON new_table(name);

-- 既存テーブルの変更
ALTER TABLE existing_table ADD COLUMN new_column TEXT;

-- データの移行
INSERT INTO new_table (name)
SELECT DISTINCT name FROM existing_table;
```

### 3. マイグレーションの実行

#### ローカル環境

```bash
# ローカルD1にマイグレーション適用
npx wrangler d1 migrations apply stats47 --local

# 特定のマイグレーションまで適用
npx wrangler d1 migrations apply stats47 --local --to 018
```

#### ステージング環境

```bash
# ステージング環境にマイグレーション適用
npx wrangler d1 migrations apply stats47 --env staging

# 開発用データベースに適用
npx wrangler d1 migrations apply stats47-dev --remote
```

#### 本番環境

```bash
# 本番環境にマイグレーション適用
npx wrangler d1 migrations apply stats47 --env production
```

## マイグレーションの種類

### 1. スキーマ変更

#### テーブル作成

```sql
-- 新しいテーブルの作成
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### テーブル削除

```sql
-- テーブルの削除
DROP TABLE IF EXISTS old_table;
```

#### カラム追加

```sql
-- カラムの追加
ALTER TABLE users ADD COLUMN phone TEXT;
```

#### カラム削除

```sql
-- カラムの削除（SQLiteでは直接サポートされていない）
-- 新しいテーブルを作成してデータを移行
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new (id, name, email, created_at)
SELECT id, name, email, created_at FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
```

### 2. インデックス操作

#### インデックス作成

```sql
-- インデックスの作成
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_phone ON users(phone);
```

#### インデックス削除

```sql
-- インデックスの削除
DROP INDEX IF EXISTS idx_users_phone;
```

### 3. データ移行

#### データ挿入

```sql
-- 既存データの挿入
INSERT INTO new_table (column1, column2)
SELECT old_column1, old_column2 FROM old_table;
```

#### データ更新

```sql
-- データの更新
UPDATE users SET status = 'active' WHERE status IS NULL;
```

#### データ削除

```sql
-- 不要なデータの削除
DELETE FROM logs WHERE created_at < datetime('now', '-1 year');
```

## ベストプラクティス

### 1. マイグレーション設計

#### 原子性の確保

```sql
-- ✅ 良い例: トランザクション内で実行
BEGIN TRANSACTION;

-- テーブル作成
CREATE TABLE new_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- データ移行
INSERT INTO new_table (name)
SELECT name FROM old_table;

-- 古いテーブル削除
DROP TABLE old_table;

COMMIT;
```

#### ロールバック可能な設計

```sql
-- マイグレーション: 018_add_user_status.sql
-- フォワード
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- ロールバック用のコメント
-- ROLLBACK: ALTER TABLE users DROP COLUMN status;
```

### 2. パフォーマンス考慮

#### 大量データの処理

```sql
-- ✅ 良い例: バッチ処理
-- 大量データを分割して処理
INSERT INTO new_table (id, name)
SELECT id, name FROM old_table
WHERE id BETWEEN 1 AND 1000;

INSERT INTO new_table (id, name)
SELECT id, name FROM old_table
WHERE id BETWEEN 1001 AND 2000;
```

#### インデックスの一時的な無効化

```sql
-- 大量データ挿入時はインデックスを一時的に無効化
DROP INDEX IF EXISTS idx_users_email;

-- データ挿入
INSERT INTO users (id, name, email)
SELECT * FROM temp_users;

-- インデックス再作成
CREATE INDEX idx_users_email ON users(email);
```

### 3. エラーハンドリング

#### 条件付き実行

```sql
-- テーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS new_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- カラムが存在しない場合のみ追加
-- SQLiteでは直接サポートされていないため、アプリケーションレベルで制御
```

#### データ整合性チェック

```sql
-- マイグレーション後の整合性チェック
-- レコード数の確認
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as expected_count FROM temp_users;

-- データの整合性確認
SELECT COUNT(*) as invalid_records
FROM users u
LEFT JOIN temp_users t ON u.id = t.id
WHERE t.id IS NULL;
```

## 環境別マイグレーション戦略

### 開発環境

```bash
# ローカル開発環境
npx wrangler d1 migrations apply stats47 --local

# 開発用リモート環境
npx wrangler d1 migrations apply stats47-dev --remote
```

### ステージング環境

```bash
# ステージング環境での検証
npx wrangler d1 migrations apply stats47 --env staging

# データの整合性確認
npx wrangler d1 execute stats47 --env staging --command="SELECT COUNT(*) FROM users;"
```

### 本番環境

```bash
# 本番環境への適用
npx wrangler d1 migrations apply stats47 --env production

# 本番環境での検証
npx wrangler d1 execute stats47 --env production --command="SELECT COUNT(*) FROM users;"
```

## ロールバック手順

### 1. ロールバック用マイグレーションの作成

```sql
-- database/migrations/019_rollback_add_new_table.sql

-- 追加したテーブルを削除
DROP TABLE IF EXISTS new_table;

-- 追加したカラムを削除（新しいテーブルを作成して移行）
CREATE TABLE users_rollback (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_rollback (id, name, email, created_at)
SELECT id, name, email, created_at FROM users;

DROP TABLE users;
ALTER TABLE users_rollback RENAME TO users;
```

### 2. ロールバックの実行

```bash
# ローカル環境でのロールバック
npx wrangler d1 migrations apply stats47 --local --to 017

# 本番環境でのロールバック
npx wrangler d1 migrations apply stats47 --env production --to 017
```

## トラブルシューティング

### よくある問題

#### 1. マイグレーションの失敗

**症状**: マイグレーション実行時にエラーが発生

**解決方法**:

```bash
# マイグレーション状態の確認
npx wrangler d1 migrations list stats47 --local

# 失敗したマイグレーションの確認
npx wrangler d1 execute stats47 --local --command="SELECT * FROM __d1_migrations;"

# 手動でマイグレーションを修正して再実行
```

#### 2. データの不整合

**症状**: マイグレーション後にデータが期待通りでない

**解決方法**:

```bash
# データの確認
npx wrangler d1 execute stats47 --local --command="SELECT COUNT(*) FROM users;"

# バックアップからの復元
npx wrangler d1 execute stats47 --local --file=database/backups/backup.sql
```

#### 3. パフォーマンスの問題

**症状**: マイグレーション実行が遅い

**解決方法**:

```sql
-- インデックスを一時的に削除
DROP INDEX IF EXISTS idx_users_email;

-- データ処理
-- ...

-- インデックスを再作成
CREATE INDEX idx_users_email ON users(email);
```

## マイグレーション管理スクリプト

### 管理スクリプトの作成

```bash
#!/bin/bash
# database/manage.sh

case "$1" in
  "migrate")
    echo "Applying migrations to local database..."
    npx wrangler d1 migrations apply stats47 --local
    ;;
  "migrate:staging")
    echo "Applying migrations to staging database..."
    npx wrangler d1 migrations apply stats47 --env staging
    ;;
  "migrate:production")
    echo "Applying migrations to production database..."
    npx wrangler d1 migrations apply stats47 --env production
    ;;
  "rollback")
    echo "Rolling back to migration $2..."
    npx wrangler d1 migrations apply stats47 --local --to $2
    ;;
  "status")
    echo "Migration status:"
    npx wrangler d1 migrations list stats47 --local
    ;;
  *)
    echo "Usage: $0 {migrate|migrate:staging|migrate:production|rollback|status}"
    exit 1
    ;;
esac
```

### 使用方法

```bash
# マイグレーション実行
./database/manage.sh migrate

# ステージング環境に適用
./database/manage.sh migrate:staging

# 本番環境に適用
./database/manage.sh migrate:production

# ロールバック
./database/manage.sh rollback 017

# 状態確認
./database/manage.sh status
```

## 監視とログ

### マイグレーション実行ログ

```bash
# マイグレーション実行ログの確認
npx wrangler d1 execute stats47 --local --command="SELECT * FROM __d1_migrations ORDER BY applied_at DESC;"
```

### パフォーマンス監視

```sql
-- マイグレーション実行時間の確認
SELECT
  name,
  applied_at,
  (applied_at - LAG(applied_at) OVER (ORDER BY applied_at)) as duration
FROM __d1_migrations
ORDER BY applied_at DESC;
```

## 関連ドキュメント

- [データベース設計](./database-design.md)
- [スキーマリファレンス](./schema-reference.md)
- [開発環境セットアップ](../implementation/development-setup.md)
- [Cloudflare D1 マイグレーション](https://developers.cloudflare.com/d1/learning/migrations/)
