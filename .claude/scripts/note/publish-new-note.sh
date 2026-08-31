#!/usr/bin/env bash
# 新規 note 記事を editor.note.com/new で作成する (browser-use)。
# 段階:  content(カバー/タイトル/本文/URLカード/画像) → 下書き保存 → screenshot
#        --prepare-publish で公開設定と有料境界を作り screenshot で停止
#        --commit-publish で目視済みの公開設定から投稿確定
#        --publish は後方互換（準備から確定まで連続実行。新規有料は二段階を推奨）
# 前提: prepare-article.cjs / build-body.cjs / カバー / hashtags 生成済み。account gate は呼び出し側 or 初回。
# 使い方: bash publish-new-note.sh <slug> <vertical> [--publish] [magazine表示名]
set -uo pipefail
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
ROOT=/Users/minamidaisuke/stats47
SLUG="$1"; VERT="$2"; PUBLISH="${3:-}"; MAGAZINE="${4:-}"
J="/tmp/note-data-$SLUG.json"
ADIR="$ROOT/docs/31_note記事原稿/$VERT/$SLUG"
[ -d "$ADIR" ] || ADIR="$ROOT/docs/31_note記事原稿/$SLUG"
BU(){ browser-use --headed --profile "Profile 5" "$@"; }
source "$ROOT/.claude/scripts/note/editor-helpers.sh" >/dev/null 2>&1
TITLE=$(node -e "process.stdout.write(require('$J').title)")

if [ "$PUBLISH" = "--commit-publish" ]; then
  echo "[commit] 目視済みの公開設定を確定 ..."
  CLICKED=$(BU eval "(function(){const all=[];(function deep(r){r.querySelectorAll('*').forEach(e=>{if(e.tagName==='BUTTON')all.push(e);if(e.shadowRoot)deep(e.shadowRoot);});})(document);const b=all.find(e=>['投稿する','今すぐ公開'].includes((e.textContent||'').trim()));if(!b)return 'not-found';b.click();return 'clicked:'+b.textContent.trim();})();" 2>&1)
  echo "$CLICKED" | grep -q "clicked:" || { echo "FAIL publish button not found"; exit 1; }
  sleep 6
  BU state 2>&1 > /tmp/ns.txt
  BU screenshot "/tmp/note-published-$SLUG.png" >/dev/null 2>&1
  if ! grep -qE '記事が公開されました|リンクをコピー|Facebook|LINE' /tmp/ns.txt; then
    echo "FAIL published confirmation not found"
    exit 1
  fi
  BU eval "(function(){const links=[];(function deep(r){r.querySelectorAll('a').forEach(a=>{if(a.href)links.push(a.href)});r.querySelectorAll('*').forEach(e=>{if(e.shadowRoot)deep(e.shadowRoot)});})(document);const live=[...new Set(links)].find(x=>/^https:\/\/note\.com\/stats47\/n\//.test(x));if(live)return live;const id=location.pathname.match(/\/notes\/(n[0-9a-f]+)\//)?.[1];return id?'https://note.com/stats47/n/'+id:location.href;})();" 2>&1
  echo "done"
  exit 0
fi

echo "[1] cover + title ..."
new_post_cover_title "$SLUG" "$VERT" "$TITLE" || { echo "FAIL cover/title"; exit 1; }

echo "[2] body paste (chunked) ..."
BODY="/tmp/note-body-$SLUG.txt"
BU eval "window.__nb='';'init'" >/dev/null 2>&1
BODYLEN=$(node -e "process.stdout.write(String([...require('fs').readFileSync('$BODY','utf8')].length))")
OFFSET=0
while [ "$OFFSET" -lt "$BODYLEN" ]; do
  CHUNK=$(node -e "const b=[...require('fs').readFileSync('$BODY','utf8')]; process.stdout.write(encodeURIComponent(b.slice($OFFSET,$OFFSET+400).join('')).replace(/'/g,'%27'))")
  BU eval "window.__nb+=decodeURIComponent('$CHUNK');String(window.__nb.length)" >/dev/null 2>&1
  OFFSET=$((OFFSET + 400))
