# note エディタ操作の再利用シェル関数（publish-note --update 用・実機検証済 2026-06-16）
# 使い方:
#   export PATH="$HOME/.browser-use-env/bin:$PATH"
#   source .claude/scripts/note/editor-helpers.sh
#   process_article <slug> <noteId> <vertical>   # 本文クリア→ペースト→URLカード→画像→有料境界→screenshot
#   # screenshot を目視で検証してから:
#   do_update <slug>                              # 「更新する」→公開モーダル確認→state に updated_at 記録
#
# 前提: Phase 0 で `node .claude/scripts/note/prepare-article.cjs <slug>` を実行し
#       /tmp/note-data-<slug>.json を生成済みであること（build-body.cjs は process_article 内で呼ぶ）。
# 詳細フロー・ハザードは .claude/skills/note/publish-note/references/editor-operations.md を参照。

BU(){ browser-use --headed --profile "Profile 5" "$@"; }

# ---- 画像挿入: 本文中のアンカーテキストへ eval-scroll → 直後段落に画像を挿入 ----
# 見出しでなくサブ見出し・コード行アンカーでも startsWith/includes で拾う。svg は呼び出し側で png に置換する。
ins_img(){
  local H="$1" IMG="$2"
  if [ ! -f "$IMG" ]; then echo "  [WARN] image missing: $IMG"; return 1; fi
  local ESC=$(printf '%s' "$H" | sed "s/'/%27/g")
  local R=$(BU eval "(function(){const e=document.querySelector('[contenteditable=true]');if(!e)return 'no-editor';const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let t,hit=null;const target=decodeURIComponent('$ESC');while((t=w.nextNode())){if(t.textContent&&t.textContent.trim().startsWith(target)){hit=t;break;}}if(!hit){const w2=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);while((t=w2.nextNode())){if(t.textContent&&t.textContent.includes(target)){hit=t;break;}}}if(!hit)return 'not-found';(hit.parentElement||e).scrollIntoView({block:'center'});return 'scrolled';})();" 2>&1 | grep -oiE "scrolled|not-found|no-editor" | head -1)
  if [ "$R" != "scrolled" ]; then echo "  [WARN] anchor scroll failed ($R): $H"; return 1; fi
  sleep 1.2
  BU state 2>&1 > /tmp/ns.txt
  local ANCHOR=$(awk -v h="$H" '
    index($0,h){found=1; next}
    found && /\[[0-9]+\]<p id=/ {match($0,/\[[0-9]+\]/); print substr($0,RSTART+1,RLENGTH-2); exit}
    found && /\[[0-9]+\]<li/ {match($0,/\[[0-9]+\]/); print substr($0,RSTART+1,RLENGTH-2); exit}
    ' /tmp/ns.txt)
  if [ -z "$ANCHOR" ]; then echo "  [WARN] anchor para not found after: $H"; return 1; fi
  BU click "$ANCHOR" >/dev/null 2>&1; sleep 0.4
  BU keys Home >/dev/null 2>&1; sleep 0.3
  BU keys Enter >/dev/null 2>&1; sleep 0.4
  BU keys ArrowUp >/dev/null 2>&1; sleep 0.5
  BU state 2>&1 > /tmp/ns.txt
  local MENU=$(grep -oE "\[[0-9]+\]<button aria-label=メニューを開く" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  BU click "$MENU" >/dev/null 2>&1; sleep 1
  BU state 2>&1 > /tmp/ns.txt
  local IB=$(awk '/^\t*\*?\[[0-9]+\]<button \/>/{i=$0} /^\t*画像\s*$/{print i; exit}' /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  BU click "$IB" >/dev/null 2>&1; sleep 1.5
  BU state 2>&1 > /tmp/ns.txt
  local UP=$(grep -oE "\[[0-9]+\]<input id=note-editor-image-upload-input" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  BU upload "$UP" "$IMG" 2>&1 | grep -iE "uploaded|error" | sed 's/^/  /'
  sleep 5
  echo "  [OK] $H <- $(basename "$IMG") (anchor=$ANCHOR)"
}

# ---- アフィリエイトバナーID → A8.net トラッキングURL マッピング ----
get_affiliate_url(){
  case "$1" in
    ai_agent_camp) echo "https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75" ;;
    career_banner)  echo "https://px.a8.net/svt/ejp?a8mat=4AZCG4+9Z0EK2+5UK0+5YZ75" ;;
    strategy_career) echo "https://px.a8.net/svt/ejp?a8mat=4B5LK5+5YC2K2+5P1E+5ZEMP" ;;
    *) echo "" ;;
  esac
}

