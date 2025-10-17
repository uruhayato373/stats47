---
title: データベースバックアップ・リストアガイド
created: 2025-10-17
updated: 2025-10-17
tags:
  - domain/database
  - operations
  - backup
  - restore
---

# データベースバックアップ・リストアガイド

## 概要

stats47 プロジェクトにおけるデータベースのバックアップ戦略、リストア手順、環境間のデータ同期について説明します。

## バックアップ戦略

### 1. バックアップの種類

#### 完全バックアップ

```bash
# ローカル環境の完全バックアップ
npx wrangler d1 execute stats47 --local --command '.dump' > database/backups/local_full_backup_$(date +%Y%m%d_%H%M%S).sql

# ステージング環境の完全バックアップ
npx wrangler d1 execute stats47 --env staging --command '.dump' > database/backups/staging_full_backup_$(date +%Y%m%d_%H%M%S).sql

# 本番環境の完全バックアップ
npx wrangler d1 execute stats47 --env production --command '.dump' > database/backups/production_full_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 差分バックアップ

```bash
# 特定のテーブルのみのバックアップ
npx wrangler d1 execute stats47 --local --command "
SELECT * FROM users WHERE updated_at >= datetime('now', '-1 day')
" > database/backups/users_incremental_$(date +%Y%m%d_%H%M%S).json
```

### 2. 自動バックアップスクリプト

```bash
#!/bin/bash
# database/scripts/backup.sh

set -e

# 設定
BACKUP_DIR="database/backups"
DATE=$(date +%Y%m%d_%H%M%S)
ENVIRONMENT=${1:-local}

# バックアップディレクトリの作成
mkdir -p "$BACKUP_DIR"

# 環境別バックアップ
case "$ENVIRONMENT" in
  "local")
    echo "Creating local database backup..."
    npx wrangler d1 execute stats47 --local --command '.dump' > "$BACKUP_DIR/local_backup_$DATE.sql"
    ;;
  "staging")
    echo "Creating staging database backup..."
    npx wrangler d1 execute stats47 --env staging --command '.dump' > "$BACKUP_DIR/staging_backup_$DATE.sql"
    ;;
  "production")
    echo "Creating production database backup..."
    npx wrangler d1 execute stats47 --env production --command '.dump' > "$BACKUP_DIR/production_backup_$DATE.sql"
    ;;
  *)
    echo "Usage: $0 {local|staging|production}"
    exit 1
    ;;
esac

echo "Backup completed: $BACKUP_DIR/${ENVIRONMENT}_backup_$DATE.sql"

# 古いバックアップの削除（30日以上前）
find "$BACKUP_DIR" -name "${ENVIRONMENT}_backup_*.sql" -mtime +30 -delete

echo "Old backups cleaned up"
```

### 3. 定期バックアップの設定

#### Cron ジョブの設定

```bash
# crontab -e で以下を追加

# 毎日午前2時にローカル環境のバックアップ
0 2 * * * /path/to/project/database/scripts/backup.sh local

# 毎日午前3時にステージング環境のバックアップ
0 3 * * * /path/to/project/database/scripts/backup.sh staging

# 毎日午前4時に本番環境のバックアップ
0 4 * * * /path/to/project/database/scripts/backup.sh production
```

#### GitHub Actions での自動バックアップ

```yaml
# .github/workflows/backup-database.yml
name: Database Backup

on:
  schedule:
    - cron: "0 2 * * *" # 毎日午前2時
  workflow_dispatch: # 手動実行も可能

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Backup staging database
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          npx wrangler d1 execute stats47 --env staging --command '.dump' > staging_backup_$(date +%Y%m%d_%H%M%S).sql

      - name: Upload backup to artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-${{ github.run_number }}
          path: staging_backup_*.sql
          retention-days: 30
```

## リストア手順

### 1. 完全リストア

```bash
# ローカル環境へのリストア
npx wrangler d1 execute stats47 --local --file=database/backups/local_backup_20241017_020000.sql

# ステージング環境へのリストア
npx wrangler d1 execute stats47 --env staging --file=database/backups/staging_backup_20241017_030000.sql

