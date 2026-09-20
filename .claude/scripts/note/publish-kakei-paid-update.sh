#!/usr/bin/env bash
# 公開済み **有料** 記事 (d-kakei-category-dataset) の本文 + 画像 + 添付 3 ファイルを draft.md で差し替えて
# 「更新する」まで通す。publish-kakei-update.sh (無料専用) と publish-kakei-paid.sh (新規有料) の合成。
#   * 本文は draft_reedit=true で開いて全消去 → paste。画像は prepare-article.cjs の imgRefs で draft の位置へ。
#   * 旧添付 (figure[embedded-service=attachment]) は全消去の前に削除し、「## 添付ファイル」のリスト直後へ
#     ins_file (anchor 段落 → 次の <p> の直前) で再添付する。publish-kakei-paid.sh の attach_one は使わない
#     (「最後の figure」anchor は無料部分に画像 figure が入ると破綻し、DOM 生成 <p> へのキャレットは editor に無視される)。
#   * 有料ラインは paid_setline_from_settings で H1-H4 完全一致の見出し直前に置き直し、価格は変更しない (2980 を検証)。
#   * 公開後: API (price / status / hashtags) + 非ログイン HTML で有料本文が漏れていないこと + 所有者画面の添付 3 件。
#   * ★note の添付アップロードは **1 日 10 回まで** (`POST /api/v2/attachments/upload` → 500
#     `{"error":"1日にアップロードできるのは10回までです"}`、2026-09-20 実測。画像は別枠)。1 回の実行で 3 回消費するので
#     STOP_BEFORE_COMMIT の dry run を繰り返さない。中断すると添付 0 件の下書き (has_draft) が残るが、次の実行で全消去して組み直す。
# 使い方: publish-kakei-paid-update.sh [slug]   (STOP_BEFORE_COMMIT=1 で「更新する」直前に停止)
set -uo pipefail
ROOT=/Users/minamidaisuke/stats47
SLUG="${1:-d-kakei-category-dataset}"
ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
STOP_BEFORE_COMMIT="${STOP_BEFORE_COMMIT:-0}"
source "$ROOT/.claude/scripts/note/note-publish-lib.sh"
BU(){ NBU "$@"; }
source "$ROOT/.claude/scripts/note/editor-helpers.sh" >/dev/null 2>&1

[ -f "$ADIR/draft.md" ] || { echo "FAIL $SLUG draft.md not found"; exit 2; }
NOTE_URL=$(sed -n 's/^note_url: *"\(.*\)"/\1/p' "$ADIR/draft.md" | head -1)
[ -n "$NOTE_URL" ] || { echo "FAIL $SLUG has no note_url (not published)"; exit 2; }
KEY=$(basename "$NOTE_URL")
grep -q '^is_paid: *true' "$ADIR/draft.md" || { echo "FAIL $SLUG is not paid; use publish-kakei-update.sh"; exit 2; }
ATTACH_FILES=(kakei-category-ratio-47.csv kakei-category-ratio-47.json kakei-category-timeseries.csv)
for F in "${ATTACH_FILES[@]}"; do [ -f "$ADIR/data/$F" ] || { echo "FAIL attachment missing: data/$F"; exit 2; }; done

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

TITLE=$(sed -n 's/^title: *"\(.*\)"/\1/p' "$ADIR/draft.md" | head -1)
[ -n "$TITLE" ] || { echo "FAIL $SLUG no title"; exit 1; }

