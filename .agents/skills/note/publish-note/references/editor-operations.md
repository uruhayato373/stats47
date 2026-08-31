# エディタ操作の詳細手順

> このファイルは `publish-note` スキルの詳細手順です。概要は [SKILL.md](../SKILL.md) を参照。

## Phase 0: データ読み込み（Node.js スクリプト）

引数をパースした後、各 slug について以下の Node.js スクリプトを `/tmp/note-prepare-<slug>.js` に書き出して実行する。

```javascript
// /tmp/note-prepare-<slug>.js
const fs = require('fs');
const path = require('path');

const slug = '<SLUG>';
const projectRoot = '/Users/minamidaisuke/stats47';

// 探索: 31_note記事原稿（下書き〜公開済みを単一管理）の <slug> 直下および <vertical>/<slug>。
// 本文ファイル名は draft.md に統一済。note.md は後方互換のフォールバックとして残す。
const baseDirs = [];
for (const root of ['docs/31_note記事原稿']) {
  const rootAbs = path.join(projectRoot, root);
  baseDirs.push(path.join(rootAbs, slug));
  if (fs.existsSync(rootAbs)) {
    for (const v of fs.readdirSync(rootAbs)) {
      const vDir = path.join(rootAbs, v, slug);
      if (fs.existsSync(vDir)) baseDirs.push(vDir);
    }
  }
}

let articleDir = null;
let articleFile = null;
outer: for (const d of baseDirs) {
  for (const f of ['draft.md', 'note.md']) {
    if (fs.existsSync(path.join(d, f))) {
      articleDir = d;
      articleFile = f;
      break outer;
    }
  }
}
if (!articleDir) { console.error('ERROR: note.md / draft.md not found for ' + slug); process.exit(1); }

const raw = fs.readFileSync(path.join(articleDir, articleFile), 'utf8');

// frontmatter 解析 (quote 任意)
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
const fm = fmMatch?.[1] ?? '';
const fmField = (key) => {
  const m = fm.match(new RegExp('^' + key + ':\\s*(?:"(.+?)"|\'(.+?)\'|(.+?))\\s*$', 'm'));
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : '';
};
const title = fmField('title');
const isPaid = fmField('is_paid') === 'true';
const priceJpy = parseInt(fmField('price_jpy') || '0', 10);

// 本文準備
let body = raw.replace(/^---\n[\s\S]*?\n---\n*/, '');
// HTML コメントをすべて除去（<!-- SVG: ... --> / <!-- note投稿時 --> / <!-- circulation-footer --> 等）。
// 残すと note 上に可視テキストとして混入する。
body = body.replace(/<!--[\s\S]*?-->\n?/g, '');
body = body.replace(/!\[.*?\]\(.*?\)\n?/g, '');
body = body.replace(/^---$/gm, '');
body = body.replace(/\n*^##\s*公開時にコピーするハッシュタグ[\s\S]*$/m, '');
// 先頭の `# H1` を除去（note ではタイトル欄に入れるため。残すと本文に H1 が重複する）
body = body.replace(/^#\s+.*\n+/, '');
body = body.trim();

// 有料境界 ("ここから先は有料部分") で free / paid 分割
let bodyFree = body;
let bodyPaid = '';
if (isPaid) {
  const splitRe = /^ここから先は有料部分[:：][^\n]*$/m;
  const splitMatch = body.match(splitRe);
  if (splitMatch) {
    const idx = body.indexOf(splitMatch[0]);
    bodyFree = body.substring(0, idx).replace(/\n*---\s*\n*$/, '').trim();
    bodyPaid = body.substring(idx + splitMatch[0].length).trim();
  }
}
// 分割後、フルボディからも有料境界マーカー行を除去する。
// どのセグメント（segments / segmentsFree / segmentsPaid）にもマーカー行を残さない。
body = body.replace(/^ここから先は有料部分[:：][^\n]*$\n?/m, '').trim();

// セグメント分割 (URL vs テキスト)
function splitSegments(text) {
  const lines = text.split('\n');
  const segs = [];
  let buf = [];
  for (const line of lines) {
    if (/^https?:\/\/\S+$/.test(line.trim())) {
      if (buf.length > 0) { segs.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      segs.push({ type: 'url', content: line.trim() });
    } else { buf.push(line); }
  }
  if (buf.length > 0) segs.push({ type: 'text', content: buf.join('\n') });
  return segs;
}

const segments = splitSegments(body);                       // 全文 (paste 用)
const segmentsFree = isPaid ? splitSegments(bodyFree) : segments;
const segmentsPaid = isPaid ? splitSegments(bodyPaid) : [];

// タグファイル: hashtags.txt を優先し、無ければ tags.txt
const tagsPath = fs.existsSync(path.join(articleDir, 'hashtags.txt'))
  ? path.join(articleDir, 'hashtags.txt')
  : path.join(articleDir, 'tags.txt');
const tags = fs.existsSync(tagsPath)
  ? fs.readFileSync(tagsPath, 'utf8').trim().split('\n').map(s => s.trim()).filter(Boolean).slice(0, 50)
  : [];

// 画像ファイルの検出
const imagesDir = path.join(articleDir, 'images');
const images = { eyecatch: null, choropleth: null, chart: null, boxplot: null };
if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir);
  images.eyecatch = files.find(f => f.startsWith('cover-')) || null;
  images.choropleth = files.find(f => f.startsWith('choropleth-map-')) || null;
  images.chart = files.find(f => f.startsWith('chart-x-')) || null;
  images.boxplot = files.find(f => f.startsWith('boxplot-')) || null;
}

