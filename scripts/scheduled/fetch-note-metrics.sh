#!/bin/bash
# launchd から毎週土曜 08:00 JST に呼ばれるラッパー (2026-10-26 に月曜 09:15 から移動)
# 実体は .claude/scripts/note/fetch-note-metrics.sh（browser-use で note dashboard を取得）
#
# 実行ログ: ~/Library/Logs/stats47/fetch-note-metrics.log
# stdout/stderr: .launchd.out / .launchd.err

source "$(dirname "$0")/_common.sh"

# 表紙×閲覧数の結合は、表紙監査と閲覧数の取得の両方が 1 日以内でないと結合しない
# (.claude/scripts/note/lib/dashboard-metrics.mjs)。取得の直前に表紙監査を毎回作り直す。
# 監査は公開 API の GET だけ。終了 1 (未設定の表紙あり) でも監査は完了しているので、
# どの終了コードでも取得へ進む (失敗時は結合側が理由付きで incomplete にする)。
log_run note-cover-audit \
  node "$PROJECT_DIR/.claude/scripts/note/audit-note-covers.mjs" || true

log_run fetch-note-metrics \
  bash "$PROJECT_DIR/.claude/scripts/note/fetch-note-metrics.sh"
