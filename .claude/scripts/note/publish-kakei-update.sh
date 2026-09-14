#!/usr/bin/env bash
# 公開済み a-kakei 記事 1 本の本文 + 画像を draft.md で差し替えて「更新する」まで通す。
#   * 対象は note_url を持つ公開済み記事のみ (新規作成はしない)。
#   * 本文は build-body.cjs、画像は prepare-article.cjs の imgRefs (afterText anchor) で
#     draft の位置どおりに挿す。ハッシュタグは publish guard が hashtags.txt から 95〜99 件で確定する。
#   * 「次に読む」フッタは本文差し替えで消えるため、成功後に update-published-navigation.mjs で再付与する。
#   * 更新後は audit-note-figure-split.mjs と audit-kakei-note-content.mjs --live を必ず実測する。
# 使い方: publish-kakei-update.sh <slug>         (Profile 5 の Chrome をローカルで操作)
set -uo pipefail
ROOT=/Users/minamidaisuke/stats47
SLUG="${1:?Usage: publish-kakei-update.sh <slug>}"
ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
source "$ROOT/.claude/scripts/note/note-publish-lib.sh"
source "$ROOT/.claude/scripts/note/editor-helpers.sh" >/dev/null 2>&1

[ -f "$ADIR/draft.md" ] || { echo "FAIL $SLUG draft.md not found (restore-from-r2.sh first)"; exit 2; }
NOTE_URL=$(sed -n 's/^note_url: *"\(.*\)"/\1/p' "$ADIR/draft.md" | head -1)
[ -n "$NOTE_URL" ] || { echo "FAIL $SLUG has no note_url (not published)"; exit 2; }
KEY=$(basename "$NOTE_URL")
grep -q '^is_paid: *true' "$ADIR/draft.md" && { echo "FAIL $SLUG is paid; update mode is free-only"; exit 2; }

LOCK_DIR="${TMPDIR:-/tmp}/stats47-note-profile5.lock"
if [ "${NOTE_PROFILE_LOCK_HELD:-0}" != "1" ]; then
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  holder=""
  [ -f "$LOCK_DIR/pid" ] && holder=$(sed -n '1p' "$LOCK_DIR/pid")
  if [[ "$holder" =~ ^[0-9]+$ ]] && kill -0 "$holder" 2>/dev/null; then
    echo "FAIL Profile 5 is already in use (pid=$holder)"; exit 75
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
  [ "${NOTE_PROFILE_LOCK_HELD:-0}" = "1" ] || rm -rf -- "$LOCK_DIR"
}
[ "${NOTE_PROFILE_LOCK_HELD:-0}" = "1" ] || trap cleanup EXIT INT TERM

TITLE=$(sed -n 's/^title: *"\(.*\)"/\1/p' "$ADIR/draft.md" | head -1)
[ -n "$TITLE" ] || { echo "FAIL $SLUG no title"; exit 1; }

# ---- ローカル前提の確定 (本文 / 画像 / 期待する figure 数) ----
node "$ROOT/.claude/scripts/note/prepare-article.cjs" "$SLUG" >/dev/null || { echo "FAIL $SLUG prepare"; exit 1; }
node "$ROOT/.claude/scripts/note/build-body.cjs" "$SLUG" >/dev/null || { echo "FAIL $SLUG body"; exit 1; }
J="/tmp/note-data-$SLUG.json"
EXPECT_EMBEDS=$(node -e "const j=require('$J');process.stdout.write(String((j.urlCount||0)+(j.imgRefs||[]).length))")
NIMG=$(jq -r '.imgRefs | length' "$J")
for i in $(seq 0 $((NIMG-1))); do
  F=$(jq -r ".imgRefs[$i].file" "$J" | sed 's/\.svg$/.png/')
  [ -f "$ADIR/images/$F" ] || { echo "FAIL $SLUG image missing: images/$F (regenerate-svg-png.sh)"; exit 1; }
done
echo "[prep] $SLUG key=$KEY images=$NIMG expect_embeds=$EXPECT_EMBEDS"

# ---- アカウント照合 ----
NBU open "https://note.com/api/v2/current_user" >/dev/null 2>&1; sleep 4
ACC=$(NBU eval "(()=>{try{return JSON.parse(document.body.innerText).data.urlname}catch(e){return 'unknown'}})()" 2>&1 | sed -n 's/^result: //p' | head -1)
[ "$ACC" = "stats47" ] || { echo "FAIL account gate: got '$ACC' (expected stats47)"; exit 1; }
echo "  account gate ok: $ACC"

