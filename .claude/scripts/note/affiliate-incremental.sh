# note 公開済み記事に「アフィリエイトブロックのみ」を増分挿入する（既存コンテンツ・画像を壊さない）。
# 全クリア→再ペースト方式(process_article)は画像を取りこぼすため、公開済み記事の追記にはこちらを使う。
#   source .claude/scripts/note/affiliate-incremental.sh
#   insert_affiliate <noteId> <slug>     # まとめ直前(or fallback)にPR文+バナー画像+a8リンクを挿入→screenshot
#   publish_update <slug>                # 公開に進む→更新する→state記録
# 前提: export PATH="$HOME/.browser-use-env/bin:$PATH"

BU(){ browser-use --headed --profile "Profile 5" "$@"; }
AFF_PNG="/Users/minamidaisuke/stats47/.claude/assets/affiliate-banners/ai_agent_camp.png"
AFF_URL="https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75"

# 記事間の遷移で出る「このページを離れますか？(変更が保存されていない可能性)」ダイアログ抑止。
# 現在開いている note エディタの beforeunload を無効化してから次の URL へ遷移する。
# これが無いと記事ごとに確認ダイアログが出てバッチが止まる(ユーザー報告 2026-06-22)。
# note の beforeunload を無効化する。capture フェーズで先回りして note のリスナを止め、
# returnValue を消す。※ beforeunload で preventDefault() を呼ぶと逆にダイアログが出るので呼ばない。
_suppress_unload(){
  BU eval "(function(){try{window.onbeforeunload=null;window.addEventListener('beforeunload',function(e){e.stopImmediatePropagation();delete e['returnValue'];e.returnValue=undefined;},true);}catch(_){};return 'ok';})();" >/dev/null 2>&1
}
# 全ネイティブダイアログ(confirm/alert/beforeunload)を現ページで自動承認する。
# ★無料記事の「更新する」で出る confirm「全文が無料で表示される設定…公開してよろしいですか？」が
#   CDP をブロックして daemon を固める真因(2026-06-23特定)。window.confirm を true 固定で出さなくする。
#   ※「公開に進む」で /publish/ へ遷移し JS context がリセットされるため、遷移後に呼ぶこと。
_suppress_dialogs(){
  BU eval "(function(){try{window.confirm=function(){return true;};window.alert=function(){};window.onbeforeunload=null;}catch(_){};return 'ok';})();" >/dev/null 2>&1
}
# beforeunload を抑止してから open する遷移ラッパー(全ての記事遷移はこれを使う)。
# browser-use は CDP 経由・各 CLI 呼び出しは別プロセスのため CDP ダイアログ handler は持続しない。
# よって「ページの JS 状態を書き換える eval 抑止」が唯一持続する有効策(遷移直前に現ページへ適用)。
BU_open(){ _suppress_unload; BU open "$1"; }
# 互換: バッチドライバが呼ぶスタブ(実体の抑止は BU_open 内の _suppress_unload が担う)。
_install_dialog_autoaccept(){ echo "via _suppress_unload (eval, per-navigation)"; }

