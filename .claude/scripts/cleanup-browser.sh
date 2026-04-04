#!/bin/bash
# browser-use で起動した Chrome/Python のゾンビプロセスを一括終了する
# 使い方: bash .claude/scripts/cleanup-browser.sh [--force]

export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"

# 1. browser-use の正規 close を試行
browser-use --headed --profile 'Profile 5' close 2>/dev/null

# 2. 残プロセス数を確認
CHROME_COUNT=$(ps aux | grep -c '[b]rowser-use-user-data-dir')
DAEMON_COUNT=$(ps aux | grep -c '[b]rowser_use\.skill_cli\.daemon')
BROWSERUSE_COUNT=$(ps aux | grep -c '[b]rowser-use')

TOTAL=$((CHROME_COUNT + DAEMON_COUNT + BROWSERUSE_COUNT))
if [ "$TOTAL" -eq 0 ]; then
  echo "No browser-use processes found."
  exit 0
fi

echo "Found: Chrome=$CHROME_COUNT, Python daemon=$DAEMON_COUNT, browser-use CLI=$BROWSERUSE_COUNT"

# 3. プロセスを終了（Python daemon + Chrome + browser-use CLI）
if [ "$1" = "--force" ]; then
  pkill -9 -f "browser_use\.skill_cli\.daemon" 2>/dev/null
  pkill -9 -f "browser_use" 2>/dev/null
  pkill -9 -f "browser-use-user-data-dir" 2>/dev/null
  pkill -9 -f "browser-use" 2>/dev/null
else
  pkill -f "browser_use\.skill_cli\.daemon" 2>/dev/null
  pkill -f "browser_use" 2>/dev/null
  pkill -f "browser-use-user-data-dir" 2>/dev/null
  pkill -f "browser-use" 2>/dev/null
  sleep 2
  # SIGTERM で死ななかったら SIGKILL
  REMAINING=$(ps aux | grep -E '[b]rowser.use' | grep -v grep | wc -l)
  if [ "$REMAINING" -gt 0 ]; then
    ps aux | grep -E '[b]rowser.use' | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
  fi
fi

# 4. 一時 user-data-dir を削除
rm -rf "$TMPDIR"/browser-use-user-data-dir-* 2>/dev/null

sleep 1
AFTER_CHROME=$(ps aux | grep -c '[b]rowser-use-user-data-dir')
AFTER_DAEMON=$(ps aux | grep -c '[b]rowser_use\.skill_cli\.daemon')
echo "After cleanup: Chrome=$AFTER_CHROME, Python daemon=$AFTER_DAEMON"
