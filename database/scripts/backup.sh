#!/bin/bash
# database/scripts/backup.sh
# データベースバックアップスクリプト
# バックアップは年月日ごとのディレクトリで管理されます

set -e

# 設定
BACKUP_BASE_DIR="database/backups"
DATE_DIR=$(date +%Y-%m-%d)
DATE_FILE=$(date +%Y%m%d_%H%M%S)
ENVIRONMENT=${1:-local}

# バックアップディレクトリの作成（年月日ごと）
BACKUP_DIR="$BACKUP_BASE_DIR/$DATE_DIR"
mkdir -p "$BACKUP_DIR"

# 環境別バックアップ
case "$ENVIRONMENT" in
  "local")
    echo "Creating local database backup..."
    npx wrangler d1 export stats47 --local --output="$BACKUP_DIR/local_backup_$DATE_FILE.sql"
    echo "Backup completed: $BACKUP_DIR/local_backup_$DATE_FILE.sql"
    ;;
  "staging")
    echo "Creating staging database backup..."
    npx wrangler d1 export stats47 --env staging --output="$BACKUP_DIR/staging_backup_$DATE_FILE.sql"
    echo "Backup completed: $BACKUP_DIR/staging_backup_$DATE_FILE.sql"
    ;;
  "production")
    echo "Creating production database backup..."
    npx wrangler d1 export stats47 --env production --output="$BACKUP_DIR/production_backup_$DATE_FILE.sql"
    echo "Backup completed: $BACKUP_DIR/production_backup_$DATE_FILE.sql"
    ;;
  *)
    echo "Usage: $0 {local|staging|production}"
    echo "Available environments: local, staging, production"
    exit 1
    ;;
esac

# 古いバックアップの削除（30日以上前）
echo "Cleaning up old backups (older than 30 days)..."
find "$BACKUP_BASE_DIR" -type d -name "20*" -mtime +30 -exec rm -rf {} + 2>/dev/null || true

echo "Old backups cleaned up"

