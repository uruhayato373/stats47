#!/usr/bin/env bash
# 家計シリーズを 1 ブラウザセッションで通して公開する。
#  * Profile 5 のロックとブラウザは driver が保持し、記事ごとに再起動しない
#    (記事ごとの daemon kill が about:blank 失敗の原因だった)
#  * 各記事で「同タイトルの下書きが note.com にあるか」を必ず先に見る → あれば再利用 (二重投稿しない)
#  * 記事間に 20-40 秒の待機 (spam 検知回避)
set -uo pipefail
ROOT=/Users/minamidaisuke/stats47
LOG="$ROOT/.local/kakei-publish-log.tsv"
mkdir -p "$(dirname "$LOG")"; touch "$LOG"
source "$ROOT/.claude/scripts/note/note-publish-lib.sh"

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
  NBU close >/dev/null 2>&1 || true
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

# アカウント確認 (別アカウントへの投稿を構造的に防ぐ)
NBU open "https://note.com/api/v2/current_user" >/dev/null 2>&1; sleep 4
ACC=$(NBU eval "(()=>{try{return JSON.parse(document.body.innerText).data.urlname}catch(e){return 'unknown'}})()" 2>&1 | sed -n 's/^result: //p' | head -1)
[ "$ACC" = "stats47" ] || { echo "FAIL account gate: got '$ACC' (expected stats47)"; exit 1; }
echo "account gate ok: $ACC"

# note.com の下書き一覧から同タイトルの下書き key を探す (無ければ空)
find_draft_key(){ # $1=title
  local title="$1" st=/tmp/np-drafts.txt idx probe
  np_ensure "https://note.com/notes?status=draft" >/dev/null || return 1
  sleep 3
  NBU state 2>&1 > "$st"
  idx=$(awk -v t="$title" 'index($0,t)>0 && /<button aria-label=/ {match($0,/\[[0-9]+\]/); print substr($0,RSTART+1,RLENGTH-2); exit}' "$st")
  if [ -z "$idx" ]; then
    probe=$(printf '%s' "$title" | cut -c1-40)
    idx=$(awk -v t="$probe" 'index($0,t)>0 && /<button aria-label=/ {match($0,/\[[0-9]+\]/); print substr($0,RSTART+1,RLENGTH-2); exit}' "$st")
  fi
  [ -z "$idx" ] && return 1
  NBU click "$idx" >/dev/null 2>&1; sleep 7
  np_href | grep -oE 'n[0-9a-f]{8,}' | head -1
}

FIRST=1
for SLUG in "$@"; do
  ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
  if grep -q '^note_url:' "$ADIR/draft.md" 2>/dev/null; then echo "== $SLUG already published"; continue; fi
  if [ "$FIRST" -eq 0 ]; then W=$((20 + RANDOM % 21)); echo "-- wait ${W}s"; sleep "$W"; fi
  FIRST=0
  echo "================ $SLUG  $(date +%H:%M:%S)"
  TITLE=$(python3 -c "
import re
s=open('$ADIR/draft.md',encoding='utf-8').read()
m=re.search(r'^title:\s*\"(.+?)\"\s*\$',s,re.M)
print(m.group(1) if m else '')
")
  if [ -z "$TITLE" ]; then
    printf '%s\tFAIL\tno title\n' "$SLUG" >> "$LOG"; echo "FAIL $SLUG no title"; continue
  fi
  KEY=$(find_draft_key "$TITLE") || KEY=""
  if [ -n "$KEY" ]; then echo "  existing draft found: $KEY (reuse)"; else echo "  no existing draft — create fresh"; fi
  OUT=$(bash "$ROOT/.claude/scripts/note/publish-kakei-one.sh" "$SLUG" stats47-note "$KEY" 2>&1)
  RC=$?
  echo "$OUT" | tail -14
  URL=$(echo "$OUT" | grep -oE 'https://note\.com/stats47/n/n[0-9a-f]+' | tail -1)
  if [ "$RC" -eq 0 ] && [ -n "$URL" ]; then
    printf '%s\tOK\t%s\n' "$SLUG" "$URL" >> "$LOG"
  else
    printf '%s\tFAIL(rc=%s)\t%s\n' "$SLUG" "$RC" "$(echo "$OUT" | grep -E '^FAIL' | head -1)" >> "$LOG"
  fi
done
echo "=== driver done ==="
