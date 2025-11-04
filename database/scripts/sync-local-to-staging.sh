#!/bin/bash
# database/scripts/sync-local-to-staging.sh
# ローカルD1データベースからステージング環境への同期

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
cd "$(dirname "$0")/../.."

# バックアップディレクトリの作成
BACKUP_DIR="database/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/staging_backup_$(date +%Y%m%d_%H%M%S).sql"

log_info "ローカルD1からステージング環境への同期を開始します..."

# 1. ステージング環境のバックアップ（念のため）
log_info "ステージング環境のバックアップを取得中..."
if npx wrangler d1 export stats47_staging --env staging --remote --output="$BACKUP_FILE" 2>/dev/null; then
  log_info "バックアップファイル: $BACKUP_FILE"
else
  log_warn "ステージング環境のバックアップ取得に失敗しましたが、続行します"
fi

# 2. ローカルD1のエクスポート
log_info "ローカルD1のエクスポート中..."
LOCAL_DUMP_FILE="$BACKUP_DIR/local_dump_$(date +%Y%m%d_%H%M%S).sql"

# ローカルD1ファイルの存在確認
LOCAL_DB_FILE=".wrangler/state/v3/d1/miniflare-D1DatabaseObject/b3c084603f7be30f18c6a887d294217e3e6b2010e83e9d09910eae3515a26884.sqlite"
if [ ! -f "$LOCAL_DB_FILE" ]; then
  log_error "ローカルD1データベースファイルが見つかりません: $LOCAL_DB_FILE"
  log_info "まず、ローカルD1を初期化してください: npm run db:init:local"
  exit 1
fi

if npx wrangler d1 export stats47 --local --output="$LOCAL_DUMP_FILE" 2>/dev/null; then
  log_info "エクスポートファイル: $LOCAL_DUMP_FILE"
else
  log_error "ローカルD1のエクスポートに失敗しました"
  exit 1
fi

# 3. ステージング環境へのマイグレーション適用（念のため）
log_info "ステージング環境のマイグレーションを確認中..."
if npx wrangler d1 migrations apply stats47_staging --env staging --remote 2>/dev/null; then
  log_info "マイグレーションの適用が完了しました"
else
  log_warn "マイグレーションの適用に問題がありましたが、続行します"
fi

# 4. ステージング環境へのインポート
log_info "ステージング環境にローカルD1のデータをインポート中..."

# 注意: wrangler d1 execute は複数のSQL文を含むファイルを処理できるが、
# エラーが発生した場合の処理を考慮する必要がある
if npx wrangler d1 execute stats47_staging --env staging --remote --file="$LOCAL_DUMP_FILE" 2>/dev/null; then
  log_info "データのインポートが完了しました"
else
  log_error "ステージング環境へのインポートに失敗しました"
  log_info "バックアップからリストアする場合: npx wrangler d1 execute stats47_staging --env staging --remote --file=$BACKUP_FILE"
  exit 1
fi

# 5. 同期結果の確認
log_info "同期結果を確認中..."
if npx wrangler d1 execute stats47_staging --env staging --remote --command "
  SELECT 
    'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'categories', COUNT(*) FROM categories
  UNION ALL
  SELECT 'ranking_groups', COUNT(*) FROM ranking_groups
  UNION ALL
  SELECT 'estat_metainfo', COUNT(*) FROM estat_metainfo
  UNION ALL
  SELECT 'articles', COUNT(*) FROM articles
" 2>/dev/null; then
  log_info "データ確認が完了しました"
else
  log_warn "データ確認に失敗しましたが、同期は完了しています"
fi

log_info "同期が完了しました！"
log_info "バックアップファイル: $BACKUP_FILE"
log_info "エクスポートファイル: $LOCAL_DUMP_FILE"
log_info ""
log_info "次のステップ:"
log_info "  1. ステージング環境で動作確認: https://staging.stats47.pages.dev"
log_info "  2. 問題がある場合はバックアップからリストア可能"