# 本番環境へのリストア（注意が必要）
npx wrangler d1 execute stats47 --env production --file=database/backups/production_backup_20241017_040000.sql
```

### 2. 部分リストア

```bash
# 特定のテーブルのみをリストア
npx wrangler d1 execute stats47 --local --command "
DELETE FROM users;
INSERT INTO users SELECT * FROM temp_users;
"
```

### 3. リストアスクリプト

```bash
#!/bin/bash
# database/scripts/restore.sh

set -e

# 設定
BACKUP_FILE=$1
ENVIRONMENT=${2:-local}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file> [environment]"
  echo "Available environments: local, staging, production"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# 環境別リストア
case "$ENVIRONMENT" in
  "local")
    echo "Restoring to local database..."
    npx wrangler d1 execute stats47 --local --file="$BACKUP_FILE"
    ;;
  "staging")
    echo "Restoring to staging database..."
    npx wrangler d1 execute stats47 --env staging --file="$BACKUP_FILE"
    ;;
  "production")
    echo "WARNING: Restoring to production database!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      npx wrangler d1 execute stats47 --env production --file="$BACKUP_FILE"
    else
      echo "Restore cancelled"
      exit 1
    fi
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    echo "Available environments: local, staging, production"
    exit 1
    ;;
esac

echo "Restore completed successfully"
```

## 環境間データ同期

### 1. 開発環境への本番データ同期

```bash
#!/bin/bash
# database/scripts/sync-prod-to-dev.sh

set -e

echo "Syncing production data to development environment..."

# 本番データのエクスポート
echo "Exporting production data..."
npx wrangler d1 execute stats47 --env production --command '.dump' > temp_prod_backup.sql

# 開発環境のクリア
echo "Clearing development database..."
npx wrangler d1 execute stats47 --local --command 'DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS estat_metainfo;'

# 開発環境へのリストア
echo "Restoring to development database..."
npx wrangler d1 execute stats47 --local --file=temp_prod_backup.sql

# 一時ファイルの削除
rm temp_prod_backup.sql

echo "Sync completed successfully"
```

### 2. ステージング環境への本番データ同期

```bash
#!/bin/bash
# database/scripts/sync-prod-to-staging.sh

set -e

echo "Syncing production data to staging environment..."

# 本番データのエクスポート
echo "Exporting production data..."
npx wrangler d1 execute stats47 --env production --command '.dump' > temp_prod_backup.sql

# ステージング環境のクリア
echo "Clearing staging database..."
npx wrangler d1 execute stats47 --env staging --command 'DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS estat_metainfo;'

# ステージング環境へのリストア
echo "Restoring to staging database..."
npx wrangler d1 execute stats47 --env staging --file=temp_prod_backup.sql

# 一時ファイルの削除
rm temp_prod_backup.sql

echo "Sync completed successfully"
```

### 3. データマスキング

```bash
#!/bin/bash
# database/scripts/mask-sensitive-data.sh

set -e

BACKUP_FILE=$1
MASKED_FILE=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$MASKED_FILE" ]; then
  echo "Usage: $0 <input_backup> <output_masked_backup>"
  exit 1
fi

echo "Masking sensitive data in backup file..."

# メールアドレスのマスキング
sed 's/[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/user@example.com/g' "$BACKUP_FILE" > "$MASKED_FILE"

# 電話番号のマスキング
sed -i 's/[0-9]\{3\}-[0-9]\{4\}-[0-9]\{4\}/000-0000-0000/g' "$MASKED_FILE"

# 個人名のマスキング
sed -i 's/name = '\''[^'\'']*'\''/name = '\''User Name'\''/g' "$MASKED_FILE"

echo "Data masking completed: $MASKED_FILE"
```

## バックアップの検証

### 1. バックアップファイルの整合性チェック

```bash
#!/bin/bash
# database/scripts/verify-backup.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Verifying backup file: $BACKUP_FILE"

# SQLファイルの構文チェック
if ! sqlite3 < /dev/null < "$BACKUP_FILE" 2>/dev/null; then
  echo "ERROR: Backup file contains invalid SQL"
  exit 1
fi

# テーブル構造の確認
echo "Checking table structure..."
TABLES=$(sqlite3 < "$BACKUP_FILE" ".tables" 2>/dev/null)

if [ -z "$TABLES" ]; then
  echo "ERROR: No tables found in backup file"
  exit 1
fi

echo "Tables found: $TABLES"

