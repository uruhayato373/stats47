#!/bin/bash

# データベース管理スクリプト
# 使用方法: ./database/manage.sh [コマンド]

set -e

# 設定
DB_NAME="stats47-auth-db"
SCHEMA_DIR="database/schemas"
MIGRATIONS_DIR="database/migrations"

# ヘルプ表示
show_help() {
    echo "使用方法: $0 [コマンド]"
    echo ""
    echo "コマンド:"
    echo "  init      - データベースを初期化"
    echo "  migrate   - 最新のマイグレーションを適用"
    echo "  reset     - データベースをリセット"
    echo "  status    - スキーマバージョンの状態を表示"
    echo "  backup    - データベースをバックアップ"
    echo "  help      - このヘルプを表示"
    echo ""
}

# データベース初期化
init_database() {
    echo "データベースを初期化しています..."
    
    # メインスキーマを適用
    wrangler d1 execute $DB_NAME --file=./database/schemas/main.sql
    
    echo "✅ データベースの初期化が完了しました"
}

# マイグレーション適用
run_migrations() {
    echo "マイグレーションを適用しています..."
    
    # 最新のマイグレーションを適用
    wrangler d1 execute $DB_NAME --file=./database/migrations/001_initial_schema.sql
    
    echo "✅ マイグレーションが完了しました"
}

# データベースリセット
reset_database() {
    echo "⚠️  データベースをリセットします。すべてのデータが削除されます。"
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "データベースをリセットしています..."
        
        # 既存のテーブルを削除
        wrangler d1 execute $DB_NAME --command="DROP TABLE IF EXISTS estat_metadata;"
        wrangler d1 execute $DB_NAME --command="DROP TABLE IF EXISTS sessions;"
        wrangler d1 execute $DB_NAME --command="DROP TABLE IF EXISTS users;"
        wrangler d1 execute $DB_NAME --command="DROP TABLE IF EXISTS schema_versions;"
        
        # 初期化
        init_database
        
        echo "✅ データベースのリセットが完了しました"
    else
        echo "リセットをキャンセルしました"
    fi
}

# スキーマバージョン状態表示
show_status() {
    echo "スキーマバージョンの状態を確認しています..."
    
    wrangler d1 execute $DB_NAME --command="SELECT * FROM schema_versions ORDER BY applied_at DESC;"
}

# データベースバックアップ
backup_database() {
    echo "データベースをバックアップしています..."
    
    # バックアップディレクトリ作成
    BACKUP_DIR="database/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # 各テーブルのデータをエクスポート
    wrangler d1 execute $DB_NAME --command="SELECT * FROM users;" > $BACKUP_DIR/users.csv
    wrangler d1 execute $DB_NAME --command="SELECT * FROM estat_metadata;" > $BACKUP_DIR/estat_metadata.csv
    wrangler d1 execute $DB_NAME --command="SELECT * FROM schema_versions;" > $BACKUP_DIR/schema_versions.csv
    
    echo "✅ バックアップが完了しました: $BACKUP_DIR"
}

# メイン処理
case "${1:-help}" in
    init)
        init_database
        ;;
    migrate)
        run_migrations
        ;;
    reset)
        reset_database
        ;;
    status)
        show_status
        ;;
    backup)
        backup_database
        ;;
    help|*)
        show_help
        ;;
esac
