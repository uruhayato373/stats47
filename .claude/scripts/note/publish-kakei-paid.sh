#!/usr/bin/env bash
# 有料記事 d-kakei-category-dataset を公開する。
#  * 本文作成 → data/ の添付3ファイル → 有料設定(価格/有料ライン) → タグ99 → 公開 → 実在確認
#  * 価格・有料境界・添付は screenshot と API で二重確認してから frontmatter を書き戻す。
set -uo pipefail
ROOT=/Users/minamidaisuke/stats47
SLUG="${1:-d-kakei-category-dataset}"
VERT=stats47-note
ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
STOP_BEFORE_COMMIT="${STOP_BEFORE_COMMIT:-0}"
source "$ROOT/.claude/scripts/note/note-publish-lib.sh"
BU(){ NBU "$@"; }
source "$ROOT/.claude/scripts/note/editor-helpers.sh" >/dev/null 2>&1

LOCK_DIR="${TMPDIR:-/tmp}/stats47-note-profile5.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  holder=""; [ -f "$LOCK_DIR/pid" ] && holder=$(sed -n '1p' "$LOCK_DIR/pid")
  if [[ "$holder" =~ ^[0-9]+$ ]] && kill -0 "$holder" 2>/dev/null; then
    echo "FAIL Profile 5 in use (pid=$holder)"; exit 75
  fi
  rm -rf -- "$LOCK_DIR"; mkdir "$LOCK_DIR" || { echo "FAIL lock"; exit 75; }
fi
printf '%s\n' "$$" > "$LOCK_DIR/pid"
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

grep -q '^note_url:' "$ADIR/draft.md" && { echo "SKIP $SLUG already published"; exit 0; }

NBU open "https://note.com/api/v2/current_user" >/dev/null 2>&1; sleep 4
ACC=$(NBU eval "(()=>{try{return JSON.parse(document.body.innerText).data.urlname}catch(e){return 'unknown'}})()" 2>&1 | sed -n 's/^result: //p' | head -1)
[ "$ACC" = "stats47" ] || { echo "FAIL account gate: '$ACC'"; exit 1; }
echo "account gate ok: $ACC"

node "$ROOT/.claude/scripts/note/prepare-article.cjs" "$SLUG" >/dev/null || { echo "FAIL prepare"; exit 1; }
node "$ROOT/.claude/scripts/note/build-body.cjs" "$SLUG" >/dev/null || { echo "FAIL body"; exit 1; }
J="/tmp/note-data-$SLUG.json"
TITLE=$(node -e "process.stdout.write(require('$J').title)")
PRICE=$(node -e "process.stdout.write(String(require('$J').priceJpy))")
PAID_HEAD=$(node -e "const j=require('$J');process.stdout.write(String(j.paidHead||'').split('\n')[0].replace(/^#+\s*/,''))")
EXPECT_EMBEDS=$(node -e "const j=require('$J');process.stdout.write(String((j.urlCount||0)+(j.imgRefs||[]).length))")
echo "title=$TITLE"; echo "price=$PRICE  paidHead=$PAID_HEAD  expectEmbeds=$EXPECT_EMBEDS"
[ "$PRICE" = "2980" ] || { echo "FAIL price is not 2980: $PRICE"; exit 1; }

# 既存下書きがあれば再利用 (二重作成しない)
np_ensure "https://note.com/notes?status=draft" >/dev/null || true
sleep 3
NBU state 2>&1 > /tmp/np-drafts-paid.txt
IDX=$(awk -v t="$(printf '%s' "$TITLE" | cut -c1-40)" 'index($0,t)>0 && /<button aria-label=/ {match($0,/\[[0-9]+\]/); print substr($0,RSTART+1,RLENGTH-2); exit}' /tmp/np-drafts-paid.txt)
KEY=""
if [ -n "$IDX" ]; then
  NBU click "$IDX" >/dev/null 2>&1; sleep 7
  KEY=$(np_href | grep -oE 'n[0-9a-f]{8,}' | head -1)
fi
if [ -n "$KEY" ]; then
  echo "reuse existing draft $KEY"