// 出力
const result = {
  slug,
  articleDir,
  articleFile,
  title,
  isPaid,
  priceJpy,
  segments,
  segmentsFree,
  segmentsPaid,
  tags,
  images,
  segmentCount: segments.length,
  freeSegmentCount: segmentsFree.length,
  paidSegmentCount: segmentsPaid.length,
  urlCount: segments.filter(s => s.type === 'url').length,
};

fs.writeFileSync('/tmp/note-data-' + slug + '.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  slug,
  title: title.substring(0, 50),
  isPaid,
  priceJpy,
  segments: segments.length,
  freeSegments: segmentsFree.length,
  paidSegments: segmentsPaid.length,
  urls: segments.filter(s => s.type === 'url').length,
  tags: tags.length,
  images: Object.entries(images).filter(([,v]) => v).map(([k]) => k),
}));
```

実行:
```bash
node /tmp/note-prepare-<slug>.js
```

## Phase 1: ブラウザ起動 & エディタ表示

```bash
browser-use --headed --profile "Profile 5" open "https://editor.note.com/new"
sleep 4
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
```

`/tmp/note-state.txt` に `contenteditable=true` が含まれていればログイン済み。含まれていなければ「ログイン」等を確認。

**未ログイン時は停止**: `echo "ERROR: not logged in to note.com"` で停止し、手動ログインを案内する。

## Phase 2: アイキャッチ画像（※必ず本文入力前に実行）

**エディタ初期状態で「画像を追加」ボタンが確実に見える。** 本文入力後はスクロール位置がずれてボタン検出に失敗する。Phase 1 の state で `aria-label=画像を追加` のインデックスを同時に取得して使う。

```bash
# Phase 1 の state から取得済みの IMG_BTN を使用
ADD_IMG_IDX=$(grep -oE '\[[0-9]+\]<button aria-label=画像を追加' /tmp/note-state.txt | grep -oE '[0-9]+')
browser-use --headed --profile "Profile 5" click $ADD_IMG_IDX
sleep 2

browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
UPLOAD_IDX=$(grep -B1 '画像をアップロード' /tmp/note-state.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
browser-use --headed --profile "Profile 5" click $UPLOAD_IDX
sleep 2

browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
FILE_IDX=$(grep -oE '\[[0-9]+\]<input id=note-editor-eyecatch-input' /tmp/note-state.txt | grep -oE '[0-9]+')
browser-use --headed --profile "Profile 5" upload $FILE_IDX <articleDir>/images/cover-1280x670.png
sleep 3

# トリミングダイアログの「保存」ボタン（「下書き保存」と区別）
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
SAVE_IDX=$(grep -B1 '	保存$' /tmp/note-state.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
browser-use --headed --profile "Profile 5" click $SAVE_IDX
sleep 3
```

画像ファイルが存在しない場合はこの Phase をスキップする。

### Phase 2-edit: 既存アイキャッチの差し替え（`--update` 時）

新規投稿と違い、更新時は**既存カバーを削除してから**追加する。2026-07-10 の一括更新で確立
（memory `project_note_update_mode_learnings`）。

```bash
# 1. 既存カバーの「削除」を押す（button の子 span に aria-label=削除）
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
DEL_IDX=$(grep -oE '\[[0-9]+\]<span aria-label=削除' /tmp/note-state.txt | grep -oE '[0-9]+' | head -1)
browser-use --headed --profile "Profile 5" click $DEL_IDX; sleep 2
# 2. 以降は Phase 2 と同じ: 画像を追加 → 画像をアップロード →
#    input#note-editor-eyecatch-input に upload → トリミング「保存」
```

## Phase 3: タイトル入力

```bash
# アイキャッチ設定後に state を再取得（インデックスが変わっている）
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
TITLE_IDX=$(grep -oE '\[[0-9]+\]<textarea placeholder=記事タイトル' /tmp/note-state.txt | grep -oE '[0-9]+')
BODY_IDX=$(grep -oE '\[[0-9]+\]<div contenteditable=true role=textbox' /tmp/note-state.txt | grep -oE '[0-9]+')
browser-use --headed --profile "Profile 5" click $TITLE_IDX
browser-use --headed --profile "Profile 5" type "<タイトルテキスト>"
```

## Phase 4: 本文入力（一括 paste 方式）

**確定原則**（2026-04-25 検証）:
- ClipboardEvent paste は **同一エディタで 1 回しか機能しない**（2 回目以降の eval は `result: None` で失敗）
- `type` コマンドは note エディタの markdown shortcut（`##` / `###` / `**bold**`）を **発動しない** → literal 文字列として残る

→ 最善策は **「全セグメントを 1 つの markdown 文字列に連結 → 1 回だけ ClipboardEvent paste」**。
これにより H2 / H3 / 太字すべて正しく変換される。トレードオフ: URL は plain text のまま貼られて OGP カード化しない。

### 4-1. 本文エリアにフォーカス

```bash
BODY_IDX=$(find_idx "contenteditable=true role=textbox")
browser-use --headed --profile "Profile 5" click $BODY_IDX
```

### 4-2. 全本文を 1 回 paste

```bash
# 全セグメントを連結して /tmp/note-body-<slug>.txt に保存
node -e "
const data = JSON.parse(require('fs').readFileSync('/tmp/note-data-<slug>.json','utf8'));
const body = data.segments
  .map(s => s.type === 'url' ? '\n\n' + s.content + '\n\n' : s.content)
  .join('')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
require('fs').writeFileSync('/tmp/note-body-<slug>.txt', body);
"

# 本文をブラウザ側グローバル window.__nb にチャンク分割注入してから paste 発火。
# 【重要】本文全文を 1 回の eval で渡すと、本文が大きい記事 (おおむね 5KB 超) で
# browser-use daemon のペイロード上限に達しタイムアウトする (2026-05-20 #00 試験公開で発生)。
# eval 1 回あたり encodeURIComponent 後で 4KB 以内に収める。日本語は 1 文字が encode 後
# 約 9 バイトになるため、ソース 1 チャンク = 約 400 字 が安全な目安。
browser-use --headed --profile "Profile 5" eval "window.__nb='';'init'"

BODYLEN=$(node -e "process.stdout.write(String([...require('fs').readFileSync('/tmp/note-body-<slug>.txt','utf8')].length))")
OFFSET=0
while [ "$OFFSET" -lt "$BODYLEN" ]; do
  # encodeURIComponent は `'` を変換しないため、eval の JS 文字列リテラルが破断する。
  # `'` を %27 に明示置換する（decodeURIComponent が復元する）。
  CHUNK=$(node -e "const b=[...require('fs').readFileSync('/tmp/note-body-<slug>.txt','utf8')]; process.stdout.write(encodeURIComponent(b.slice($OFFSET,$OFFSET+400).join('')).replace(/'/g,'%27'))")
  browser-use --headed --profile "Profile 5" eval "window.__nb+=decodeURIComponent('$CHUNK');String(window.__nb.length)"
  OFFSET=$((OFFSET + 400))
done

# 全チャンク注入後、小さい eval で ClipboardEvent paste を発火
browser-use --headed --profile "Profile 5" eval "
  const editor = document.querySelector('[contenteditable=true]');
  if (editor) {
    editor.focus();
    const dt = new DataTransfer();
    dt.setData('text/plain', window.__nb);
    editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    const n = window.__nb.length;
    delete window.__nb;
    'pasted ' + n + ' chars';
  } else { 'editor not found'; }
"
sleep 3
```

### 4-3. URL カード化（自動）

一括 paste 直後、URL は plain text の独立行になっている。これを OGP リンクカードへ変換する手順を
**自動化する**（手動レシピ「各 URL 行を行末クリック → Enter → 4 秒待ち」を browser-use で再現）。

> **動作の根拠**: note エディタは「bare URL のみの行」でキャレットが行末にあるとき Enter で
> その行を OGP カードへ変換する（doboku-note / stats47 両方で手動確認済みの挙動）。本実装はその
> 既知手順を eval(Selection API) + 実 Enter キーで自動再現する。**初回 live 実行で 1 記事を検証**し、
> カード化されない場合は下の「カード化フォールバック」を使う。

```bash
URL_COUNT=$(jq -r '.urlCount' /tmp/note-data-<slug>.json)
if [ "${URL_COUNT:-0}" -gt 0 ]; then
  jq -r '.segments[] | select(.type=="url") | .content' /tmp/note-data-<slug>.json > /tmp/note-urls-<slug>.txt

  while IFS= read -r url; do
    [ -z "$url" ] && continue
    # encodeURIComponent 相当: ' を %27 に逃がす（eval の JS 文字列破断回避）
    ESC_URL=$(printf '%s' "$url" | sed "s/'/%27/g")

    # (a) 当該 URL 行の text node を発見し、キャレットを行末へ置く
    browser-use --headed --profile "Profile 5" eval "
      (function(){
        const target = decodeURIComponent('$ESC_URL');
        const editor = document.querySelector('[contenteditable=true]');
        if (!editor) return 'no-editor';
        let node = null;
        const w = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let t; while ((t = w.nextNode())) {
          if (t.textContent && t.textContent.trim() === target) { node = t; break; }
        }
        if (!node) return 'url-not-found';
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);                 // 行末へ collapse
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        (node.parentElement || editor).scrollIntoView({block:'center'});
        editor.focus();
        return 'caret-set:' + target.slice(0,40);
      })();
    "
    # (b) 実 Enter キーを送出 → note の URL→card 変換をトリガ
    browser-use --headed --profile "Profile 5" keys Enter
    # (c) カード変換待機（必須・4 秒未満だと次操作でレイアウトが壊れる）
    sleep 4
  done < /tmp/note-urls-<slug>.txt

  # (d) 変換確認: 埋め込みカード要素の数を数える（0 のままならフォールバックへ）
  browser-use --headed --profile "Profile 5" eval "
    const e=document.querySelector('[contenteditable=true]');
    const cards=e?e.querySelectorAll('figure, iframe, [data-name=embed], a[contenteditable=false]').length:0;
    'cards:'+cards;
  "
fi
```

**カード化フォールバック**（自動で変換されない URL があった場合）: その URL 行を `click` で選択 →
`keys End` で行末 → `keys Enter` → `sleep 4` を個別に実行する。それでも変換されなければ手動仕上げに切替え、
`/tmp/note-cardfail-<slug>.txt` に残った URL を記録してレポートする（黙って飛ばさない）。

> **要素セレクタの初回確認**: `figure / iframe / [data-name=embed]` は note の DOM 変更で変わりうる。
> 初回 live 実行時に変換後 state を `browser-use ... state` で確認し、実際のカード要素名に合わせて (d) を更新する。

---

**重要:**
- 必ず ClipboardEvent paste を使う（type は markdown 変換が効かない）
- 連続 paste は不可 → 全本文を 1 つの string に連結し、1 回だけ paste 発火する
- 本文は window.__nb にチャンク分割注入する（eval 1 回 ≤ 4KB）。一括 eval は大きい本文でタイムアウトする
- URL カード化は paste 後に Phase 4-3 で自動（行末キャレット → 実 Enter → 4 秒待機）。変換できない URL のみフォールバック/手動

## Phase 5: 挿絵の挿入

A シリーズ記事の標準画像配置（存在する画像のみ挿入）:

| 挿入先セクション | 画像ファイル |
|---|---|
| `【コロプレス地図】` | `choropleth-map-*.png` |
| `上位5：分析` | `chart-x-*.png` |
| `下位5：分析` | `chart-x-*.png`（同じ画像） |
| `地域別の傾向` | `boxplot-*.png` |

**記事の上から順に挿入する。** 各画像について:

### 5-1. 目次からセクションにジャンプ

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
TOC_IDX=$(find_idx "aria-label=目次")
browser-use --headed --profile "Profile 5" click $TOC_IDX
sleep 1
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
SEC_IDX=$(find_idx "<セクション名の一部>")
browser-use --headed --profile "Profile 5" click $SEC_IDX
sleep 1
```

### 5-2. 見出し直後に空行を作成してメニューから画像挿入

```bash
# 見出し直後の段落にカーソルを置く
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
# 見出し直後の <p> をクリック
browser-use --headed --profile "Profile 5" click <段落のindex>
browser-use --headed --profile "Profile 5" keys Home
browser-use --headed --profile "Profile 5" keys Enter
browser-use --headed --profile "Profile 5" keys Up
sleep 1

# メニューを開く → 画像を選択
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
MENU_IDX=$(find_idx "aria-label=メニューを開く")
browser-use --headed --profile "Profile 5" click $MENU_IDX
sleep 1

browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
IMG_BTN_IDX=$(grep -B1 '画像' /tmp/note-state.txt | grep '<button' | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
browser-use --headed --profile "Profile 5" click $IMG_BTN_IDX
sleep 1

browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
IMG_FILE_IDX=$(find_idx "note-editor-image-upload-input")
browser-use --headed --profile "Profile 5" upload $IMG_FILE_IDX <画像ファイルの絶対パス>
sleep 3
```

**4箇所すべてについてこの手順を繰り返す。画像ファイルが存在しないセクションはスキップ。**

## Phase 5.5: 商品ZIPの挿入（ダウンロード商品だけ）

frontmatterに次を置く。

```yaml
product_archive: ".local/geo-products/<articleKey>/<articleKey>.zip"
product_attachment_after: "商品ファイルのダウンロード"
```

`prepare-article.cjs`が`.local/geo-products/`配下のZIP、50MB以下、`is_paid:true`、見出し指定を検証する。
本文paste後、`ins_file <見出し> <ZIP絶対パス>`でその見出し直後へ添付し、state上にファイル名と
「ダウンロード」が表示されることを確認する。添付できない記事は有料設定へ進めない。

公開・更新後は所有者画面の`[embedded-service=attachment]`を数え、対象ZIPが**1件だけ**で容量も一致することを確認する。
updateで本文を全消去しても旧添付が残る場合があるため、2件あれば編集画面で旧`figure[embedded-service=attachment]`だけを削除して再更新する。非ログインHTMLにZIP名・attachment keyが無いことも確認する。

新規有料記事は次の二段階で確定する。

```bash
bash .Codex/scripts/note/publish-new-note.sh <slug> <vertical> --prepare-publish
# /tmp/note-ready-<slug>.png を目視
bash .Codex/scripts/note/publish-new-note.sh <slug> <vertical> --commit-publish
```

## Phase 6: 下書き保存

```bash
browser-use --headed --profile "Profile 5" state 2>&1 > /tmp/note-state.txt
DRAFT_IDX=$(find_idx "下書き保存")
browser-use --headed --profile "Profile 5" click $DRAFT_IDX
sleep 3
```

**予約日時 + 有料設定 が共に不要な場合は Phase 8 へスキップ。**
**有料設定または予約投稿が必要なら Phase 7 へ進む（[scheduling.md](./scheduling.md) を参照）。**

## Phase 8: 確認スクリーンショット

```bash
browser-use --headed --profile "Profile 5" screenshot /tmp/note-publish-<slug>.png
```

結果を報告（下書き保存 or 予約投稿、タイトル、タグ数、画像数、予約日時）。

## バッチ実行時: 次の記事へ

バッチの場合はブラウザを閉じずに Phase 1 に戻り、`browser-use --headed --profile "Profile 5" open "https://editor.note.com/new"` で新しいエディタを開く。

## 全記事完了後

```bash
browser-use --headed --profile "Profile 5" close
```

---

## 実機検証済 update バッチ運用メモ（2026-06-16・必読）

estat #00/#03/#08(無料) + cc#16(有料¥300) を --update で実機公開して確定した、再現性のある手順とハザード。

### 再利用スクリプト（手書きしない）
- **Phase 0**: `node .claude/scripts/note/prepare-article.cjs <slug>` → `/tmp/note-data-<slug>.json`
  （title/isPaid/priceJpy/segments/segmentsPaid/imgRefs(afterHeading付)/paidHead/pipeTable を出力）
  - 有料境界マーカーは「ここから先は有料部分:」と「ここから先は有料部分**です**:」の 2 表記が混在する。
    prepare-article.cjs の `PAID_MARK` は行全体を許容するので両方拾える（`[:：]` 必須にすると paidHead が空になる）。
  - ★**`pipeTable:true` の記事は本文に markdown 表（`\| … \|`）が残っている**。note は markdown 表を**リテラルなパイプ**（`\| 列 \| 列 \|`）で表示してしまい崩れる。データ表は **`images/table-N.png` に画像化**して `![](data/table-N.png)` で貼り、本文の markdown 表は削除する。
    - **画像化ツール（冪等）**: `node .claude/scripts/note/render-md-tables.cjs` — draft.md の markdown 表を SVG→PNG（`images/table-N.png`）に変換し本文を画像埋め込みに置換。コードフェンス内 `\|` は対象外。**公開前に走らせる**。
      ⚠️ **現状 SERIES パスが `koumuin-claude-code` 固定**で `koumuin-estat-claude-code` 等を未カバー。estat 系も処理するには SERIES を vertical 横断に一般化する必要がある（持ち越し）。
    - **持ち越し**: 2026-06-16 時点で update 済の estat 各本・cc#18・#21 の翻訳表などに markdown 表が残存（公開済みなので literal pipe 表示）。上記ツールを一般化して再実行 → `--update` で貼り直すのが是正手順。新規 cc#22 以降は table-N.png 化済で `pipeTable:false`。
- **本文ファイル**: `node .claude/scripts/note/build-body.cjs <slug>` → `/tmp/note-body-<slug>.txt`
  → これを 400 字チャンクで `window.__nb` に注入 → 1 回 ClipboardEvent paste（Phase 4-2）。
- **エディタ操作の関数ライブラリ（★update バッチの本体・2026-06-16 実機で 11 本連続成功）**:
  `source .claude/scripts/note/editor-helpers.sh` で以下が使える。
  - `process_article <slug> <noteId> <vertical>` — 本文クリア→チャンク paste→URLカード→画像再挿入→有料境界 line→`/tmp/note-publish-<slug>.png`。
  - `do_update <slug>` — 「更新する」→「記事が公開されました」確認→ `note-published-urls.json` に `updated_at` 記録。
  - `ins_img` / `paid_setline` は単体でも呼べる（screenshot は必ず目視してから `do_update`）。
  - ★実装上の確定知見: (a) 画像アンカーは **eval-scroll**（TOC 非依存。サブ見出し・コード行アンカーも拾う）。
    (b) 有料見出しの突合は **空白・バッククォート(インラインコード)・先頭 `#` を除去して比較**（エディタの textContent と
    state プレビューでバッククォート有無が食い違うため）。(c) `### ` 除去は **BSD sed の `\+` 非対応**に注意し `sed 's/^#* *//'` を使う。
    (d) 画像参照が `.svg` でも note は png/jpg のみ受けるので **同名 `.png` に置換**してアップロードする。

### update の本文クリア → 再ペースト（検証済）
1. 編集画面 `editor.note.com/notes/<noteId>/edit` を開く（noteId は note-published-urls.json の url 末尾）。
2. クリア: `selectNodeContents(contenteditable)` → `execCommand('delete')`。**タイトルは別 textarea なので無傷**（検証済）。
3. BODY_IDX = `grep -oE '\[[0-9]+\]<div contenteditable=true'` → click でフォーカス → チャンク注入 → paste。

### 画像の再挿入（確定パターン）
本文 paste で画像は剥がれるので再挿入する。位置は `imgRefs[].afterHeading`（直前見出し）を錨にする:
```bash
# 見出し名を TOC でクリック→ジャンプ→その見出し直後の段落 index を awk で取得
H=$(grep -oE '\[[0-9]+\]<div role=menuitem aria-label=<見出し>' s.txt | grep -oE '[0-9]+' | head -1)
# ジャンプ後 state を取り、見出し行の直後の最初の <p id> を取る:
P=$(awk '/<見出しテキスト>$/{f=1} f&&/<p id/{print;exit}' s2.txt | grep -oE '\[[0-9]+\]' | head -1 | tr -d '[]')
# 見出し直後に空行を作る → メニュー → 画像 → upload
click $P; keys Home; keys Enter; keys ArrowUp
MENU=$(grep -oE '\[[0-9]+\]<button aria-label=メニューを開く' m.txt | grep -oE '[0-9]+' | head -1); click $MENU
IB=$(grep -B2 -E '^\s+画像\s*$' m2.txt | grep -oE '\[[0-9]+\]' | tail -1 | tr -d '[]'); click $IB
F=$(grep -oE '\[[0-9]+\]<input[^>]*image-upload-input' m3.txt | grep -oE '[0-9]+' | head -1); upload $F <png>
sleep 4
```
- 箇条書きの後に置く場合は `click <最後の箇条書き>; keys End; keys Enter; keys Enter`（2回目 Enter でリスト脱出）。
- 見出しでなくコード行が錨の画像は、その Step 見出しに寄せて置く（位置は近ければ可）。

### 公開（update）の最終分岐 ★無料 / 有料で違う（検証済）
「公開に進む」後の設定画面の **primary ボタンで分岐**する（[scheduling.md](./scheduling.md) Phase 7-Boundary）:
- **無料記事**: ボタンが直接「**更新する**」=既存の試し読みライン（全文無料）が保持される → そのまま click で公開。
  （ボタンが「試し読みエリアを設定」の場合のみライン画面で**末尾**にラインを置く＝全文無料。）
- **有料記事**: 本文 re-paste で有料ラインがリセットされ、ボタンは「**有料エリア設定**」になる →
  ライン画面で **`paidHead`（=segmentsPaid[0] 冒頭。例「有料セクション 1: …」）の直前**の「ラインをこの場所に変更」を click。
  正しく置くと黒バー「**このラインより先を有料にする**」が paidHead の直前に出る → **screenshot で必ず目視**してから「更新する」。
  価格・有料タイプ・ハッシュタグは re-paste で保持される（触らない）。
- 成功は **「記事が公開されました」モーダル**（X/Facebook/LINE 共有ボタン）で確認。後に note-published-urls.json に updated_at 記録。

### ★ハザード（長時間バッチで実際に発生・必ず対策）
1. **ディスク満杯（ENOSPC）**: browser-use は記事ごとに一時 `$TMPDIR/browser-use-user-data-dir-*`（各 数百MB）を作り、
   長時間バッチで**ディスクを食い潰してハーネスの出力すら書けなくなる**。**数記事ごとに必ず掃除**:
   ```bash
   rm -rf "${TMPDIR}"browser-use-user-data-dir-* /tmp/note-*.png 2>/dev/null
   ```
2. **daemon ハング / セッション断**: 長時間で `state`/`screenshot` が timeout。
   `pkill -KILL -f browser_use.skill_cli.daemon` で再起動するが、**再起動後に note セッションが切れて
   ログイン画面に飛ぶことがある**（再ログインが要る）。再開前に必ずアカウント照合ゲート（settings/account で `stats47`）を通す。
3. **対策**: **5〜10 記事ごとに区切る**（区切りで temp 掃除 + 状態をコミット）。1 記事あたり ~25-35 browser 操作。
   ライブ記事は「更新する」を押すまで変わらないので、途中で落ちても**ライブは無傷**（編集ドラフトをやり直すだけ）。
