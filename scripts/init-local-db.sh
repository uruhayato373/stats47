#!/bin/bash
# ローカルD1データベースの初期化スクリプト
# 
# このスクリプトは以下の処理を実行します:
# 1. Wrangler CLIを使用してローカルD1を初期化
# 2. database/schemas/main.sql を適用

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# Wrangler CLIがインストールされているか確認
if ! command -v wrangler &> /dev/null; then
  log_error "Wrangler CLI is not installed."
  log_info "Please install it with: npm install -g wrangler"
  exit 1
fi

log_info "Initializing local D1 database..."

# データベースが存在しない場合はスキーマファイルを適用
if [ ! -f ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/b3c084603f7be30f18c6a887d294217e3e6b2010e83e9d09910eae3515a26884.sqlite" ]; then
  log_info "Creating new local D1 database..."
  # スキーマファイルを適用
  if [ -f "database/schemas/main.sql" ]; then
    log_info "Applying main schema..."
    wrangler d1 execute stats47 --local --file=database/schemas/main.sql || {
      log_error "Failed to apply main schema"
      exit 1
    }
  fi
else
  log_info "Database already exists. Schema already applied."
fi

log_info "Verifying database..."
# データベースの状態を確認
wrangler d1 execute stats47 --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" || {
  log_error "Database verification failed"
  exit 1
}

# シードファイルの適用（オプション）
if [ "${APPLY_SEEDS}" = "true" ]; then
  log_info "Applying seed files..."
  
  # 基本シードファイル（優先度高）
  if [ -f "database/seeds/users_seed.sql" ]; then
    log_info "Applying users seed..."
    wrangler d1 execute stats47 --local --file=database/seeds/users_seed.sql || {
      log_warn "Failed to apply users seed"
    }
  fi
  
  if [ -f "database/seeds/categories_seed.sql" ]; then
    log_info "Applying categories seed..."
    wrangler d1 execute stats47 --local --file=database/seeds/categories_seed.sql || {
      log_warn "Failed to apply categories seed"
    }
  fi
  
  # e-Statメタ情報シード
  if [ -f "database/seeds/estat_metainfo_seed.sql" ]; then
    log_info "Applying estat_metainfo seed..."
    wrangler d1 execute stats47 --local --file=database/seeds/estat_metainfo_seed.sql || {
      log_warn "Failed to apply estat_metainfo seed"
    }
  fi
  
  # e-Statランキングマッピングシード
  if [ -f "database/seeds/estat_ranking_mappings_seed.sql" ]; then
    log_info "Applying estat_ranking_mappings seed..."
    wrangler d1 execute stats47 --local --file=database/seeds/estat_ranking_mappings_seed.sql || {
      log_warn "Failed to apply estat_ranking_mappings seed"
    }
  fi
  
  # ランキング関連シード
  # 注意: 順序が重要です（ranking_groups → ranking_group_subcategories → ranking_items）
  
  if [ -f "database/seeds/ranking_groups_seed.sql" ]; then
    log_info "Applying ranking_groups seed..."
    wrangler d1 execute stats47 --local --file=database/seeds/ranking_groups_seed.sql || {
      log_warn "Failed to apply ranking_groups seed"
    }
  fi
  
  if [ -f "database/seeds/ranking_group_subcategories_seed.sql" ]; then
    log_info "Applying ranking_group_subcategories seed..."
    wrangler d1 execute stats47 --local --file=database/seeds/ranking_group_subcategories_seed.sql || {
      log_warn "Failed to apply ranking_group_subcategories seed"
    }
  fi
  
  if [ -f "database/seeds/ranking_items_seed.sql" ]; then
    log_info "Applying ranking_items seed..."
    wrangler d1 execute stats47 --local --file=database/seeds/ranking_items_seed.sql || {
      log_warn "Failed to apply ranking_items seed"
    }
  fi
  
  # 注意: ranking_itemsテーブルはR2→D1同期機能で自動生成・更新されることも可能です
  # 管理画面の「R2→D1同期（ranking_items自動生成）」から実行してください
fi

log_info "Local D1 database initialized successfully!"
log_info "Database files are located in: .wrangler/state/v3/d1/"
log_info ""
log_info "To apply seed data, run:"
log_info "  APPLY_SEEDS=true npm run db:reset:local"