done
PN=$(BU eval "const editor=document.querySelector('[contenteditable=true]');editor.focus();const dt=new DataTransfer();dt.setData('text/plain',window.__nb);editor.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));const n=window.__nb.length;delete window.__nb;'pasted '+n;" 2>&1 | grep -oiE "pasted [0-9]+")
echo "    $PN"; sleep 4

echo "[3] URL カード化 ($(jq -r '.urlCount' "$J") 件) ..."
jq -r '.segments[] | select(.type=="url") | .content' "$J" > /tmp/urls-$SLUG.txt
while IFS= read -r url; do
  [ -z "$url" ] && continue
  EU=$(printf '%s' "$url" | sed "s/'/%27/g")
  BU eval "(function(){const target=decodeURIComponent('$EU');const e=document.querySelector('[contenteditable=true]');if(!e)return 'x';let n=null;const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode())){if(t.textContent&&t.textContent.trim()===target){n=t;break;}}if(!n)return 'nf';const r=document.createRange();r.selectNodeContents(n);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);(n.parentElement||e).scrollIntoView({block:'center'});e.focus();return 'ok';})();" >/dev/null 2>&1
  BU keys Enter >/dev/null 2>&1; sleep 4
done < /tmp/urls-$SLUG.txt

echo "[4] 目次を折りたたむ (ins_img の TOC 同名衝突を防ぐ) ..."
BU state 2>&1 > /tmp/ns.txt
TOC=$(grep -oE '\[[0-9]+\]<button aria-label=目次 expanded=true' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -n "$TOC" ] && { BU click "$TOC" >/dev/null 2>&1; sleep 1; echo "    目次 collapsed (btn=$TOC)"; } || echo "    目次 already collapsed"

echo "[5] 画像挿入 ($(jq -r '.imgRefs|length' "$J") 枚) ..."
NIMG=$(jq -r '.imgRefs | length' "$J")
if [ "$NIMG" -gt 0 ]; then
  for i in $(seq 0 $((NIMG-1))); do
    FILE=$(jq -r ".imgRefs[$i].file" "$J" | sed 's/\.svg$/.png/')
    HEAD=$(jq -r ".imgRefs[$i].afterHeading" "$J")
    ins_img "$HEAD" "$ADIR/images/$FILE"
  done
fi

ATTACHMENT=$(jq -r '.productAttachment.path // empty' "$J")
if [ -n "$ATTACHMENT" ]; then
  ATTACHMENT_ANCHOR=$(jq -r '.productAttachment.afterHeading' "$J")
  echo "[5.5] 商品ZIPを有料本文へ添付 ..."
  ins_file "$ATTACHMENT_ANCHOR" "$ATTACHMENT" || { echo "FAIL attachment"; exit 1; }
fi

echo "[5.8] 下書き保存 + screenshot ..."
BU state 2>&1 > /tmp/ns.txt
SAVE=$(grep -oE '\[[0-9]+\]<button[^>]*>下書き保存|\[[0-9]+\]<button aria-label=下書き保存' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -n "$SAVE" ] && { BU click "$SAVE" >/dev/null 2>&1; sleep 3; echo "    下書き保存 clicked (btn=$SAVE)"; } || echo "    [WARN] 下書き保存ボタン未検出 (自動保存に依存)"
BU screenshot "/tmp/note-new-$SLUG.png" >/dev/null 2>&1 || BU state 2>&1 | head -40 > /tmp/note-new-$SLUG.txt
echo "    screenshot: /tmp/note-new-$SLUG.png"

if [ "$PUBLISH" != "--publish" ] && [ "$PUBLISH" != "--prepare-publish" ]; then echo "(content+draft のみ。--prepare-publish で公開準備)"; exit 0; fi