# ---- 画像挿入 + リンク設定: ins_img の後に note.com フローティングツールバーでリンクを設定 ----
# 使い方: ins_img_with_link <anchor_text> <img_path> <link_url>
# 画像の挿入は ins_img と同じロジック。挿入後に画像をクリック→ツールバーのリンクボタン→URL入力→Enter。
ins_img_with_link(){
  local H="$1" IMG="$2" LINK_URL="$3"
  ins_img "$H" "$IMG" || return 1
  sleep 2
  # 挿入した画像を最後のfigure要素として検出してクリック
  BU state 2>&1 > /tmp/ns.txt
  # まずフローティングツールバーのリンクボタンを探す（画像挿入直後は選択状態のことも）
  local LINK_BTN=$(grep -oiE "\[[0-9]+\].*リンクを設定" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  if [ -z "$LINK_BTN" ]; then
    # 最後のfigure要素をクリックしてツールバーを表示させる
    local LAST_FIG=$(grep -oE "\[[0-9]+\]<figure" /tmp/ns.txt | tail -1 | grep -oE "[0-9]+" | head -1)
    if [ -z "$LAST_FIG" ]; then echo "  [WARN] affiliate figure not found, skip link"; return 0; fi
    BU click "$LAST_FIG" >/dev/null 2>&1; sleep 1.2
    BU state 2>&1 > /tmp/ns.txt
    LINK_BTN=$(grep -oiE "\[[0-9]+\].*リンクを設定" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  fi
  if [ -z "$LINK_BTN" ]; then
    # ツールバーなし: aria-label ベースで探す
    LINK_BTN=$(grep -oiE "\[[0-9]+\]<button aria-label=リンク" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  fi
  if [ -z "$LINK_BTN" ]; then echo "  [WARN] link button not found, banner inserted without link"; return 0; fi
  BU click "$LINK_BTN" >/dev/null 2>&1; sleep 0.8
  BU state 2>&1 > /tmp/ns.txt
  # URL入力フィールドを探してタイプ（フィールドがあればクリック→タイプ、なければそのままタイプ）
  local URL_INPUT=$(grep -oiE "\[[0-9]+\]<input[^>]*" /tmp/ns.txt | grep -iE "url|link|href" | grep -oE "[0-9]+" | head -1)
  [ -n "$URL_INPUT" ] && BU click "$URL_INPUT" >/dev/null 2>&1 && sleep 0.3
  BU type "$LINK_URL" >/dev/null 2>&1; sleep 0.3
  BU keys Enter >/dev/null 2>&1; sleep 0.8
  echo "  [LINK] $(basename "$IMG") -> $LINK_URL"
}

# ---- 有料境界: 公開に進む→有料エリア設定→paidHead 直前にラインを置く→screenshot ----
# 空白・バッククォート(インラインコード)・先頭 # に非依存でマッチする（state とプレビューの差異を吸収）。
paid_setline(){
  local HEAD="$1" SHOT="$2"
  BU state 2>&1 > /tmp/ps.txt
  local PUB=$(awk '/^\t*公開に進む\s*$/{print prev} {prev=$0}' /tmp/ps.txt | grep -oE "\[[0-9]+\]" | grep -oE "[0-9]+" | head -1)
  BU click "$PUB" >/dev/null 2>&1; sleep 3
  BU state 2>&1 > /tmp/ps.txt
  if ! grep -qE "有料エリア設定" /tmp/ps.txt; then echo "  [WARN] no 有料エリア設定 (free?)"; return 2; fi
  local SET=$(awk '/^\t*有料エリア設定\s*$/{print prev} {prev=$0}' /tmp/ps.txt | grep -oE "\[[0-9]+\]" | grep -oE "[0-9]+" | head -1)
  BU click "$SET" >/dev/null 2>&1; sleep 2.5
  local HSTRIP=$(printf '%s' "$HEAD" | tr -d '\140')
  local ESC=$(printf '%s' "$HSTRIP" | sed "s/'/%27/g")
  BU eval "(function(){const root=document.querySelector('[contenteditable=false][role=textbox]');if(!root)return 'no-root';const norm=s=>(s||'').replace(/[\s　\140]/g,'');const target=norm(decodeURIComponent('$ESC'));const els=root.querySelectorAll('h1,h2,h3,h4,p,li');for(const el of els){if(norm(el.textContent).includes(target)){el.scrollIntoView({block:'center'});return 'scrolled';}}return 'not-found';})();" 2>&1 | grep -iE "scrolled|not-found|no-root" | sed 's/^/  /'
  sleep 1.5
  BU state 2>&1 > /tmp/ps.txt
  local BTN=$(HEAD="$HEAD" python3 - << 'PY'
import os,re
head=os.environ['HEAD']
norm=lambda s:re.sub(r'[\s　`#]','',s)
ht=norm(head)
lines=open('/tmp/ps.txt',encoding='utf-8').read().split('\n')
hidx=None
for i,l in enumerate(lines):
    if ht and ht in norm(l):
        hidx=i
if hidx is None:
    print(''); raise SystemExit
for j in range(hidx-1, max(hidx-4,-1), -1):
    m=re.search(r'\[(\d+)\]<button',lines[j])
    if m:
        print(m.group(1)); break
else:
    print('')
PY
)
  if [ -z "$BTN" ]; then
    # フォールバック: 有料境界見出しが inline link/code を含むと a11y state の単行テキスト照合が
    # 外れる（2026-07-10 に #06/#07 で発生）。DOM 側で H1-4 を直接探し、その直前の
    # 「ラインをこの場所に変更」ボタンを eval-click する（Shadow-DOM 貫通）。
    local FB=$(BU eval "(function(){var norm=function(s){return (s||'').replace(/[\s　\140#]/g,'');};var target=norm(decodeURIComponent('$ESC'));var all=[];(function deep(r){r.querySelectorAll('*').forEach(function(e){all.push(e);if(e.shadowRoot)deep(e.shadowRoot);});})(document);var hidx=-1;for(var i=0;i<all.length;i++){var el=all[i];if(/^H[1-4]$/.test(el.tagName)&&norm(el.textContent).indexOf(target)>=0){hidx=i;break;}}if(hidx<0)return 'heading-nf';for(var j=hidx;j>=0&&j>hidx-200;j--){var b=all[j];if(b.tagName==='BUTTON'&&(b.textContent||'').trim()==='ラインをこの場所に変更'){b.click();return 'clicked';}}return 'btn-nf';})();" 2>&1)
    if echo "$FB" | grep -q "clicked"; then
      sleep 1.5; BU screenshot "$SHOT" >/dev/null 2>&1
      echo "  [OK] line set before: $HEAD (DOM fallback) shot=$SHOT"
      return 0
    fi
    echo "  [WARN] line button not found for: $HEAD (fallback=$FB)"; return 1
  fi
  BU click "$BTN" >/dev/null 2>&1; sleep 1.5
  BU screenshot "$SHOT" >/dev/null 2>&1
  echo "  [OK] line set before: $HEAD (btn=$BTN) shot=$SHOT"
}

# ---- 更新確定: 「更新する」→「記事が公開されました」確認→ note-published-urls.json に updated_at 記録 ----
do_update(){
  local SLUG="$1"
  # ヘッダーの「更新する」ボタンは browser-use の a11y state で [idx] が付かない
  # （プレーンテキストとして出る）ため index click が効かない。Shadow-DOM 貫通の
  # eval-click で確実に押す（2026-07-10 実機で検証。詳細 memory project_note_update_mode_learnings）。
  local CLICKED=$(BU eval "(function(){function deep(r,a){r.querySelectorAll('*').forEach(function(e){if(e.tagName==='BUTTON')a.push(e);if(e.shadowRoot)deep(e.shadowRoot,a);});return a;}var b=deep(document,[]).find(function(x){return (x.textContent||'').trim()==='更新する';});if(b){b.click();return 'clicked';}return 'nf';})();" 2>&1)
  if ! echo "$CLICKED" | grep -q "clicked"; then
    # フォールバック: 旧 a11y index click（環境により [idx] が付く場合がある）
    BU state 2>&1 > /tmp/ps.txt
    local UPD=$(awk '/^\t*更新する\s*$/{print prev} {prev=$0}' /tmp/ps.txt | grep -oE "\[[0-9]+\]" | grep -oE "[0-9]+" | head -1)
    [ -n "$UPD" ] && BU click "$UPD" >/dev/null 2>&1
  fi
  sleep 5
  BU state 2>&1 > /tmp/ps.txt
  if grep -qE "記事が公開されました" /tmp/ps.txt; then
    SLUG="$SLUG" python3 - << 'PY'
import json,os
slug=os.environ['SLUG']
p='.claude/state/note-published-urls.json'
d=json.load(open(p))
if slug in d['articles']:
    d['articles'][slug]['updated_at']='2026-06-16'
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
    print('  [PUBLISHED] %s  updated_at recorded'%slug)
else:
    print('  [PUBLISHED] %s  (not in state map!)'%slug)
PY
  else
    # WARN false negative: 「記事が公開されました」モーダルは timing で検出を外すことがあり、
    # 更新自体は成功している場合がある（2026-07-10 に #13/estat01/estat11 で発生）。
    # → 必ずエディタ再オープンでライブ確認してから FAIL 確定すること。
    echo "  [WARN] $SLUG — publish モーダル未検出。更新は成功している可能性あり → エディタ再オープンでライブ確認"
    grep -nE "エラー|error|必須" /tmp/ps.txt | head -3
  fi
}

# ---- 1 記事の --update を screenshot 直前まで自動実行（JSON 駆動） ----
# article_subdir 例: koumuin-estat-claude-code。実行後 /tmp/note-publish-<slug>.png を必ず目視→ do_update。
process_article(){
  local SLUG="$1" NOTEID="$2" VERT="$3"
  local J="/tmp/note-data-$SLUG.json"
  local ADIR="/Users/minamidaisuke/stats47/docs/31_note記事原稿/$VERT/$SLUG/images"
  node /Users/minamidaisuke/stats47/.claude/scripts/note/build-body.cjs "$SLUG" >/dev/null
  BU open "https://editor.note.com/notes/$NOTEID/edit" >/dev/null 2>&1; sleep 6
  BU state 2>&1 > /tmp/ns.txt
  if ! grep -qE "contenteditable=true role=textbox" /tmp/ns.txt; then echo "  [FAIL] editor not loaded for $SLUG"; return 1; fi
  BU eval "(function(){const e=document.querySelector('[contenteditable=true]');e.focus();const r=document.createRange();r.selectNodeContents(e);const s=window.getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('delete');return 'c';})();" >/dev/null 2>&1
  local BODY="/tmp/note-body-$SLUG.txt"
  BU eval "window.__nb='';'init'" >/dev/null 2>&1
  local BODYLEN=$(node -e "process.stdout.write(String([...require('fs').readFileSync('$BODY','utf8')].length))")
  local OFFSET=0
  while [ "$OFFSET" -lt "$BODYLEN" ]; do
    local CHUNK=$(node -e "const b=[...require('fs').readFileSync('$BODY','utf8')]; process.stdout.write(encodeURIComponent(b.slice($OFFSET,$OFFSET+400).join('')).replace(/'/g,'%27'))")
    BU eval "window.__nb+=decodeURIComponent('$CHUNK');String(window.__nb.length)" >/dev/null 2>&1
    OFFSET=$((OFFSET + 400))
  done
  local PN=$(BU eval "const editor=document.querySelector('[contenteditable=true]');editor.focus();const dt=new DataTransfer();dt.setData('text/plain',window.__nb);editor.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));const n=window.__nb.length;delete window.__nb;'pasted '+n;" 2>&1 | grep -oiE "pasted [0-9]+")
  echo "  $SLUG: $PN"
  sleep 4
  jq -r '.segments[] | select(.type=="url") | .content' "$J" > /tmp/urls.txt
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    local EU=$(printf '%s' "$url" | sed "s/'/%27/g")
    BU eval "(function(){const target=decodeURIComponent('$EU');const e=document.querySelector('[contenteditable=true]');if(!e)return 'x';let n=null;const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode())){if(t.textContent&&t.textContent.trim()===target){n=t;break;}}if(!n)return 'nf';const r=document.createRange();r.selectNodeContents(n);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);(n.parentElement||e).scrollIntoView({block:'center'});e.focus();return 'ok';})();" >/dev/null 2>&1
    BU keys Enter >/dev/null 2>&1; sleep 4
  done < /tmp/urls.txt
  local NIMG=$(jq -r '.imgRefs | length' "$J")
  for i in $(seq 0 $((NIMG-1))); do
    local FILE=$(jq -r ".imgRefs[$i].file" "$J" | sed 's/\.svg$/.png/')
    local HEAD=$(jq -r ".imgRefs[$i].afterHeading" "$J")
    ins_img "$HEAD" "$ADIR/$FILE"
  done
  # Phase 5.5: アフィリエイトバナー（画像+リンク）
  local NAFF=$(jq -r '.affiliateBanners | length' "$J" 2>/dev/null || echo "0")
  for i in $(seq 0 $((NAFF-1))); do
    local AFF_ID=$(jq -r ".affiliateBanners[$i].id" "$J")
    local AFF_ANCHOR=$(jq -r ".affiliateBanners[$i].anchor" "$J")
    local AFF_PNG="/Users/minamidaisuke/stats47/.claude/assets/affiliate-banners/${AFF_ID}.png"
    local AFF_URL
    AFF_URL=$(get_affiliate_url "$AFF_ID")
    if [ -z "$AFF_URL" ]; then echo "  [WARN] unknown affiliate id: $AFF_ID"; continue; fi
    if [ ! -f "$AFF_PNG" ]; then echo "  [WARN] banner image missing: $AFF_PNG"; continue; fi
    ins_img_with_link "$AFF_ANCHOR" "$AFF_PNG" "$AFF_URL"
  done
  local FULLHEAD=$(jq -r '.segmentsPaid[0].content' "$J" | head -1 | sed 's/^#* *//')
  paid_setline "$FULLHEAD" "/tmp/note-publish-$SLUG.png"
}

# ============================================================================
# 新規投稿フロー（editor.note.com/new・2026-06-16 #19 無料で実機検証）
# new_post <slug> <vertical> "<tag1 tag2 ...>" "<magazine name>"
#   cover→title→body→images→urlカード→hashtag→magazine まで実行（公開ライン/投稿は呼び出し側）。
#   無料: paid_setline は使わず「試し読みエリアを設定」→末尾ライン→投稿する。
#   有料: 価格設定(set_price)→paid_setline 相当→screenshot 目視→投稿する。
# 実装知見: (a) カバーは本文入力前に設定（aria-label=画像を追加→画像をアップロード→eyecatch-input→トリミング保存,
#   下書き保存と区別）。(b) タイトルは textarea[placeholder=記事タイトル] に type（value は eval で検証）。
#   (c) hashtag は combobox に **1 個ずつ click→type→Enter→sleep0.9**（まとめると value に連結され失敗）。
#   投稿前に紛れ込む #NN チップ（本文の #31 等由来）は 削除 してから付け直す。(d) magazine は item-magazine-add→
#   対象マガジン行の 追加（→追加済）。(e) 無料の確定ボタンは「試し読みエリアを設定」→ライン画面で**末尾**の
#   「ラインをこの場所に変更」（全文無料）→「投稿する」。成功は Facebook/LINE シェアボタンのモーダル。
# ============================================================================
new_post_cover_title(){
  local SLUG="$1" VERT="$2" TITLE="$3"
  local ADIR="/Users/minamidaisuke/stats47/docs/31_note記事原稿/$VERT/$SLUG"
  BU open "https://editor.note.com/new" >/dev/null 2>&1; sleep 5
  BU state 2>&1 > /tmp/ns.txt
  if ! grep -qE "contenteditable=true role=textbox" /tmp/ns.txt; then echo "  [FAIL] /new not loaded (login?)"; return 1; fi
  if [ -f "$ADIR/images/cover-1280x670.png" ]; then
    local ADD=$(grep -oE '\[[0-9]+\]<button aria-label=画像を追加' /tmp/ns.txt | grep -oE '[0-9]+' | head -1)
    BU click "$ADD" >/dev/null 2>&1; sleep 2; BU state 2>&1 > /tmp/ns.txt
    local UP=$(grep -B1 '画像をアップロード' /tmp/ns.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
    BU click "$UP" >/dev/null 2>&1; sleep 2; BU state 2>&1 > /tmp/ns.txt
    local FI=$(grep -oE '\[[0-9]+\]<input id=note-editor-eyecatch-input' /tmp/ns.txt | grep -oE '[0-9]+')
    BU upload "$FI" "$ADIR/images/cover-1280x670.png" >/dev/null 2>&1; sleep 3; BU state 2>&1 > /tmp/ns.txt
    local SV=$(awk '/^\t+保存$/{print prev} {prev=$0}' /tmp/ns.txt | grep -oE '\[[0-9]+\]<button' | grep -oE '[0-9]+' | tail -1)
    BU click "$SV" >/dev/null 2>&1; sleep 3
  fi
  BU state 2>&1 > /tmp/ns.txt
  local TI=$(grep -oE '\[[0-9]+\]<textarea placeholder=記事タイトル' /tmp/ns.txt | grep -oE '[0-9]+')
  BU click "$TI" >/dev/null 2>&1; sleep 0.5
  BU type "$TITLE" >/dev/null 2>&1; sleep 1
  local TV=$(BU eval "(function(){const t=document.querySelector('textarea[placeholder=記事タイトル]');return t?t.value:'';})();" 2>&1 | grep -oiE "title|result" >/dev/null; echo ok)
  echo "  cover+title set: $TITLE"
}
new_post_tags(){
  # remove stray numeric chips, then add given tags one-by-one.
  # note が受理しないタグ (例: ハイフンを含む #e-Stat) は入力欄に残る。
  # 毎回 input を空にしてから入力し、未確定値も次のタグへ持ち越さない。
  BU state 2>&1 > /tmp/ns.txt
  for d in $(grep -B1 'aria-label=削除' /tmp/ns.txt | grep -oE '\[[0-9]+\]<span role=img aria-label=削除' | grep -oE '[0-9]+'); do :; done
  # delete chips that look like #<number>
  local guard=0
  while :; do
    BU state 2>&1 > /tmp/ns.txt
    local BADLINE=$(grep -nE '^\t+#[0-9]+$' /tmp/ns.txt | head -1 | cut -d: -f1)
    [ -z "$BADLINE" ] && break
    local DELIDX=$(sed -n "$((BADLINE+1))p" /tmp/ns.txt | grep -oE '\[[0-9]+\]' | grep -oE '[0-9]+' | head -1)
    [ -z "$DELIDX" ] && break
    BU click "$DELIDX" >/dev/null 2>&1; sleep 0.7
    guard=$((guard+1)); [ "$guard" -gt 6 ] && break
  done
  local added=0 skipped=0
  for tag in $1; do
    BU eval "(()=>{const i=document.querySelector('input[placeholder=\"ハッシュタグを追加する\"]');if(!i)return 'not-found';const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}));i.focus();return 'ready'})()" >/dev/null 2>&1
    BU type "$tag" >/dev/null 2>&1; sleep 0.35
    BU keys Enter >/dev/null 2>&1; sleep 0.55
    local LEFT
    LEFT=$(BU eval "(()=>{const i=document.querySelector('input[placeholder=\"ハッシュタグを追加する\"]');if(!i)return 'missing';const v=i.value;if(v){const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}));}return v})()" 2>&1 | sed -n 's/^result: //p' | head -1)
    if [ -n "$LEFT" ]; then skipped=$((skipped+1)); else added=$((added+1)); fi
  done
  echo "  tags added=$added skipped=$skipped"
}
new_post_magazine(){
  local MAG="$1"
  BU state 2>&1 > /tmp/ns.txt
  local MA=$(grep -oE "\[[0-9]+\]<button id=item-magazine-add" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  BU click "$MA" >/dev/null 2>&1; sleep 2; BU state 2>&1 > /tmp/ns.txt
  local HL=$(grep -nF "$MAG" /tmp/ns.txt | head -1 | cut -d: -f1)
  [ -z "$HL" ] && { echo "  [WARN] magazine not found: $MAG"; return 1; }
  local ADDIDX=$(awk -v h="$HL" 'NR>h && /追加$/{getline x; if(0){} match(prev,/\[[0-9]+\]/); } NR==h{found=1} found && /\[[0-9]+\]<button/{btn=$0} found && /^\t+追加$/{match(btn,/\[[0-9]+\]/); print substr(btn,RSTART+1,RLENGTH-2); exit} {prev=$0}' /tmp/ns.txt)
  [ -z "$ADDIDX" ] && { echo "  [WARN] magazine add button not found"; return 1; }
  BU click "$ADDIDX" >/dev/null 2>&1; sleep 1.5
  echo "  magazine: $MAG (btn=$ADDIDX)"
}
