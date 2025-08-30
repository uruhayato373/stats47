#!/bin/bash

# e-Stat メタデータ用D1データベース管理スクリプト
# 使用方法: ./database/manage.sh [コマンド]

set -e

# 設定
DATABASE_NAME="estat-db"
SCHEMA_FILE="./database/schemas/main.sql"
LOCAL_DB_PATH="./database/local"

# 色付きのログ出力
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# ヘルプ表示
show_help() {
    echo "📚 D1データベース管理スクリプト"
    echo ""
    echo "使用方法: $0 <コマンド>"
    echo ""
    echo "コマンド:"
    echo "  init        - データベースの初期化"
    echo "  create      - データベースの作成"
    echo "  schema      - スキーマの適用"
    echo "  local       - ローカルD1インスタンスの起動"
    echo "  status      - データベースの状態確認"
    echo "  backup      - データベースのバックアップ"
    echo "  restore     - データベースの復元"
    echo "  monitor     - パフォーマンス監視"
    echo "  memory      - メモリ使用量確認"
    echo "  watch       - システムリソース監視（リアルタイム）"
    echo "  help        - このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 init      # データベースの初期化"
    echo "  $0 local     # ローカルD1インスタンスの起動"
    echo "  $0 monitor   # パフォーマンス監視"
    echo "  $0 memory    # メモリ使用量確認"
    echo "  $0 watch     # リアルタイム監視"
}

# データベースの作成
create_database() {
    log_info "D1データベースを作成中..."
    
    if ! command -v npx &> /dev/null; then
        log_error "npx が見つかりません。Node.js がインストールされているか確認してください。"
        exit 1
    fi
    
    if ! command -v npx wrangler &> /dev/null; then
        log_info "wrangler をインストール中..."
        npm install -g wrangler
    fi
    
    npx wrangler d1 create $DATABASE_NAME
    
    log_info "データベース '$DATABASE_NAME' が作成されました。"
    log_info "wrangler.toml の database_id を更新してください。"
}

# スキーマの適用
apply_schema() {
    log_info "スキーマを適用中..."
    
    if [ ! -f "$SCHEMA_FILE" ]; then
        log_error "スキーマファイルが見つかりません: $SCHEMA_FILE"
        exit 1
    fi
    
    # ローカルD1インスタンスにスキーマを適用
    npx wrangler d1 execute $DATABASE_NAME --local --file="$SCHEMA_FILE"
    
    log_info "スキーマが適用されました。"
}

# ローカルD1インスタンスの起動
start_local_d1() {
    log_info "ローカルD1インスタンスを起動中..."
    
    # ローカルディレクトリの作成
    mkdir -p "$LOCAL_DB_PATH"
    
    # ローカルD1インスタンスを起動
    npx wrangler d1 execute $DATABASE_NAME --local --file="$SCHEMA_FILE"
    
    log_info "ローカルD1インスタンスが起動しました。"
    log_info "開発サーバーを起動してください: npm run dev"
}

# データベースの状態確認
check_status() {
    log_info "データベースの状態を確認中..."
    
    # ローカルD1インスタンスの状態確認
    if [ -d "$LOCAL_DB_PATH" ]; then
        log_info "ローカルD1インスタンス: 起動中"
    else
        log_warning "ローカルD1インスタンス: 未起動"
    fi
    
    # スキーマファイルの確認
    if [ -f "$SCHEMA_FILE" ]; then
        log_info "スキーマファイル: 存在 ($SCHEMA_FILE)"
    else
        log_error "スキーマファイル: 存在しません"
    fi
    
    # wrangler.toml の確認
    if [ -f "wrangler.toml" ]; then
        log_info "wrangler.toml: 存在"
    else
        log_warning "wrangler.toml: 存在しません"
    fi
}

# データベースの初期化
init_database() {
    log_info "データベースを初期化中..."
    
    # データベースの作成
    create_database
    
    # スキーマの適用
    apply_schema
    
    log_info "データベースの初期化が完了しました。"
}

# メイン処理
case "${1:-help}" in
    "init")
        init_database
        ;;
    "create")
        create_database
        ;;
    "schema")
        apply_schema
        ;;
    "local")
        start_local_d1
        ;;
    "status")
        check_status
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database
        ;;
    "monitor")
        monitor_performance
        ;;
    "memory")
        check_memory
        ;;
    "watch")
        watch_resources
        ;;
    "help"|*)
        show_help
        ;;
esac