echo "[6] 公開に進む → 価格/タグ → 公開ライン ..."
BU state 2>&1 > /tmp/ns.txt
GO=$(grep -oE '\[[0-9]+\]<button[^>]*>公開に進む|\[[0-9]+\]<button aria-label=公開に進む' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -z "$GO" ] && GO=$(awk '/公開に進む/{print prev} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]<button' | grep -oE '[0-9]+' | tail -1)
[ -n "$GO" ] && { BU click "$GO" >/dev/null 2>&1; sleep 3; } || echo "    [WARN] 公開に進む 未検出"
IS_PAID=$(jq -r '.isPaid' "$J")
PRICE=$(jq -r '.priceJpy' "$J")
if [ "$IS_PAID" = "true" ]; then
  BU state 2>&1 > /tmp/ns.txt
  PAID=$(awk '/^\t+有料$/{print prev; exit} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]' | tr -d '[]')
  [ -n "$PAID" ] || { echo "FAIL 有料 radio not found"; exit 1; }
  BU click "$PAID" >/dev/null 2>&1; sleep 3
  SET_PRICE=$(BU eval "(function(){function find(root){if(!root)return null;const direct=root.querySelector&&root.querySelector('input#price');if(direct)return direct;for(const el of root.querySelectorAll?root.querySelectorAll('*'):[]){if(el.shadowRoot){const found=find(el.shadowRoot);if(found)return found;}}return null;}const input=find(document);if(!input)return 'not-found';const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'$PRICE');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('blur',{bubbles:true}));return 'price:'+input.value;})();" 2>&1)
  echo "$SET_PRICE" | grep -q "price:$PRICE" || { echo "FAIL price not set: $SET_PRICE"; exit 1; }
  echo "    有料 $PRICE 円"
fi
# タグ
TAGS=$(head -99 "$ADIR/hashtags.txt" 2>/dev/null | tr '\n' ' ')
[ -n "$TAGS" ] && new_post_tags "$TAGS"
[ -n "$MAGAZINE" ] && new_post_magazine "$MAGAZINE"
# 公開ライン
if [ "$IS_PAID" = "true" ]; then
  PAID_HEAD=$(jq -r '.segmentsPaid[0].content' "$J" | head -1 | sed 's/^#* *//')
  paid_setline_from_settings "$PAID_HEAD" "/tmp/note-ready-$SLUG.png" || exit 1
else
  BU state 2>&1 > /tmp/ns.txt
  TRIAL=$(grep -oE '\[[0-9]+\]<button[^>]*>試し読みエリアを設定' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
  if [ -n "$TRIAL" ]; then
    BU click "$TRIAL" >/dev/null 2>&1; sleep 2
    BU eval "(function(){document.querySelectorAll('*').forEach(el=>{if(el.scrollHeight>el.clientHeight+50)el.scrollTop=el.scrollHeight});window.scrollTo(0,document.body.scrollHeight);return 'scrolled';})();" >/dev/null 2>&1
    sleep 1
    BU state 2>&1 > /tmp/ns.txt
    LINE=$(grep -oE '\[[0-9]+\]<button[^>]*>ラインをこの場所に変更' /tmp/ns.txt | grep -oE '[0-9]+' | tail -1)
    [ -n "$LINE" ] && { BU click "$LINE" >/dev/null 2>&1; sleep 2; }
  fi
  BU screenshot "/tmp/note-ready-$SLUG.png" >/dev/null 2>&1
fi
echo "    ready screenshot: /tmp/note-ready-$SLUG.png"
if [ "$PUBLISH" = "--prepare-publish" ]; then
  echo "(公開設定準備済み。screenshot目視後 --commit-publish で確定)"
  exit 0
fi
BU state 2>&1 > /tmp/ns.txt
POST=$(grep -oE '\[[0-9]+\]<button[^>]*>投稿する|\[[0-9]+\]<button[^>]*>今すぐ公開' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -z "$POST" ] && POST=$(awk '/^\t+投稿する$|^\t+今すぐ公開$/{print prev} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]<button' | grep -oE '[0-9]+' | head -1)
[ -n "$POST" ] && { BU click "$POST" >/dev/null 2>&1; sleep 5; echo "    投稿する clicked"; } || echo "    [WARN] 投稿する 未検出"
BU screenshot "/tmp/note-published-$SLUG.png" >/dev/null 2>&1
BU eval "location.href" 2>&1 | grep -oE 'https://note.com/[^ ]+' | head -1
echo "done"