# バナー画像を「ネイティブのファイル選択ダイアログを開かずに」アップロードする(★堅牢化 2026-06-23)。
# 原因: 「画像」ボタンのクリックが input.click() を呼び OS のファイル選択ダイアログを開く。これは
#   ページ JS では抑止できず、残存すると次記事の自動化を完全にブロックしていた(ユーザー報告のジャム)。
# 対策: CDP Page.setInterceptFileChooserDialog(enabled=true) でファイル選択をインターセプト
#   → 「画像」をクリックしても OS ピッカーは開かず Page.fileChooserOpened が発火 → DOM.setFileInputFiles
#   で backendNodeId にファイルを直接セット。全工程を1つの python 呼び出し内で完結させる。
# 前提: 事前に +menu を開いて「画像」ボタンが可視であること。
_upload_banner_cdp(){
  BU python "
import asyncio
PNG='$AFF_PNG'
async def _find_input(cc, sid):
    doc = await cc.send.DOM.getDocument(params={'depth': -1, 'pierce': True}, session_id=sid)
    root = doc['root']['nodeId']
    res = await cc.send.DOM.querySelector(params={'nodeId': root, 'selector': 'input#note-editor-image-upload-input, input[id*=image-upload], input[type=file]'}, session_id=sid)
    return res.get('nodeId') or 0
async def _up():
    cdp = await browser._session.get_or_create_cdp_session(target_id=None, focus=False)
    cc, sid = cdp.cdp_client, cdp.session_id
    await cc.send.Page.enable(session_id=sid)
    await cc.send.DOM.enable(session_id=sid)
    # ネイティブピッカーを開かせない保険(画像クリックが走っても OS ダイアログは出ない)
    try: await cc.send.Page.setInterceptFileChooserDialog(params={'enabled': True}, session_id=sid)
    except Exception: pass
    # 方式A: 隠しファイル入力を直接探して setFileInputFiles(クリック不要=チューザ自体が出ない)
    nid = await _find_input(cc, sid)
    if not nid:
        # 方式B: 入力が未生成なら「画像」をクリックして生成→再探索(ピッカーはインターセプト済)
        await cc.send.Runtime.evaluate(params={'expression': \"(function(){var b=[].slice.call(document.querySelectorAll('button,[role=button],span,div')).find(function(x){return x.offsetParent&&x.textContent&&x.textContent.trim()==='画像'});if(b){b.click();return 1}return 0})()\", 'returnByValue': True}, session_id=sid)
        await asyncio.sleep(1.5)
        nid = await _find_input(cc, sid)
    if not nid:
        try: await cc.send.Page.setInterceptFileChooserDialog(params={'enabled': False}, session_id=sid)
        except Exception: pass
        return 'no-input'
    await cc.send.DOM.setFileInputFiles(params={'files': [PNG], 'nodeId': nid}, session_id=sid)
    try: await cc.send.Page.setInterceptFileChooserDialog(params={'enabled': False}, session_id=sid)
    except Exception: pass
    return 'uploaded'
print(browser._run(_up()))
" 2>&1 | grep -oiE "uploaded|no-input|Error" | head -1
}

# アフィリエイトPR文（\n\n で段落分離・💡/▶ 装飾・bold記法は付けない）
read -r -d '' AFF_TEXT << 'TXT'
💡 この記事を書いた私から、Claude Code 学習でひとつだけご紹介させてください（PR）

この記事を読んでいる方は、Claude Code を業務に取り入れようとしているか、すでに使い始めているのだと思います。

独学でも十分に使えますが、「もっと体系的に学びたい」「詰まったときにすぐサポートを受けたい」という方には、Claude Code に特化した研修プログラムも選択肢のひとつです。

このリンクから申し込んでいただくと、私に紹介料が入ります。それでもお伝えするのは、Claude Code を業務で使いこなしたいすべての方に本当に役立つと思っているからです。

▶ Claude Code 特化研修「AI Agent Camp」の詳細はこちら（無料相談あり）
TXT

# まとめ見出しの開始にカーソルを置き、Enter→ArrowUp で直前に空段落を作る。
# まとめが無ければ「関連記事 / 次に読む」を、それも無ければ最後のマガジン埋め込み/末尾を試す。
# 戻り値(stdout): positioned | no-anchor
_position_before_anchor(){
  BU eval "(function(){const e=document.querySelector('[contenteditable=true]');if(!e)return 'no-editor';
    const heads=[...e.querySelectorAll('h1,h2,h3,h4')];
    let anchor=heads.find(h=>h.innerText.trim()==='まとめ')
      ||heads.find(h=>h.innerText.includes('まとめ'))
      ||heads.find(h=>h.innerText.includes('関連記事'))
      ||heads.find(h=>h.innerText.includes('次に読む'));
    if(!anchor)return 'no-anchor';
    anchor.scrollIntoView({block:'center'});
    const tn=anchor.firstChild||anchor;const r=document.createRange();r.setStart(tn,0);r.collapse(true);
    const s=window.getSelection();s.removeAllRanges();s.addRange(r);e.focus();return 'at-anchor';})();" 2>&1 | grep -oiE "at-anchor|no-anchor|no-editor" | head -1
}

