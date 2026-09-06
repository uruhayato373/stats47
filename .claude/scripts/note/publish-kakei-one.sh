#!/usr/bin/env bash
# 1 記事を「本文作成 → 下書き → 公開設定 → 公開 → 実在確認 → frontmatter 書き戻し」まで通す。
# 既に note_url を持つ記事は何もしない (二重作成防止)。
set -uo pipefail
ROOT=/Users/minamidaisuke/stats47
SLUG="$1"; VERT="${2:-stats47-note}"; EXIST_KEY="${3:-}"
ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
source "$ROOT/.claude/scripts/note/note-publish-lib.sh"

LOCK_DIR="${TMPDIR:-/tmp}/stats47-note-profile5.lock"
if [ "${NOTE_PROFILE_LOCK_HELD:-0}" != "1" ]; then
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  holder=""
  [ -f "$LOCK_DIR/pid" ] && holder=$(sed -n '1p' "$LOCK_DIR/pid")
  if [[ "$holder" =~ ^[0-9]+$ ]] && kill -0 "$holder" 2>/dev/null; then
    echo "FAIL Profile 5 is already in use (pid=$holder)"
    exit 75
  fi
  rm -rf -- "$LOCK_DIR"
  mkdir "$LOCK_DIR" || { echo "FAIL cannot acquire Profile 5 lock"; exit 75; }
fi
printf '%s\n' "$$" > "$LOCK_DIR/pid"
fi
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
[ "${NOTE_PROFILE_LOCK_HELD:-0}" = "1" ] || trap cleanup EXIT INT TERM

grep -q '^note_url:' "$ADIR/draft.md" && { echo "SKIP $SLUG (already published)"; exit 0; }

TITLE=$(python3 -c "
import re,sys
s=open('$ADIR/draft.md',encoding='utf-8').read()
m=re.search(r'^title:\s*\"(.+?)\"\s*\$',s,re.M)
print(m.group(1) if m else '')
")
[ -z "$TITLE" ] && { echo "FAIL $SLUG no title"; exit 1; }

# 期待する埋め込み数 (URLカード + 画像) をローカル SSOT から先に確定する。
node "$ROOT/.claude/scripts/note/prepare-article.cjs" "$SLUG" >/dev/null || { echo "FAIL $SLUG prepare"; exit 1; }
EXPECT_EMBEDS=$(node -e "const j=require('/tmp/note-data-$SLUG.json');process.stdout.write(String((j.urlCount||0)+(j.imgRefs||[]).length))")

if [ -n "$EXIST_KEY" ]; then
  KEY="$EXIST_KEY"; echo "  reuse draft $KEY"
  np_ensure "https://editor.note.com/notes/$KEY/edit" || { echo "FAIL $SLUG cannot open reused draft"; exit 1; }
  sleep 3
else
  echo "[prep] $SLUG"
  node "$ROOT/.claude/scripts/note/build-body.cjs" "$SLUG" >/dev/null || { echo "FAIL $SLUG body"; exit 1; }
  echo "[content] $SLUG"
  NOTE_PROFILE_LOCK_HELD=1 bash "$ROOT/.claude/scripts/note/publish-new-note.sh" "$SLUG" "$VERT" 2>&1 | sed 's/^/    /'
  KEY=""
  for _try in 1 2 3; do
    KEY=$(np_href | grep -oE 'n[0-9a-f]{8,}' | head -1)
    [ -n "$KEY" ] && break
    echo "  [retry $_try] href=$(np_href)"; sleep 5
  done
  [ -z "$KEY" ] && { echo "FAIL $SLUG no note key (href=$(np_href))"; exit 1; }
  echo "  key=$KEY"
fi

# 本文と埋め込みが揃っているかをエディタ上で確認 (空/欠けた記事の公開を防ぐ)
LEN=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
EMB=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.querySelectorAll('figure').length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  body chars=${LEN:-0}  figures=${EMB:-0} (expect $EXPECT_EMBEDS)"
[ "${LEN:-0}" -lt 300 ] && { echo "FAIL $SLUG body too short in editor ($LEN)"; exit 1; }
[ "${EMB:-0}" -ne "$EXPECT_EMBEDS" ] && { echo "FAIL $SLUG embeds ${EMB:-0} != expected $EXPECT_EMBEDS"; exit 1; }

echo "[publish-settings] $SLUG"
np_ensure "https://editor.note.com/notes/$KEY/publish/" || { echo "FAIL $SLUG publish page"; exit 1; }
ADDED=0
# UIには代表5件だけを表示し、公開payloadは直後のguardで95〜99件へ確定する。
# 99件をUIから1件ずつ入れると記事ごとに数分かかり、SPA状態競合も増える。
for t in $(head -5 "$ADIR/hashtags.txt" 2>/dev/null); do
  np_add_tag "$t" && ADDED=$((ADDED+1))
done
echo "  tags chips=$(np_chip_count) (added $ADDED)"
np_install_publish_guard "$ADIR/hashtags.txt" 300 || { echo "FAIL $SLUG publish guard install"; exit 1; }

IS_PAID=$(python3 -c "
import re
s=open('$ADIR/draft.md',encoding='utf-8').read()
print('true' if re.search(r'^is_paid:\s*true',s,re.M) else 'false')
")
if [ "$IS_PAID" = "true" ]; then
  echo "  PAID article — 手動確認が必要。ここで停止"
  exit 9
fi

echo "[commit] $SLUG"
URL=$(np_commit "$KEY")
if [ -z "$URL" ]; then echo "FAIL $SLUG commit"; exit 1; fi
np_verify_publish_guard || { echo "FAIL $SLUG publish guard verification"; exit 1; }
np_close_modal
V=$(np_verify "$URL" "$TITLE")
[ "$V" = "ok" ] || { echo "FAIL $SLUG verify: $V"; exit 1; }
np_update_published_hashtags "$KEY" "$ADIR/hashtags.txt" 300 \
  || { echo "FAIL $SLUG published hashtag verification"; exit 1; }
echo "  LIVE $URL"

python3 - "$ADIR/draft.md" "$URL" <<'PY'
import sys,re,datetime
p,url=sys.argv[1],sys.argv[2]
s=open(p,encoding="utf-8").read()
today=datetime.date.today().isoformat()
s=re.sub(r'^status:\s*draft\s*$','status: published',s,count=1,flags=re.M)
s=re.sub(r'^published:\s*false\s*$','published: true',s,count=1,flags=re.M)
if 'note_url:' not in s:
    s=re.sub(r'^(status: published)$',r'\1\nnote_url: "'+url+'"\npublished_at: "'+today+'"',s,count=1,flags=re.M)
open(p,"w",encoding="utf-8").write(s)
print("  frontmatter updated")
PY
echo "OK $SLUG $URL"