# ---- 編集画面: 既存本文を消して差し替え ----
np_ensure "https://editor.note.com/notes/$KEY/edit" || { echo "FAIL $SLUG cannot open editor"; exit 1; }
sleep 3
NBU state 2>&1 > /tmp/ns.txt
if ! grep -qE "contenteditable=true role=textbox" /tmp/ns.txt; then
  # 公開済み記事は draft_reedit=true でないと編集画面が開かない場合がある (fix-note-figure-split.sh と同じ経路)
  NBU open "https://editor.note.com/notes/$KEY/edit?draft_reedit=true" >/dev/null 2>&1; sleep 7
  NBU state 2>&1 > /tmp/ns.txt
  grep -qE "contenteditable=true role=textbox" /tmp/ns.txt || { echo "FAIL $SLUG editor not loaded"; exit 1; }
fi
BEFORE=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  existing body chars=${BEFORE:-0}"
NBU eval "(function(){const e=document.querySelector('[contenteditable=true]');if(!e)return 'no-editor';const figs=[...e.querySelectorAll('figure[embedded-service=attachment]')];for(const target of figs){const r=document.createRange();r.selectNode(target);const s=window.getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('delete');}if(figs.length)e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'deleteContent'}));return 'attachments-removed:'+figs.length;})();" >/dev/null 2>&1
# 全消去は eval だけでは効かない (2026-09-15 実測: 1,665 字残存)。本文を実クリックしてフォーカスし、
# Range で全選択したうえで実キー (Backspace) を送る。残っていれば Meta+a → Backspace で再試行。
NBU state 2>&1 > /tmp/ns.txt
ED0=$(grep -oE "\[[0-9]+\]<div contenteditable=true role=textbox" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
[ -n "$ED0" ] && NBU click "$ED0" >/dev/null 2>&1; sleep 0.5
clear_body(){
  NBU eval "(function(){const e=document.querySelector('[contenteditable=true]');e.focus();const r=document.createRange();r.selectNodeContents(e);const s=window.getSelection();s.removeAllRanges();s.addRange(r);return 'selected';})();" >/dev/null 2>&1
  NBU keys Backspace >/dev/null 2>&1; sleep 1
  NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.trim().length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1
}
AFTER=$(clear_body)
if [ "${AFTER:-1}" -gt 5 ]; then
  NBU keys "Meta+a" >/dev/null 2>&1; sleep 0.3; NBU keys Backspace >/dev/null 2>&1; sleep 1
  AFTER=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.trim().length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
fi
if [ "${AFTER:-1}" -gt 5 ]; then
  NBU eval "(function(){const e=document.querySelector('[contenteditable=true]');e.focus();const r=document.createRange();r.selectNodeContents(e);const s=window.getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('delete');return 'd';})();" >/dev/null 2>&1; sleep 1
  AFTER=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.trim().length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
fi
[ "${AFTER:-1}" -le 5 ] || { echo "FAIL $SLUG body not cleared (${AFTER} chars remain)"; NBU screenshot /tmp/note-update-$SLUG-clear.png >/dev/null 2>&1; exit 1; }
echo "  body cleared (remain ${AFTER:-0})"
TITLE_NOW=$(NBU eval "(()=>{const t=document.querySelector('textarea[placeholder=\"記事タイトル\"]');return t?t.value:''})()" 2>&1 | sed -n 's/^result: //p' | head -1)
[ "$TITLE_NOW" = "$TITLE" ] || echo "  [WARN] editor title differs from draft: '$TITLE_NOW'"

# ---- 本文 paste (チャンク分割。実フォーカスは click で) ----
BODY="/tmp/note-body-$SLUG.txt"
NBU state 2>&1 > /tmp/ns.txt
ED=$(grep -oE "\[[0-9]+\]<div contenteditable=true role=textbox" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
[ -n "$ED" ] && NBU click "$ED" >/dev/null 2>&1
NBU eval "window.__nb='';'init'" >/dev/null 2>&1
BODYLEN=$(node -e "process.stdout.write(String([...require('fs').readFileSync('$BODY','utf8')].length))")
OFFSET=0
while [ "$OFFSET" -lt "$BODYLEN" ]; do
  CHUNK=$(node -e "const b=[...require('fs').readFileSync('$BODY','utf8')]; process.stdout.write(encodeURIComponent(b.slice($OFFSET,$OFFSET+400).join('')).replace(/'/g,'%27'))")
  NBU eval "window.__nb+=decodeURIComponent('$CHUNK');String(window.__nb.length)" >/dev/null 2>&1
  OFFSET=$((OFFSET + 400))
done
PN=$(NBU eval "const editor=document.querySelector('[contenteditable=true]');editor.focus();const dt=new DataTransfer();dt.setData('text/plain',window.__nb);editor.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));const n=window.__nb.length;delete window.__nb;'pasted '+n;" 2>&1 | grep -oiE "pasted [0-9]+")
echo "  $PN (local $BODYLEN chars)"
[ -n "$PN" ] || { echo "FAIL $SLUG paste"; exit 1; }
sleep 4

# ---- URL カード (本文中の単独 URL 行) ----
jq -r '.segments[] | select(.type=="url") | .content' "$J" > /tmp/urls-$SLUG.txt
while IFS= read -r url; do
  [ -z "$url" ] && continue
  EU=$(printf '%s' "$url" | sed "s/'/%27/g")
  NBU eval "(function(){const target=decodeURIComponent('$EU');const e=document.querySelector('[contenteditable=true]');if(!e)return 'x';let n=null;const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode())){if(t.textContent&&t.textContent.trim()===target){n=t;break;}}if(!n)return 'nf';const r=document.createRange();r.selectNodeContents(n);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);(n.parentElement||e).scrollIntoView({block:'center'});e.focus();return 'ok';})();" >/dev/null 2>&1
  NBU keys Enter >/dev/null 2>&1; sleep 4
done < /tmp/urls-$SLUG.txt

# ---- 目次を折りたたむ (ins_img の同名衝突防止) ----
NBU state 2>&1 > /tmp/ns.txt
TOC=$(grep -oE '\[[0-9]+\]<button aria-label=目次 expanded=true' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -n "$TOC" ] && { NBU click "$TOC" >/dev/null 2>&1; sleep 1; }

# ---- 画像を draft の位置 (直前の段落 / 見出し) に挿す ----
for i in $(seq 0 $((NIMG-1))); do
  F=$(jq -r ".imgRefs[$i].file" "$J" | sed 's/\.svg$/.png/')
  ANCHOR=$(jq -r ".imgRefs[$i].afterText // .imgRefs[$i].afterHeading" "$J")
  ins_img "$ANCHOR" "$ADIR/images/$F" || { echo "FAIL $SLUG image insert: $F"; exit 1; }
done

# ---- エディタ上の実測 (空・欠けを止める) ----
LEN=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
EMB=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.querySelectorAll('figure').length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  editor body chars=${LEN:-0} figures=${EMB:-0} (expect $EXPECT_EMBEDS)"
[ "${LEN:-0}" -lt 1500 ] && { echo "FAIL $SLUG body too short in editor ($LEN)"; exit 1; }
[ "${EMB:-0}" -ne "$EXPECT_EMBEDS" ] && { echo "FAIL $SLUG embeds ${EMB:-0} != expected $EXPECT_EMBEDS"; exit 1; }

# ---- 公開設定 → 更新する (2 段) ----
np_ensure "https://editor.note.com/notes/$KEY/publish/" || { echo "FAIL $SLUG publish page"; exit 1; }
np_install_publish_guard "$ADIR/hashtags.txt" 1500 || { echo "FAIL $SLUG publish guard install"; exit 1; }
CLICKED=$(NBU eval "(function(){function deep(r,a){r.querySelectorAll('*').forEach(function(e){if(e.tagName==='BUTTON')a.push(e);if(e.shadowRoot)deep(e.shadowRoot,a);});return a;}var b=deep(document,[]).find(function(x){return (x.textContent||'').trim()==='更新する';});if(b){b.click();return 'clicked';}return 'nf';})();" 2>&1)
echo "$CLICKED" | grep -q "clicked" || { echo "FAIL $SLUG 更新する button not found"; exit 1; }
sleep 9
OK=$(NBU eval "String(document.body.innerText.indexOf('記事が公開されました')>=0)" 2>&1 | sed -n 's/^result: //p' | head -1)
if [ "$OK" != "true" ]; then sleep 6; OK=$(NBU eval "String(document.body.innerText.indexOf('記事が公開されました')>=0)" 2>&1 | sed -n 's/^result: //p' | head -1); fi
np_verify_publish_guard || { echo "FAIL $SLUG publish guard verification (PUT status/tags)"; exit 1; }
[ "$OK" = "true" ] || echo "  [WARN] 公開モーダル未検出 (PUT は 200)。ライブ確認で判定する"
np_close_modal

# ---- ライブ実在確認 + 記録 ----
sleep 3
V=$(np_verify "$NOTE_URL" "$TITLE")
[ "$V" = "ok" ] || { echo "FAIL $SLUG verify: $V"; exit 1; }
python3 - "$ADIR/draft.md" <<'PY'
import sys,re,datetime
p=sys.argv[1]; s=open(p,encoding="utf-8").read(); today=datetime.date.today().isoformat()
if re.search(r'^updated_at:',s,re.M): s=re.sub(r'^updated_at:.*$','updated_at: "%s"'%today,s,count=1,flags=re.M)
else: s=re.sub(r'^(published_at:.*)$',r'\1\nupdated_at: "%s"'%today,s,count=1,flags=re.M)
open(p,"w",encoding="utf-8").write(s)
PY
echo "  UPDATED $NOTE_URL"
echo "OK $SLUG $NOTE_URL"