else
  echo "[content] creating fresh"
  NOTE_PROFILE_LOCK_HELD=1 bash "$ROOT/.claude/scripts/note/publish-new-note.sh" "$SLUG" "$VERT" 2>&1 | sed 's/^/    /'
  for _t in 1 2 3; do KEY=$(np_href | grep -oE 'n[0-9a-f]{8,}' | head -1); [ -n "$KEY" ] && break; sleep 5; done
  [ -z "$KEY" ] && { echo "FAIL no note key (href=$(np_href))"; exit 1; }
fi
echo "key=$KEY"
np_ensure "https://editor.note.com/notes/$KEY/edit" || { echo "FAIL open editor"; exit 1; }
sleep 3

LEN=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "body chars=$LEN"
[ "${LEN:-0}" -lt 800 ] && { echo "FAIL body too short ($LEN)"; exit 1; }

# 添付3ファイル。**本文にファイル名が書いてあるので innerText では判定できない**。
# 実際の添付は figure 要素 (ファイル名 + サイズ表記) になるので、そこだけを数える。
count_attachments(){
  NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');if(!e)return '0';const want=['kakei-category-ratio-47.csv','kakei-category-ratio-47.json','kakei-category-timeseries.csv'];const figs=[...e.querySelectorAll('figure')].map(f=>(f.textContent||''));return String(want.filter(w=>figs.some(t=>t.includes(w)&&/(KB|MB|バイト)/.test(t))).length)})()" 2>&1 | sed -n 's/^result: //p' | head -1
}
attach_one(){ # $1=絶対パス
  local FILE="$1" NAME MENU FB UP
  NAME=$(basename "$FILE")
  [ -f "$FILE" ] || { echo "  missing file: $FILE"; return 1; }
  # 添付リスト直後の空段落へキャレットを置く (見出しの中に入れると見出しが割れる)
  local POS
  POS=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');const kids=[...e.children];let i=-1;kids.forEach((c,k)=>{if(c.tagName==='FIGURE')i=k});if(i<0){i=kids.findIndex(c=>c.tagName==='UL'&&(c.textContent||'').includes('kakei-category-timeseries.csv'))}if(i<0)return 'anchor-not-found';let p=null;for(let k=i+1;k<kids.length;k++){const c=kids[k];if(c.tagName==='P'&&!(c.textContent||'').trim()){p=c;break}if(/^H[1-4]\$/.test(c.tagName))break}if(!p){const ref=kids[i];p=document.createElement('p');return 'no-empty-p'}const r=document.createRange();r.selectNodeContents(p);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r);p.scrollIntoView({block:'center'});e.focus();return 'caret-set'})()" 2>&1 | sed -n 's/^result: //p' | head -1)
  [ "$POS" = "caret-set" ] || { echo "  [FAIL] caret: $POS (見出しを割らないため中断)"; return 1; }
  sleep 1.5
  NBU state 2>&1 > /tmp/paid-attach.txt
  MENU=$(grep -oE '\[[0-9]+\]<button aria-label=メニューを開く' /tmp/paid-attach.txt | grep -oE '[0-9]+' | head -1)
  [ -n "$MENU" ] || { echo "  [FAIL] menu button not found"; return 1; }
  NBU click "$MENU" >/dev/null 2>&1; sleep 1.5
  NBU state 2>&1 > /tmp/paid-attach.txt
  FB=$(awk '/^\t*ファイル\s*\$/{print prev; exit} {prev=\$0}' /tmp/paid-attach.txt | grep -oE '[0-9]+' | head -1)
  [ -n "$FB" ] || { echo "  [FAIL] ファイル menu item not found"; return 1; }
  NBU click "$FB" >/dev/null 2>&1; sleep 1.5
  NBU state 2>&1 > /tmp/paid-attach.txt
  UP=$(grep -oE '\[[0-9]+\]<input type=file' /tmp/paid-attach.txt | grep -oE '[0-9]+' | head -1)
  [ -n "$UP" ] || { echo "  [FAIL] file input not found"; return 1; }
  NBU upload "$UP" "$FILE" >/dev/null 2>&1
  sleep 6
  echo "  attached $NAME"
}
for F in kakei-category-ratio-47.csv kakei-category-ratio-47.json kakei-category-timeseries.csv; do
  HAVE=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');if(!e)return 'false';return String([...e.querySelectorAll('figure')].some(f=>(f.textContent||'').includes('$F')))})()" 2>&1 | sed -n 's/^result: //p' | head -1)
  if [ "$HAVE" = "true" ]; then echo "  attach skip (already attached): $F"; continue; fi
  attach_one "$ADIR/data/$F" || { echo "FAIL attach $F"; exit 1; }
