#!/bin/bash
# launchd から呼ばれるラッパーの共通 env/helper。
# 各スクリプト冒頭で `source "$(dirname "$0")/_common.sh"` する。

set -euo pipefail

export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG="ja_JP.UTF-8"
export LC_ALL="ja_JP.UTF-8"

PROJECT_DIR="/Users/minamidaisuke/stats47"
LOG_DIR="$HOME/Library/Logs/stats47"
mkdir -p "$LOG_DIR"

log_run() {
  local name="$1"
  shift
  local log_file="$LOG_DIR/${name}.log"
  {
    echo ""
    echo "=== $(date -Iseconds) [${name}] start ==="
  } >> "$log_file"
  cd "$PROJECT_DIR"
  if "$@" >> "$log_file" 2>&1; then
    echo "=== $(date -Iseconds) [${name}] ok ===" >> "$log_file"
  else
    local rc=$?
    echo "=== $(date -Iseconds) [${name}] FAILED rc=${rc} ===" >> "$log_file"
    return $rc
  fi
}
