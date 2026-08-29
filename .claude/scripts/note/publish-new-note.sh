#!/usr/bin/env bash
# 新規 note 記事を editor.note.com/new で作成する (browser-use)。
# 段階:  content(カバー/タイトル/本文/URLカード/画像) → 下書き保存 → screenshot
#        --publish 指定時のみ 公開設定(タグ→全文無料ライン→投稿する)
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
for i in $(seq 0 $((NIMG-1))); do
  FILE=$(jq -r ".imgRefs[$i].file" "$J" | sed 's/\.svg$/.png/')
  HEAD=$(jq -r ".imgRefs[$i].afterHeading" "$J")
  ins_img "$HEAD" "$ADIR/images/$FILE"
done

echo "[5] 下書き保存 + screenshot ..."
BU state 2>&1 > /tmp/ns.txt
SAVE=$(grep -oE '\[[0-9]+\]<button[^>]*>下書き保存|\[[0-9]+\]<button aria-label=下書き保存' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -n "$SAVE" ] && { BU click "$SAVE" >/dev/null 2>&1; sleep 3; echo "    下書き保存 clicked (btn=$SAVE)"; } || echo "    [WARN] 下書き保存ボタン未検出 (自動保存に依存)"
BU screenshot "/tmp/note-new-$SLUG.png" >/dev/null 2>&1 || BU state 2>&1 | head -40 > /tmp/note-new-$SLUG.txt
echo "    screenshot: /tmp/note-new-$SLUG.png"

if [ "$PUBLISH" != "--publish" ]; then echo "(content+draft のみ。--publish で公開)"; exit 0; fi

echo "[6] 公開に進む → タグ → 全文無料 → 投稿する ..."
BU state 2>&1 > /tmp/ns.txt
GO=$(grep -oE '\[[0-9]+\]<button[^>]*>公開に進む|\[[0-9]+\]<button aria-label=公開に進む' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -z "$GO" ] && GO=$(awk '/公開に進む/{print prev} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]<button' | grep -oE '[0-9]+' | tail -1)
[ -n "$GO" ] && { BU click "$GO" >/dev/null 2>&1; sleep 3; } || echo "    [WARN] 公開に進む 未検出"
# タグ
TAGS=$(head -99 "$ADIR/hashtags.txt" 2>/dev/null | tr '\n' ' ')
[ -n "$TAGS" ] && new_post_tags "$TAGS"
[ -n "$MAGAZINE" ] && new_post_magazine "$MAGAZINE"
# 全文無料ライン → 投稿する
BU state 2>&1 > /tmp/ns.txt
TRIAL=$(grep -oE '\[[0-9]+\]<button[^>]*>試し読みエリアを設定' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
if [ -n "$TRIAL" ]; then
  BU click "$TRIAL" >/dev/null 2>&1; sleep 2; BU state 2>&1 > /tmp/ns.txt
  LINE=$(grep -oE '\[[0-9]+\]<button[^>]*>ラインをこの場所に変更' /tmp/ns.txt | grep -oE '[0-9]+' | tail -1)
  [ -n "$LINE" ] && { BU click "$LINE" >/dev/null 2>&1; sleep 2; }
fi
BU state 2>&1 > /tmp/ns.txt
POST=$(grep -oE '\[[0-9]+\]<button[^>]*>投稿する|\[[0-9]+\]<button[^>]*>今すぐ公開' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
[ -z "$POST" ] && POST=$(awk '/^\t+投稿する$|^\t+今すぐ公開$/{print prev} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]<button' | grep -oE '[0-9]+' | head -1)
[ -n "$POST" ] && { BU click "$POST" >/dev/null 2>&1; sleep 5; echo "    投稿する clicked"; } || echo "    [WARN] 投稿する 未検出"
BU screenshot "/tmp/note-published-$SLUG.png" >/dev/null 2>&1
BU eval "location.href" 2>&1 | grep -oE 'https://note.com/[^ ]+' | head -1
echo "done"