insert_affiliate(){
  local NOTEID="$1" SLUG="$2"
  local EDURL="https://editor.note.com/notes/$NOTEID/edit"
  # contenteditable が描画されるまで待つ。daemon 再起動直後は editor.note.com が login へ
  # リダイレクトすることがある(redirectPath 経由で戻る)ので、login に居たら再オープンする。
  local loaded=no
  BU_open "$EDURL" >/dev/null 2>&1; sleep 8
  for i in 1 2 3 4 5 6 7 8; do
    BU state > /tmp/ns.txt 2>&1
    if grep -qE "contenteditable=true role=textbox" /tmp/ns.txt; then loaded=yes; break; fi
    # login にリダイレクトされていたら再オープン(セッションは有効なので redirectPath で戻る)
    local cur=$(BU eval "window.location.href" 2>&1 | tail -1)
    if echo "$cur" | grep -q "/login"; then BU open "$EDURL" >/dev/null 2>&1; fi
    sleep 5
  done
  if [ "$loaded" != "yes" ]; then echo "  [FAIL] editor not loaded: $SLUG"; return 1; fi
  # 冪等性: a8リンク OR PR文テキスト("申し込んでいただく" OR "AI Agent Camp")が既にあればスキップ
  local HASA8=$(BU eval "(function(){const e=document.querySelector('[contenteditable=true]');if(!e)return 'no';const hasLink=[...e.querySelectorAll('a')].some(a=>a.href&&a.href.includes('a8.net'));const hasTxt=e.innerText.includes('申し込んでいただく')||e.innerText.includes('AI Agent Camp');return (hasLink||hasTxt)?'yes':'no';})();" 2>&1 | grep -oiE "yes|no" | head -1)
  if [ "$HASA8" = "yes" ]; then echo "  [SKIP] $SLUG already has a8 link"; return 0; fi
  # 全ブロックをレンダリングさせる
  BU eval "window.scrollTo(0,document.body.scrollHeight);'b'" >/dev/null 2>&1; sleep 1
  BU eval "window.scrollTo(0,0);'t'" >/dev/null 2>&1; sleep 1
  # 位置決め
  local POS=$(_position_before_anchor)
  if [ "$POS" != "at-anchor" ]; then echo "  [WARN] anchor not found ($POS): $SLUG — needs special handling"; return 2; fi
  BU keys Enter >/dev/null 2>&1; sleep 0.5
  BU keys ArrowUp >/dev/null 2>&1; sleep 0.5
  # PR文をペースト（\n\n で段落分離）。多言語文字列は一時ファイル経由で encodeURIComponent（インライン渡しは壊れる）
  printf '%s' "$AFF_TEXT" > /tmp/aff-text.txt
  local ENC=$(node -e "process.stdout.write(encodeURIComponent(require('fs').readFileSync('/tmp/aff-text.txt','utf8')))")
  local R=$(BU eval "(function(){const e=document.querySelector('[contenteditable=true]');e.focus();const txt=decodeURIComponent('$ENC');const dt=new DataTransfer();dt.setData('text/plain',txt);e.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));return 'pasted '+txt.length;})();" 2>&1 | grep -oiE "pasted [0-9]+")
  echo "  [TEXT] $SLUG: $R"
  sleep 2
  # バナー挿入: CTA段落(詳細はこちら)の末尾にカーソル→Enter→空段落→+menu→画像
  BU eval "(function(){const e=document.querySelector('[contenteditable=true]');const cta=[...e.children].find(el=>el.innerText.includes('詳細はこちら'));if(!cta)return 'no-cta';cta.scrollIntoView({block:'center'});const r=document.createRange();r.selectNodeContents(cta);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);e.focus();return 'cta-end';})();" >/dev/null 2>&1
  sleep 0.5
  BU keys Enter >/dev/null 2>&1; sleep 0.8
  BU state > /tmp/ns.txt 2>&1
  local MENU=$(grep -oE "\[[0-9]+\]<button aria-label=メニューを開く" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  if [ -z "$MENU" ]; then echo "  [WARN] +menu not found for banner: $SLUG"; return 3; fi
  BU click "$MENU" >/dev/null 2>&1; sleep 1
  # 「画像」クリック→OSファイル選択を CDP でインターセプトしてピッカーを開かずにアップロード
  local UPRES=$(_upload_banner_cdp)
  echo "  [UPLOAD] $SLUG: $UPRES"
  if [ "$UPRES" != "uploaded" ]; then echo "  [WARN] banner upload failed ($UPRES): $SLUG"; fi
  sleep 5
  # リンク設定: バナーfigureを選択→ツールバー aria-label=リンク→textarea(placeholder=https://)→「適用」
  # (実機確認2026-06-22: 画像選択時ツールバーは aria-label=リンク。"リンクを設定"はテキスト選択時の別UI)
  BU state > /tmp/ns.txt 2>&1
  local LAST_FIG=$(grep -oE "\[[0-9]+\]<figure" /tmp/ns.txt | tail -1 | grep -oE "[0-9]+" | head -1)
  [ -n "$LAST_FIG" ] && BU click "$LAST_FIG" >/dev/null 2>&1 && sleep 1.2
  BU state > /tmp/ns.txt 2>&1
  local LINK_BTN=$(grep -oE "\[[0-9]+\]<button aria-label=リンク " /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  if [ -z "$LINK_BTN" ]; then
    [ -n "$LAST_FIG" ] && BU click "$LAST_FIG" >/dev/null 2>&1 && sleep 1.2
    BU state > /tmp/ns.txt 2>&1
    LINK_BTN=$(grep -oE "\[[0-9]+\]<button aria-label=リンク " /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
  fi
  if [ -z "$LINK_BTN" ]; then
    echo "  [WARN] link button not found: $SLUG (banner without link)"
  else
    BU click "$LINK_BTN" >/dev/null 2>&1; sleep 1.2
    BU state > /tmp/ns.txt 2>&1
    local URLBOX=$(grep -oE "\[[0-9]+\]<textarea[^>]*placeholder=https" /tmp/ns.txt | grep -oE "[0-9]+" | head -1)
    [ -n "$URLBOX" ] && BU click "$URLBOX" >/dev/null 2>&1 && sleep 0.4
    BU type "$AFF_URL" >/dev/null 2>&1; sleep 0.5
    BU state > /tmp/ns.txt 2>&1
    local APPLY=$(awk '/^\t*適用\s*$/{print prev} {prev=$0}' /tmp/ns.txt | grep -oE "\[[0-9]+\]" | grep -oE "[0-9]+" | tail -1)
    if [ -n "$APPLY" ]; then BU click "$APPLY" >/dev/null 2>&1; sleep 1; echo "  [LINK] $SLUG banner -> a8"
    else BU keys Enter >/dev/null 2>&1; sleep 1; echo "  [LINK?] $SLUG Enter fallback"; fi
  fi
  sleep 1
  # 検証
  local V=$(BU eval "(function(){const e=document.querySelector('[contenteditable=true]');const a8=[...e.querySelectorAll('a')].filter(a=>a.href.includes('a8.net'));const figWithLink=[...e.querySelectorAll('figure')].some(f=>{const a=f.querySelector('a')||f.closest('a');return a&&a.href.includes('a8.net');});return JSON.stringify({a8:a8.length,bannerLinked:figWithLink});})();" 2>&1 | tail -1)
  echo "  [VERIFY] $SLUG $V"
  BU screenshot "/tmp/note-aff-$SLUG.png" >/dev/null 2>&1
  echo "  [SHOT] /tmp/note-aff-$SLUG.png"
}

# click helper: 可視ボタンを innerText 完全一致でクリック（eval ベース・state パースより堅牢）
_click_btn(){
  BU eval "(function(){const t='$1';const b=[...document.querySelectorAll('button')].find(b=>b.offsetParent!==null&&b.innerText.trim()===t);if(!b)return 'nf';b.scrollIntoView({block:'center'});b.click();return 'ok';})();" 2>&1 | grep -oiE "ok|nf" | head -1
}
_has_btn(){
  BU eval "(function(){const t='$1';return [...document.querySelectorAll('button')].some(b=>b.offsetParent!==null&&b.innerText.trim()===t)?'yes':'no';})();" 2>&1 | grep -oiE "yes|no" | head -1
}

# 公開済み記事を「更新する」で再公開（既存の有料ライン/価格は保持される）。
# 無料: 公開に進む→試し読みエリアを設定→末尾ライン→更新する
# 有料: 公開に進む→(価格/ライン保持)→更新する  ※更新する直行 or 有料エリア設定経由
publish_update(){
  local SLUG="$1"
  # 自動保存(保存中)の完了を待つ
  for i in 1 2 3 4 5 6; do
    local sv=$(BU eval "(function(){return [...document.querySelectorAll('button')].some(b=>b.innerText.trim()==='保存中')?'saving':'idle';})();" 2>&1 | grep -oiE "saving|idle" | head -1)
    [ "$sv" = "idle" ] && break
    sleep 2
  done
  # 公開に進む → 公開設定に遷移するまでリトライ
  local nav=no
  for i in 1 2 3; do
    _click_btn '公開に進む' >/dev/null; sleep 3
    if [ "$(_has_btn '更新する')" = "yes" ] || [ "$(_has_btn '試し読みエリアを設定')" = "yes" ] || [ "$(_has_btn '有料エリア設定')" = "yes" ]; then nav=yes; break; fi
    sleep 2
  done
  # /publish/ へ遷移後、ネイティブ confirm/alert を無効化(無料記事の「公開してよろしいですか？」が
  # CDP をブロックして固まるのを防ぐ)。遷移で context がリセットされるのでここで注入する。
  _suppress_dialogs
  if [ "$nav" != "yes" ]; then
    echo "  [FAIL] 公開設定 not reached: $SLUG"
    BU eval "(function(){return JSON.stringify([...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null&&b.innerText.trim()).map(b=>b.innerText.trim()).slice(0,15));})();" 2>&1 | tail -1
    return 1
  fi
  # 更新する が直接あれば押す（有料記事で価格/ライン保持済の場合）
  if [ "$(_has_btn '更新する')" = "yes" ]; then
    _click_btn '更新する' >/dev/null; sleep 6
  elif [ "$(_has_btn '試し読みエリアを設定')" = "yes" ]; then
    # 無料記事フロー: 「試し読みエリアを設定」を押すと「更新する」が出現する。
    # ※ ライン位置は既定のまま触らない(全文無料は元の境界が保持される)。
    #    旧実装は「ラインをこの場所に変更」を挟んでいたが、それが原因で更新するを取りこぼしていた
    #    (2026-06-23 修正: 直接 更新する を押すと公開成功・ライブに反映を確認)。
    _click_btn '試し読みエリアを設定' >/dev/null; sleep 3
    local upd=no
    for k in 1 2 3; do
      if [ "$(_click_btn '更新する')" = "ok" ]; then upd=yes; break; fi
      sleep 2
    done
    if [ "$upd" != "yes" ]; then echo "  [FAIL] 更新する(無料) not found: $SLUG"; return 1; fi
    sleep 6
  elif [ "$(_has_btn '有料エリア設定')" = "yes" ]; then
    # 有料記事フロー: 有料エリア設定→ラインは動かさず(既存境界保持)→更新する
    # アフィリエイトは無料部(まとめ前)に挿入済みで有料ライン要素には触れていないため、ライン位置は不変。
    _click_btn '有料エリア設定' >/dev/null; sleep 3
    if [ "$(_click_btn '更新する')" != "ok" ]; then echo "  [FAIL] 更新する(有料) not found: $SLUG"; return 1; fi
    sleep 6
  else
    echo "  [FAIL] no update/preview button: $SLUG"
    BU eval "(function(){return JSON.stringify([...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null&&b.innerText.trim()).map(b=>b.innerText.trim()).slice(0,15));})();" 2>&1 | tail -1
    return 1
  fi
  # 「この記事が更新されたことを購入・購読したユーザーに通知しますか？」モーダルが出たら いいえ(通知しない)。
  # 主に有料記事の 更新する 後に出る。これを押さないと公開が完了せずライブに反映されない(ユーザー方針: いいえ)。
  for k in 1 2 3 4 5; do
    if [ "$(_has_btn 'いいえ')" = "yes" ]; then _click_btn 'いいえ' >/dev/null; sleep 4; break; fi
    sleep 1.5
  done
  sleep 2
  BU state > /tmp/ps.txt 2>&1
  if grep -qE "記事が公開されました|シェア|おめでとう|更新しました|公開しました" /tmp/ps.txt; then
    echo "  [PUBLISHED] $SLUG"; return 0
  else
    echo "  [?] $SLUG — publish modal unconfirmed (要ライブ確認)"; grep -nE "エラー|error|必須" /tmp/ps.txt | head -3; return 1
  fi
}
