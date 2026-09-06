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

# 3. プロセスを終了（Python daemon + browser-use専用Chromeだけ）
# macOS の pkill -f は長いChromeコマンドを取りこぼすため、ps でPIDを確定する。
# 広い "browser-use" match は通常Chromeや呼び出し元まで巻き込むので使わない。
if [ "$1" = "--force" ]; then
  ps -Axo pid,command | grep '[G]oogle Chrome' | grep '[b]rowser-use-user-data-dir' | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null
  ps -Axo pid,command | grep '[P]ython' | grep '[b]rowser_use\.skill_cli\.daemon' | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null
else
  ps -Axo pid,command | grep '[G]oogle Chrome' | grep '[b]rowser-use-user-data-dir' | awk '{print $1}' | xargs -n1 kill -TERM 2>/dev/null
  ps -Axo pid,command | grep '[P]ython' | grep '[b]rowser_use\.skill_cli\.daemon' | awk '{print $1}' | xargs -n1 kill -TERM 2>/dev/null
  sleep 2
  # SIGTERM で死ななかったら SIGKILL
  ps -Axo pid,command | grep '[G]oogle Chrome' | grep '[b]rowser-use-user-data-dir' | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null
  ps -Axo pid,command | grep '[P]ython' | grep '[b]rowser_use\.skill_cli\.daemon' | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null
fi

# 4. 一時 user-data-dir を削除
find "${TMPDIR:-/tmp}" -maxdepth 1 -type d -name 'browser-use-user-data-dir-*' -exec rm -rf -- {} + 2>/dev/null
find "$HOME/.browser-use" -maxdepth 1 \( -name 'default.pid' -o -name 'default.sock' \) -delete 2>/dev/null

sleep 1
AFTER_CHROME=$(ps aux | grep -c '[b]rowser-use-user-data-dir')
AFTER_DAEMON=$(ps aux | grep -c '[b]rowser_use\.skill_cli\.daemon')
echo "After cleanup: Chrome=$AFTER_CHROME, Python daemon=$AFTER_DAEMON"
