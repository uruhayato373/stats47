#!/bin/bash

# e-Stat メタデータ用D1データベース管理スクリプト
# 使用方法: ./database/manage.sh [コマンド]

set -e

# 設定
DATABASE_NAME="stats47"
MAIN_SCHEMA_FILE="./database/schemas/main.sql"

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
    echo "  schema      - メインスキーマの適用"
    echo "  status      - データベースの状態確認"
    echo "  help        - このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 init              # データベースの初期化"
    echo "  $0 create            # データベースの作成のみ"
    echo "  $0 schema            # メインスキーマの適用"
    echo "  $0 status            # データベースの状態確認"
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

# メインスキーマの適用
apply_main_schema() {
    log_info "メインスキーマを適用中..."

    if [ ! -f "$MAIN_SCHEMA_FILE" ]; then
        log_error "メインスキーマファイルが見つかりません: $MAIN_SCHEMA_FILE"
        exit 1
    fi

    # 本番D1データベースにスキーマを適用
    npx wrangler d1 execute $DATABASE_NAME --file="$MAIN_SCHEMA_FILE"

    log_info "メインスキーマが適用されました。"
}


# データベースの状態確認
check_status() {
    log_info "データベースの状態を確認中..."

    # メインスキーマファイルの確認
    if [ -f "$MAIN_SCHEMA_FILE" ]; then
        log_info "メインスキーマファイル: 存在 ($MAIN_SCHEMA_FILE)"
    else
        log_error "メインスキーマファイル: 存在しません"
    fi

    # wrangler.toml の確認
    if [ -f "wrangler.toml" ]; then
        log_info "wrangler.toml: 存在"

        # database_id の確認
        if grep -q "database_id" "wrangler.toml"; then
            log_info "database_id: 設定済み"
        else
            log_warning "database_id: 未設定（./database/manage.sh create 実行後に設定してください）"
        fi
    else
        log_warning "wrangler.toml: 存在しません"
    fi

    # D1データベースの確認
    log_info "D1データベース確認中..."
    if npx wrangler d1 list | grep -q "$DATABASE_NAME"; then
        log_info "D1データベース '$DATABASE_NAME': 存在"
    else
        log_warning "D1データベース '$DATABASE_NAME': 存在しません"
    fi
}

# データベースの初期化
init_database() {
    log_info "データベースを初期化中..."

    # データベースの作成
    create_database

    # メインスキーマの適用
    apply_main_schema

    log_info "データベースの初期化が完了しました。"
    log_info "wrangler.toml の database_id を更新してください。"
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
        apply_main_schema
        ;;
    "status")
        check_status
        ;;
    "help"|*)
        show_help
        ;;
esac