done
ATTACHED=$(count_attachments)
echo "attachments present: ${ATTACHED:-0}/3"
[ "${ATTACHED:-0}" -eq 3 ] || { echo "FAIL attachments ${ATTACHED:-0}/3"; exit 1; }

# 下書き保存
NBU state 2>&1 > /tmp/ns.txt
SAVE=$(awk '/下書き保存/{print prev; exit} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]<button' | grep -oE '[0-9]+' | head -1)
[ -n "$SAVE" ] && { NBU click "$SAVE" >/dev/null 2>&1; sleep 4; echo "draft saved"; }

echo "[publish-settings]"
np_ensure "https://editor.note.com/notes/$KEY/publish/" || { echo "FAIL publish page"; exit 1; }
sleep 2
NBU state 2>&1 > /tmp/ns.txt
PAID=$(awk '/^\t+有料$/{print prev; exit} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]' | tr -d '[]')
[ -n "$PAID" ] || { echo "FAIL 有料 radio not found"; exit 1; }
NBU click "$PAID" >/dev/null 2>&1; sleep 3
SET_PRICE=$(NBU eval "(function(){function find(root){if(!root)return null;const d=root.querySelector&&root.querySelector('input#price');if(d)return d;for(const el of (root.querySelectorAll?root.querySelectorAll('*'):[])){if(el.shadowRoot){const f=find(el.shadowRoot);if(f)return f;}}return null;}const i=find(document);if(!i)return 'not-found';const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'$PRICE');i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));i.dispatchEvent(new Event('blur',{bubbles:true}));return 'price:'+i.value;})();" 2>&1)
echo "$SET_PRICE" | grep -q "price:$PRICE" || { echo "FAIL price not set: $SET_PRICE"; exit 1; }
echo "  price set $PRICE"

for t in $(head -5 "$ADIR/hashtags.txt" 2>/dev/null); do np_add_tag "$t" >/dev/null 2>&1; done
echo "  tag chips=$(np_chip_count)"

paid_setline_from_settings "$PAID_HEAD" "/tmp/note-ready-$SLUG.png" || { echo "FAIL paid line"; exit 1; }
np_install_publish_guard "$ADIR/hashtags.txt" 300 || { echo "FAIL guard install"; exit 1; }
NBU screenshot "/tmp/note-paid-ready-$SLUG.png" >/dev/null 2>&1
echo "  ready screenshot: /tmp/note-paid-ready-$SLUG.png"
if [ "$STOP_BEFORE_COMMIT" = "1" ]; then echo "STOP before commit (STOP_BEFORE_COMMIT=1)"; exit 0; fi

echo "[commit]"
URL=$(np_commit "$KEY")
[ -z "$URL" ] && { echo "FAIL commit"; exit 1; }
np_verify_publish_guard || { echo "FAIL guard verify"; exit 1; }
np_close_modal
V=$(np_verify "$URL" "$TITLE"); [ "$V" = "ok" ] || { echo "FAIL verify: $V"; exit 1; }

NOTE_KEY="$KEY" EXPECTED_PRICE="$PRICE" node - <<'NODE'
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let n;
for(let i=1;i<=5;i++){const r=await fetch(`https://note.com/api/v3/notes/${process.env.NOTE_KEY}?ts=${Date.now()}`);if(r.ok)n=(await r.json()).data;if(n?.status==='published'&&(n?.hashtag_notes?.length||0)>=95)break;await sleep(i*800);}
const checks={account:n?.user?.urlname==='stats47',status:n?.status==='published',price:Number(n?.price||0)===Number(process.env.EXPECTED_PRICE),hashtags:(n?.hashtag_notes?.length||0)>=95};
console.log('  api:',JSON.stringify({price:n?.price,tags:n?.hashtag_notes?.length,status:n?.status}));
if(Object.values(checks).some(v=>!v)){console.error('FAIL api verification '+JSON.stringify(checks));process.exit(1)}
NODE
[ $? -eq 0 ] || { echo "FAIL api verification"; exit 1; }
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
