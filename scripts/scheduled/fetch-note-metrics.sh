#!/bin/bash
# launchd から毎週月曜 09:00 JST に呼ばれるラッパー
# 実体は .claude/scripts/note/fetch-note-metrics.sh（browser-use で note dashboard を取得）
#
# 実行ログ: ~/Library/Logs/stats47/fetch-note-metrics.log
# stdout/stderr: .launchd.out / .launchd.err

source "$(dirname "$0")/_common.sh"

log_run fetch-note-metrics \
  bash "$PROJECT_DIR/.claude/scripts/note/fetch-note-metrics.sh"
