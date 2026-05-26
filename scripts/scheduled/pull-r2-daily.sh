#!/bin/bash
# 毎日 5:30 JST に R2 → .local/r2/ へ差分 pull する。
#
# 目的: 外付け SSD (.local/) が壊れた場合のデータ消失を防ぐため、
# R2 (Cloudflare、11 nines durability) を真実源として日次ミラー。
#
# 同期対象 (--prefix で明示):
#   - ranking    ランキングデータ
#   - area       地域プロフィール
#   - categories カテゴリメタデータ
#   - themes     テーマダッシュボード設定 (Phase 1A 以降)
#   - blog       ブログ記事・画像
#   - survey     調査メタ
#   - app        URL 対応の app/ 配下全体 (上記をカバー、念のため明示)
#
# 除外: raw/* (e-Stat 等のキャッシュ、サイズ大・regenerate 可)
#       gis/* (大容量、低頻度更新)
#       ges/* (動画、ローカル開発に不要)
#
# 失敗時: ~/Library/Logs/stats47/pull-r2-daily.log を確認
# 手動実行: bash /Users/minamidaisuke/stats47/scripts/scheduled/pull-r2-daily.sh
source "$(dirname "$0")/_common.sh"

log_run pull-r2-daily \
  npx tsx packages/r2-storage/src/scripts/sync-download.ts --prefix app