# レコード数の確認
echo "Checking record counts..."
for table in $TABLES; do
  COUNT=$(sqlite3 < "$BACKUP_FILE" "SELECT COUNT(*) FROM $table;" 2>/dev/null)
  echo "  $table: $COUNT records"
done

echo "Backup verification completed successfully"
```

### 2. リストア後の検証

```bash
#!/bin/bash
# database/scripts/verify-restore.sh

set -e

ENVIRONMENT=${1:-local}

echo "Verifying restored database in $ENVIRONMENT environment..."

# データベース接続テスト
case "$ENVIRONMENT" in
  "local")
    npx wrangler d1 execute stats47 --local --command "SELECT 1 as test;"
    ;;
  "staging")
    npx wrangler d1 execute stats47 --env staging --command "SELECT 1 as test;"
    ;;
  "production")
    npx wrangler d1 execute stats47 --env production --command "SELECT 1 as test;"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "Database connection test passed"

# テーブル存在確認
echo "Checking table existence..."
TABLES=("users" "estat_metainfo" "ranking_items" "ranking_visualizations")

for table in "${TABLES[@]}"; do
  case "$ENVIRONMENT" in
    "local")
      npx wrangler d1 execute stats47 --local --command "SELECT COUNT(*) FROM $table;"
      ;;
    "staging")
      npx wrangler d1 execute stats47 --env staging --command "SELECT COUNT(*) FROM $table;"
      ;;
    "production")
      npx wrangler d1 execute stats47 --env production --command "SELECT COUNT(*) FROM $table;"
      ;;
  esac
  echo "  $table: OK"
done

echo "Restore verification completed successfully"
```

## 災害復旧計画

### 1. RTO/RPO 目標

- **RTO (Recovery Time Objective)**: 4 時間以内
- **RPO (Recovery Point Objective)**: 24 時間以内

### 2. 復旧手順

```bash
#!/bin/bash
# database/scripts/disaster-recovery.sh

set -e

echo "Starting disaster recovery procedure..."

# 1. 最新のバックアップファイルを特定
LATEST_BACKUP=$(ls -t database/backups/production_backup_*.sql | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup files found"
  exit 1
fi

echo "Latest backup: $LATEST_BACKUP"

# 2. バックアップファイルの検証
./database/scripts/verify-backup.sh "$LATEST_BACKUP"

# 3. 本番環境へのリストア
echo "Restoring to production environment..."
npx wrangler d1 execute stats47 --env production --file="$LATEST_BACKUP"

# 4. リストア後の検証
./database/scripts/verify-restore.sh production

echo "Disaster recovery completed successfully"
```

## 監視とアラート

### 1. バックアップ監視

```bash
#!/bin/bash
# database/scripts/monitor-backups.sh

set -e

BACKUP_DIR="database/backups"
ALERT_EMAIL="admin@example.com"

# 最新のバックアップファイルをチェック
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/production_backup_*.sql 2>/dev/null | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ALERT: No production backup files found" | mail -s "Database Backup Alert" "$ALERT_EMAIL"
  exit 1
fi

# バックアップファイルの作成日時をチェック
BACKUP_AGE=$(($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")))

# 24時間以上古い場合はアラート
if [ $BACKUP_AGE -gt 86400 ]; then
  echo "ALERT: Latest backup is $((BACKUP_AGE / 3600)) hours old" | mail -s "Database Backup Alert" "$ALERT_EMAIL"
fi

echo "Backup monitoring completed"
```

### 2. ストレージ使用量監視

```bash
#!/bin/bash
# database/scripts/monitor-storage.sh

set -e

BACKUP_DIR="database/backups"
MAX_SIZE_GB=10

# バックアップディレクトリのサイズをチェック
SIZE_GB=$(du -s "$BACKUP_DIR" | awk '{print $1/1024/1024}')

if (( $(echo "$SIZE_GB > $MAX_SIZE_GB" | bc -l) )); then
  echo "ALERT: Backup directory size is ${SIZE_GB}GB (limit: ${MAX_SIZE_GB}GB)" | mail -s "Storage Alert" "admin@example.com"
fi

echo "Storage monitoring completed"
```

## 関連ドキュメント

- [データベース設計](../specifications/database-design.md)
- [マイグレーションガイド](../specifications/migration-guide.md)
- [開発環境セットアップ](../implementation/development-setup.md)
- [トラブルシューティング](./troubleshooting.md)
