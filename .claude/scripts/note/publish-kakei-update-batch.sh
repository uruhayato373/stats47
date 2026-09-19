#!/usr/bin/env bash
# 公開済み a-kakei 記事を複数、逐次で本番更新する (publish-kakei-update.sh のバッチ版)。
#   * Profile 5 排他ロックは1回だけ取得し、記事間で使い回す (NOTE_PROFILE_LOCK_HELD=1)。
#   * 1本失敗しても継続し、最後に FAIL 一覧を出す (途中停止しない)。
#   * 記事間に 20-40 秒のランダム待機を入れる (SPA 状態の cool down)。
# 使い方: publish-kakei-update-batch.sh <slug1> [<slug2> ...]
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
LOG="$ROOT/.local/kakei-update-batch-log.tsv"
mkdir -p "$(dirname "$LOG")"; touch "$LOG"

LOCK_DIR="${TMPDIR:-/tmp}/stats47-note-profile5.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  holder=""; [ -f "$LOCK_DIR/pid" ] && holder=$(sed -n '1p' "$LOCK_DIR/pid")
  if [[ "$holder" =~ ^[0-9]+$ ]] && kill -0 "$holder" 2>/dev/null; then
    echo "FAIL Profile 5 is already in use (pid=$holder)"; exit 75
  fi
  rm -rf -- "$LOCK_DIR"; mkdir "$LOCK_DIR" || { echo "FAIL cannot acquire lock"; exit 75; }
fi
printf '%s\n' "$$" > "$LOCK_DIR/pid"
export NOTE_PROFILE_LOCK_HELD=1

cleanup(){
  trap - EXIT INT TERM
  browser-use --headed --profile "Profile 5" close >/dev/null 2>&1 || true
  pkill -TERM -f "browser_use.skill_cli.daemon" 2>/dev/null || true
  sleep 1
  pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null || true
  pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null || true
  ps -Axo pid,command | grep "browser-use-user-data-dir" | grep -v grep \
    | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null || true
  find "${TMPDIR:-/tmp}" -maxdepth 1 -type d -name 'browser-use-user-data-dir-*' \
    -exec rm -rf -- {} + 2>/dev/null || true
  osascript -e 'tell application "Google Chrome"
    repeat with w in windows
      repeat with t in tabs of w
        if URL of t contains "editor.note.com" then close t
      end repeat
    end repeat
  end tell' 2>/dev/null || true
  rm -rf -- "$LOCK_DIR"
}
trap cleanup EXIT INT TERM

FIRST=1
OK_COUNT=0; FAIL_COUNT=0
FAILED_SLUGS=()
for SLUG in "$@"; do
  if [ "$FIRST" -eq 0 ]; then
    W=$((20 + RANDOM % 21))
    echo "-- wait ${W}s"
    sleep "$W"
  fi
  FIRST=0
  echo "================ $SLUG  $(date +%H:%M:%S)"
  OUT=$(bash "$ROOT/.claude/scripts/note/publish-kakei-update.sh" "$SLUG" 2>&1)
  RC=$?
  echo "$OUT" | sed 's/^/  /'
  if [ "$RC" -eq 0 ] && echo "$OUT" | grep -q "^OK $SLUG"; then
    printf '%s\tOK\t%s\n' "$SLUG" "$(date -Iseconds)" >> "$LOG"
    OK_COUNT=$((OK_COUNT+1))
  else
    printf '%s\tFAIL\trc=%s\n' "$SLUG" "$RC" >> "$LOG"
    FAIL_COUNT=$((FAIL_COUNT+1))
    FAILED_SLUGS+=("$SLUG")
  fi
done

echo "=== batch done: OK=$OK_COUNT FAIL=$FAIL_COUNT ==="
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "FAILED: ${FAILED_SLUGS[*]}"
fi