# ---- ローカル前提の確定 ----
node "$ROOT/.claude/scripts/note/prepare-article.cjs" "$SLUG" >/dev/null || { echo "FAIL $SLUG prepare"; exit 1; }
node "$ROOT/.claude/scripts/note/build-body.cjs" "$SLUG" >/dev/null || { echo "FAIL $SLUG body"; exit 1; }
J="/tmp/note-data-$SLUG.json"
PRICE=$(node -e "process.stdout.write(String(require('$J').priceJpy))")
PAID_HEAD=$(node -e "const j=require('$J');process.stdout.write(String(j.paidHead||'').split('\n')[0].replace(/^#+\s*/,''))")
NIMG=$(jq -r '.imgRefs | length' "$J")
NURL=$(jq -r '.urlCount' "$J")
EXPECT_EMBEDS=$((NURL + NIMG + ${#ATTACH_FILES[@]}))
[ "$PRICE" = "2980" ] || { echo "FAIL price is not 2980: $PRICE"; exit 1; }
[ -n "$PAID_HEAD" ] || { echo "FAIL paidHead empty"; exit 1; }
for i in $(seq 0 $((NIMG-1))); do
  F=$(jq -r ".imgRefs[$i].file" "$J" | sed 's/\.svg$/.png/')
  [ -f "$ADIR/images/$F" ] || { echo "FAIL image missing: images/$F"; exit 1; }
done
# 有料本文の識別語 (非ログイン HTML に出てはいけない) と無料本文の識別語 (出なければ更新失敗)
PAID_PROBE="十大費目の合計が消費支出の合計と一致すること"
FREE_PROBE="こんな人のためのデータです"
grep -qF "$PAID_PROBE" "$ADIR/draft.md" && grep -qF "$FREE_PROBE" "$ADIR/draft.md" || { echo "FAIL probes not in draft"; exit 1; }
echo "[prep] $SLUG key=$KEY price=$PRICE paidHead=$PAID_HEAD images=$NIMG urls=$NURL attachments=${#ATTACH_FILES[@]} expect_embeds=$EXPECT_EMBEDS"

# ---- アカウント照合 ----
NBU open "https://note.com/api/v2/current_user" >/dev/null 2>&1; sleep 4
ACC=$(NBU eval "(()=>{try{return JSON.parse(document.body.innerText).data.urlname}catch(e){return 'unknown'}})()" 2>&1 | sed -n 's/^result: //p' | head -1)
[ "$ACC" = "stats47" ] || { echo "FAIL account gate: got '$ACC'"; exit 1; }
echo "  account gate ok: $ACC"

# ---- 編集画面 (draft_reedit) → 旧添付削除 → 全消去 ----
NBU open "https://editor.note.com/notes/$KEY/edit?draft_reedit=true" >/dev/null 2>&1; sleep 7
NBU state 2>&1 > /tmp/ns.txt
grep -qE "contenteditable=true role=textbox" /tmp/ns.txt || { echo "FAIL editor not loaded"; exit 1; }
BEFORE=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
OLD_ATT=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.querySelectorAll('figure[embedded-service=attachment]').length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  existing body chars=${BEFORE:-0} attachments=${OLD_ATT:-0}"
NBU eval "(function(){const e=document.querySelector('[contenteditable=true]');if(!e)return 'no-editor';const figs=[...e.querySelectorAll('figure[embedded-service=attachment]')];for(const target of figs){const r=document.createRange();r.selectNode(target);const s=window.getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('delete');}if(figs.length)e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'deleteContent'}));return 'attachments-removed:'+figs.length;})();" >/dev/null 2>&1
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
[ "${AFTER:-1}" -le 5 ] || { echo "FAIL body not cleared (${AFTER} chars remain)"; NBU screenshot /tmp/note-paidupd-$SLUG-clear.png >/dev/null 2>&1; exit 1; }
REM_FIG=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.querySelectorAll('figure').length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  body cleared (remain ${AFTER:-0} chars, figures ${REM_FIG:-0})"
[ "${REM_FIG:-0}" -eq 0 ] || { echo "FAIL old figures remain (${REM_FIG})"; exit 1; }

# ---- 本文 paste ----
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
[ -n "$PN" ] || { echo "FAIL paste"; exit 1; }
sleep 4

# ---- URL カード ----
jq -r '.segments[] | select(.type=="url") | .content' "$J" > /tmp/urls-$SLUG.txt
while IFS= read -r url; do
  [ -z "$url" ] && continue
  EU=$(printf '%s' "$url" | sed "s/'/%27/g")
  NBU eval "(function(){const target=decodeURIComponent('$EU');const e=document.querySelector('[contenteditable=true]');if(!e)return 'x';let n=null;const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode())){if(t.textContent&&t.textContent.trim()===target){n=t;break;}}if(!n)return 'nf';const r=document.createRange();r.selectNodeContents(n);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);(n.parentElement||e).scrollIntoView({block:'center'});e.focus();return 'ok';})();" >/dev/null 2>&1
  NBU keys Enter >/dev/null 2>&1; sleep 4
done < /tmp/urls-$SLUG.txt

# ---- 目次を折りたたむ → 画像 ----
NBU state 2>&1 > /tmp/ns.txt
TOC=$(grep -oE '\[[0-9]+\]<button aria-label=目次 expanded=true' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -n "$TOC" ] && { NBU click "$TOC" >/dev/null 2>&1; sleep 1; }
for i in $(seq 0 $((NIMG-1))); do
  F=$(jq -r ".imgRefs[$i].file" "$J" | sed 's/\.svg$/.png/')
  ANCHOR=$(jq -r ".imgRefs[$i].afterText // .imgRefs[$i].afterHeading" "$J")
  ins_img "$ANCHOR" "$ADIR/images/$F" || { echo "FAIL image insert: $F"; exit 1; }
done

# ---- 添付 3 ファイル ----
# ins_file (Geo 商品 ZIP で実証済) はアンカー段落の「次の <p id=>」の直前へ挿す。note の <li> は内側に <p id=> を
# 持つので、anchor の直後が UL だとリストの中へ割り込む (2026-09-20 実測: UL が 3 分割され順序も逆転)。
# draft の「## 添付ファイル」は UL → 「ファイル本体は次のとおりです。」(anchor) → 「ダウンロードして、…」(target)
# の並びにし、3 回とも同じ anchor で anchor と target の間に順番どおり積む。
# (DOM 生成した <p> に Range でキャレットを置く方式は editor に無視され、paywall-line 直後 = 無料側へ落ちた: 同日実測)
# 2 件目以降は anchor 直後 (前回できた空段落の前) へ入るため、リストと同じ並びにするには逆順で挿す (同日実測)。
ATTACH_ANCHOR="ファイル本体は次のとおりです。"
grep -qF "$ATTACH_ANCHOR" "$ADIR/draft.md" || { echo "FAIL attachment anchor not in draft"; exit 1; }
# ins_file は添付 figure の実在まで待って返す (editor-helpers.sh)。大きいファイルの直後は失敗しうるので 1 回だけやり直す。
for (( ai=${#ATTACH_FILES[@]}-1; ai>=0; ai-- )); do
  F="${ATTACH_FILES[$ai]}"
  if ! ins_file "$ATTACH_ANCHOR" "$ADIR/data/$F"; then
    echo "  [RETRY] $F — inserting again"
    ins_file "$ATTACH_ANCHOR" "$ADIR/data/$F" || { echo "FAIL attach (retry) $F"; exit 1; }
  fi
done
# 同名 figure の二重添付 (retry 後の残骸) を止める
DUP=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');const names=[...e.querySelectorAll('figure[embedded-service=attachment]')].map(f=>(f.textContent||'').match(/kakei-category-[a-z0-9-]+\.(csv|json)/)?.[0]||'?');return JSON.stringify(names)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  attachment figures: $DUP"
echo "$DUP" | python3 -c "import json,sys;n=json.loads(sys.stdin.read());assert len(n)==3 and len(set(n))==3,n" || { echo "FAIL attachment figures are not exactly the 3 files"; exit 1; }

# ---- ブロック構造の実測 (画像は「データのサンプル」節の中、添付は有料見出しより後) ----
STRUCT=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return JSON.stringify([...e.children].map((c,k)=>({k,tag:c.tagName,svc:c.getAttribute('embedded-service')||'',img:!!c.querySelector('img'),text:(c.textContent||'').replace(/\\s+/g,' ').slice(0,40)})))})()" 2>&1 | sed -n 's/^result: //p' | head -1)
printf '%s\n' "$STRUCT" > "/tmp/note-paidupd-$SLUG-structure.json"
python3 - "$PAID_HEAD" "/tmp/note-paidupd-$SLUG-structure.json" <<'PY' || { echo "FAIL block structure (see /tmp/note-paidupd-$SLUG-structure.json)"; exit 1; }
import json,sys
kids=json.load(open(sys.argv[2],encoding='utf-8')); paid_head=sys.argv[1]
norm=lambda t:(t or '').replace(' ','').replace('　','').replace('#','')
h=lambda title:[c['k'] for c in kids if c['tag'] in ('H1','H2','H3','H4') and norm(c['text']).startswith(norm(title))]
sample=h('データのサンプル'); after=h('十大費目で見ると'); paid=h(paid_head)
imgs=[c['k'] for c in kids if c['tag']=='FIGURE' and c['img']]
atts=[c['k'] for c in kids if c['tag']=='FIGURE' and c['svc']=='attachment']
for c in kids: print(f"  {c['k']:>3} {c['tag']:<13} {c['svc']:<10} {'img' if c['img'] else '   '} {c['text']}")
assert sample and after and paid, ('headings missing', sample, after, paid)
assert len(imgs)==3 and all(sample[0]<k<after[0] for k in imgs), ('image figures not inside sample section', imgs, sample, after)
assert len(atts)==3 and all(k>paid[0] for k in atts), ('attachments not after paid heading', atts, paid)
att_names=[c['text'] for c in kids if c['tag']=='FIGURE' and c['svc']=='attachment']
expected=['kakei-category-ratio-47.csv','kakei-category-ratio-47.json','kakei-category-timeseries.csv']
assert all(n.startswith(e) for n,e in zip(att_names,expected)), ('attachment order differs from the list', att_names)
split=[c['text'] for c in kids if c['tag']=='P' and c['text'] and len(c['text'])<=3 and c['text'] not in ('',)]
assert not split, ('a paragraph looks split by insertion', split)
print(f"  structure ok: images={imgs} attachments={atts} paidHead={paid[0]}")
PY

# ---- エディタ上の実測 ----
LEN=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.innerText.length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
EMB=$(NBU eval "(()=>{const e=document.querySelector('[contenteditable=true]');return String(e?e.querySelectorAll('figure').length:0)})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  editor body chars=${LEN:-0} figures=${EMB:-0} (expect $EXPECT_EMBEDS)"
[ "${LEN:-0}" -lt 3000 ] && { echo "FAIL body too short in editor ($LEN)"; exit 1; }
[ "${EMB:-0}" -ne "$EXPECT_EMBEDS" ] && { echo "FAIL embeds ${EMB:-0} != expected $EXPECT_EMBEDS"; exit 1; }

# ---- 公開に進む → 有料ライン → 価格検証 → guard ----
NBU state 2>&1 > /tmp/ns.txt
PUB=$(np_btn /tmp/ns.txt "公開に進む")
[ -n "$PUB" ] || { echo "FAIL 公開に進む not found"; NBU screenshot /tmp/note-paidupd-$SLUG-pub.png >/dev/null 2>&1; exit 1; }
NBU click "$PUB" >/dev/null 2>&1; sleep 3
NBU state 2>&1 > /tmp/ns.txt
grep -qE "有料エリア設定" /tmp/ns.txt || { echo "FAIL 有料エリア設定 not shown (paid setting lost?)"; NBU screenshot /tmp/note-paidupd-$SLUG-settings.png >/dev/null 2>&1; exit 1; }
paid_setline_from_settings "$PAID_HEAD" "/tmp/note-paidupd-$SLUG-line.png" || { echo "FAIL paid line"; exit 1; }
# 価格は変更しない。input#price が DOM にあれば 2980 を確認し、無ければ PUT payload (guard) と公開 API で検証する。
PRICE_NOW=$(NBU eval "(function(){function find(root){if(!root)return null;const d=root.querySelector&&root.querySelector('input#price');if(d)return d;for(const el of (root.querySelectorAll?root.querySelectorAll('*'):[])){if(el.shadowRoot){const f=find(el.shadowRoot);if(f)return f;}}return null;}const i=find(document);return i?String(i.value).replace(/[^0-9]/g,''):'not-found';})();" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  price input now: $PRICE_NOW"
if [ "$PRICE_NOW" != "not-found" ] && [ "$PRICE_NOW" != "$PRICE" ]; then
  echo "FAIL price input is '$PRICE_NOW' (expected $PRICE) — not touching price, aborting"; NBU screenshot /tmp/note-paidupd-$SLUG-price.png >/dev/null 2>&1; exit 1
fi
np_install_publish_guard "$ADIR/hashtags.txt" 1500 || { echo "FAIL publish guard install"; exit 1; }
NBU screenshot "/tmp/note-paidupd-$SLUG-ready.png" >/dev/null 2>&1
echo "  ready screenshot: /tmp/note-paidupd-$SLUG-ready.png"
if [ "$STOP_BEFORE_COMMIT" = "1" ]; then echo "STOP before commit (STOP_BEFORE_COMMIT=1)"; exit 0; fi

# ---- 更新する ----
CLICKED=$(NBU eval "(function(){function deep(r,a){r.querySelectorAll('*').forEach(function(e){if(e.tagName==='BUTTON')a.push(e);if(e.shadowRoot)deep(e.shadowRoot,a);});return a;}var b=deep(document,[]).find(function(x){return (x.textContent||'').trim()==='更新する';});if(b){b.click();return 'clicked';}return 'nf';})();" 2>&1)
echo "$CLICKED" | grep -q "clicked" || { echo "FAIL 更新する button not found"; exit 1; }
sleep 9
OK=$(NBU eval "String(document.body.innerText.indexOf('記事が公開されました')>=0)" 2>&1 | sed -n 's/^result: //p' | head -1)
if [ "$OK" != "true" ]; then sleep 6; OK=$(NBU eval "String(document.body.innerText.indexOf('記事が公開されました')>=0)" 2>&1 | sed -n 's/^result: //p' | head -1); fi
np_verify_publish_guard || { echo "FAIL publish guard verification (PUT status/tags)"; exit 1; }
GUARD=$(NBU eval "JSON.stringify(window.__stats47PublishGuard||null)" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  guard: $GUARD"
echo "$GUARD" | grep -q "\"price\":$PRICE" || { echo "FAIL PUT price != $PRICE"; exit 1; }
[ "$OK" = "true" ] || echo "  [WARN] 公開モーダル未検出 (PUT は 200)。ライブ確認で判定する"
np_close_modal

# ---- ライブ確認 (非ログイン) ----
sleep 4
V=$(np_verify "$NOTE_URL" "$TITLE"); [ "$V" = "ok" ] || { echo "FAIL verify: $V"; exit 1; }
LIVE=$(NOTE_KEY="$KEY" EXPECTED_PRICE="$PRICE" FREE_PROBE="$FREE_PROBE" PAID_PROBE="$PAID_PROBE" NIMG="$NIMG" node - <<'NODE'
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let n;
for(let i=1;i<=5;i++){const r=await fetch(`https://note.com/api/v3/notes/${process.env.NOTE_KEY}?ts=${Date.now()}`,{headers:{'user-agent':'Mozilla/5.0'}});if(r.ok)n=(await r.json()).data;if(n?.status==='published'&&(n?.hashtag_notes?.length||0)>=95&&String(n?.body||'').includes(process.env.FREE_PROBE))break;await sleep(i*1000);}
const body=String(n?.body||'');
const html=await (await fetch(`https://note.com/stats47/n/${process.env.NOTE_KEY}`,{headers:{'user-agent':'Mozilla/5.0'}})).text();
const checks={account:n?.user?.urlname==='stats47',status:n?.status==='published',price:Number(n?.price||0)===Number(process.env.EXPECTED_PRICE),hashtags:(n?.hashtag_notes?.length||0)>=95,
  freeUpdated:body.includes(process.env.FREE_PROBE),paidHiddenApi:!body.includes(process.env.PAID_PROBE),paidHiddenHtml:!html.includes(process.env.PAID_PROBE),
  attachmentHiddenHtml:!/kakei-category-timeseries\.csv[^<]{0,40}(KB|MB)/.test(html),
  figures:(body.match(/<figure\b/g)||[]).length>=Number(process.env.NIMG)};
console.log(JSON.stringify({price:n?.price,tags:n?.hashtag_notes?.length,status:n?.status,figuresFree:(body.match(/<figure\b/g)||[]).length,checks}));
if(Object.values(checks).some(v=>!v))process.exit(1);
NODE
)
RC=$?
echo "  live: $LIVE"
[ $RC -eq 0 ] || { echo "FAIL live verification"; exit 1; }

# ---- 所有者画面で添付 3 件 (非ログインでは見えないため browser で) ----
NBU open "$NOTE_URL" >/dev/null 2>&1; sleep 6
OWNER=$(NBU eval "(()=>{const figs=[...document.querySelectorAll('figure[embedded-service=attachment], [data-name=attachment], a[download]')];const names=['kakei-category-ratio-47.csv','kakei-category-ratio-47.json','kakei-category-timeseries.csv'];const txt=document.body.innerText;return JSON.stringify({attachmentFigures:figs.length,names:names.map(n=>({name:n,count:(txt.match(new RegExp(n.replace(/\./g,'\\\\.'),'g'))||[]).length}))})})()" 2>&1 | sed -n 's/^result: //p' | head -1)
echo "  owner view: $OWNER"
echo "$OWNER" | python3 -c "
import json,sys;d=json.loads(sys.stdin.read())
bad=[x for x in d['names'] if x['count']<1]
assert not bad, ('attachment names missing in owner view', bad)
dup=[x for x in d['names'] if x['count']>2]
assert not dup, ('attachment appears too many times (duplicate old attachment?)', dup)
" || { echo "FAIL owner attachment check"; exit 1; }

python3 - "$ADIR/draft.md" <<'PY'
import sys,re,datetime
p=sys.argv[1]; s=open(p,encoding="utf-8").read(); today=datetime.date.today().isoformat()
if re.search(r'^updated_at:',s,re.M): s=re.sub(r'^updated_at:.*$','updated_at: "%s"'%today,s,count=1,flags=re.M)
else: s=re.sub(r'^(published_at:.*)$',r'\1\nupdated_at: "%s"'%today,s,count=1,flags=re.M)
open(p,"w",encoding="utf-8").write(s)
PY
echo "  UPDATED $NOTE_URL"
echo "OK $SLUG $NOTE_URL"
