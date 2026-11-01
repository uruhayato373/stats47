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

# 専用 clone で作った記録のコミットを develop へ push する (cwd は clone)。
# - 取得・監査は記録として git add しない追跡ファイル (A8・楽天の成果は CI が保管庫から develop へ戻す) と未追跡のファイルも書く。
#   残ったままだと `pull --rebase` が拒否するので、コミットしていない変更は捨てる (2026-10-22・10-31 に記録が 2 回消えた)
# - clone の remote は HTTPS。キーチェーンの古いトークンでは push できなかったので、gh のトークンで認証する (2026-10-31)
# - push できなければ、次の段の `reset --hard` で消えないよう、コミットを clone のブランチ unpushed/<日付>-<名前> に残す
push_clone_records() { # label
  local label="$1" attempt
  git reset --quiet --hard HEAD
  git clean --quiet -fd
  for attempt in 1 2 3; do
    if git pull --quiet --rebase origin develop &&
      git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push --quiet origin HEAD:develop; then
      return 0
    fi
    git rebase --abort 2>/dev/null || true
    sleep 5
  done
  local keep
  keep="unpushed/$(TZ=Asia/Tokyo date +%F)-$label"
  git branch -f "$keep" HEAD
  echo "push できなかった。記録のコミットを clone のブランチ $keep に残した ($(git rev-parse --short HEAD))" >&2
  return 1
}
