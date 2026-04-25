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
const dirs = [
  path.join(projectRoot, 'docs/31_note記事原稿', slug),
  path.join(projectRoot, '.local/r2/note', slug),
];

const articleDir = dirs.find(d => fs.existsSync(path.join(d, 'note.md')));
if (!articleDir) { console.error('ERROR: note.md not found for ' + slug); process.exit(1); }

const raw = fs.readFileSync(path.join(articleDir, 'note.md'), 'utf8');

// frontmatter からタイトル抽出
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
const titleMatch = fmMatch?.[1]?.match(/title:\s*"(.+?)"/);
const title = titleMatch?.[1] ?? '';

// 本文準備
let body = raw.replace(/^---\n[\s\S]*?\n---\n*/, '');
body = body.replace(/<!-- note投稿時:.*?-->\n?/g, '');
body = body.replace(/!\[.*?\]\(.*?\)\n?/g, '');
body = body.replace(/^---$/gm, '');
body = body.trim();

// セグメント分割（URL vs テキスト）
const lines = body.split('\n');
const segments = [];
let textBuf = [];
for (const line of lines) {
  if (/^https?:\/\/\S+$/.test(line.trim())) {
    if (textBuf.length > 0) {
      segments.push({ type: 'text', content: textBuf.join('\n') });
      textBuf = [];
    }
    segments.push({ type: 'url', content: line.trim() });
  } else {
    textBuf.push(line);
  }
}
if (textBuf.length > 0) {
  segments.push({ type: 'text', content: textBuf.join('\n') });
}

// タグファイル
const tagsPath = path.join(articleDir, 'tags.txt');
const tags = fs.existsSync(tagsPath)
  ? fs.readFileSync(tagsPath, 'utf8').trim().split('\n').filter(Boolean)
  : [];

// 画像ファイルの検出
const imagesDir = path.join(articleDir, 'images');
const images = {
  eyecatch: null,
  choropleth: null,
  chart: null,
  boxplot: null,
};
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
  title,
  segments,
  tags,
  images,
  segmentCount: segments.length,
  urlCount: segments.filter(s => s.type === 'url').length,
};

fs.writeFileSync('/tmp/note-data-' + slug + '.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  slug,
  title: title.substring(0, 50),
  segments: segments.length,
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
browser-use --headed --profile Default open "https://editor.note.com/new"
sleep 4
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
```

`/tmp/note-state.txt` に `contenteditable=true` が含まれていればログイン済み。含まれていなければ「ログイン」等を確認。

**未ログイン時は停止**: `echo "ERROR: not logged in to note.com"` で停止し、手動ログインを案内する。

## Phase 2: アイキャッチ画像（※必ず本文入力前に実行）

**エディタ初期状態で「画像を追加」ボタンが確実に見える。** 本文入力後はスクロール位置がずれてボタン検出に失敗する。Phase 1 の state で `aria-label=画像を追加` のインデックスを同時に取得して使う。

```bash
# Phase 1 の state から取得済みの IMG_BTN を使用
ADD_IMG_IDX=$(grep -oE '\[[0-9]+\]<button aria-label=画像を追加' /tmp/note-state.txt | grep -oE '[0-9]+')
browser-use --headed --profile Default click $ADD_IMG_IDX
sleep 2

browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
UPLOAD_IDX=$(grep -B1 '画像をアップロード' /tmp/note-state.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
browser-use --headed --profile Default click $UPLOAD_IDX
sleep 2

browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
FILE_IDX=$(grep -oE '\[[0-9]+\]<input id=note-editor-eyecatch-input' /tmp/note-state.txt | grep -oE '[0-9]+')
browser-use --headed --profile Default upload $FILE_IDX <articleDir>/images/cover-1280x670.png
sleep 3

# トリミングダイアログの「保存」ボタン（「下書き保存」と区別）
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
SAVE_IDX=$(grep -B1 '	保存$' /tmp/note-state.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
browser-use --headed --profile Default click $SAVE_IDX
sleep 3
```

画像ファイルが存在しない場合はこの Phase をスキップする。

## Phase 3: タイトル入力

```bash
# アイキャッチ設定後に state を再取得（インデックスが変わっている）
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
TITLE_IDX=$(grep -oE '\[[0-9]+\]<textarea placeholder=記事タイトル' /tmp/note-state.txt | grep -oE '[0-9]+')
BODY_IDX=$(grep -oE '\[[0-9]+\]<div contenteditable=true role=textbox' /tmp/note-state.txt | grep -oE '[0-9]+')
browser-use --headed --profile Default click $TITLE_IDX
browser-use --headed --profile Default type "<タイトルテキスト>"
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
browser-use --headed --profile Default click $BODY_IDX
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

ENCODED=$(node -e "process.stdout.write(encodeURIComponent(require('fs').readFileSync('/tmp/note-body-<slug>.txt','utf8')))")
browser-use --headed --profile Default eval "
  const editor = document.querySelector('[contenteditable=true]');
  if (editor) {
    editor.focus();
    const text = decodeURIComponent('$ENCODED');
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    editor.dispatchEvent(event);
    'pasted ' + text.length + ' chars';
  } else { 'editor not found'; }
"
sleep 3
```

### 4-3. URL カード化（手動仕上げ）

一括 paste では URL は plain text のまま。OGP カードに変換するには以下のいずれか:

**人間が手動で**（推奨）: エディタ上で各 URL 行をクリック → 行末で Enter → 4 秒待つ → カード化

**または別 Phase で自動化（未実装、TODO）**: paste 後に各 URL の text node を eval で発見 → Selection API でカーソルを行末に置く → Enter キーを dispatch して note の URL→card 変換をトリガする実装を将来追加する余地あり。

---

**重要:**
- 必ず ClipboardEvent paste を使う（type は markdown 変換が効かない）
- 連続 paste は不可 → 全本文を 1 つの string に連結する
- URL カード化は paste 後の手動 / 別 Phase の責務

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
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
TOC_IDX=$(find_idx "aria-label=目次")
browser-use --headed --profile Default click $TOC_IDX
sleep 1
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
SEC_IDX=$(find_idx "<セクション名の一部>")
browser-use --headed --profile Default click $SEC_IDX
sleep 1
```

### 5-2. 見出し直後に空行を作成してメニューから画像挿入

```bash
# 見出し直後の段落にカーソルを置く
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
# 見出し直後の <p> をクリック
browser-use --headed --profile Default click <段落のindex>
browser-use --headed --profile Default keys Home
browser-use --headed --profile Default keys Enter
browser-use --headed --profile Default keys Up
sleep 1

# メニューを開く → 画像を選択
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
MENU_IDX=$(find_idx "aria-label=メニューを開く")
browser-use --headed --profile Default click $MENU_IDX
sleep 1

browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
IMG_BTN_IDX=$(grep -B1 '画像' /tmp/note-state.txt | grep '<button' | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
browser-use --headed --profile Default click $IMG_BTN_IDX
sleep 1

browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
IMG_FILE_IDX=$(find_idx "note-editor-image-upload-input")
browser-use --headed --profile Default upload $IMG_FILE_IDX <画像ファイルの絶対パス>
sleep 3
```

**4箇所すべてについてこの手順を繰り返す。画像ファイルが存在しないセクションはスキップ。**

## Phase 6: 下書き保存

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
DRAFT_IDX=$(find_idx "下書き保存")
browser-use --headed --profile Default click $DRAFT_IDX
sleep 3
```

**予約日時が指定されていない場合は Phase 8 へスキップ。**

## Phase 8: 確認スクリーンショット

```bash
browser-use --headed --profile Default screenshot /tmp/note-publish-<slug>.png
```

結果を報告（下書き保存 or 予約投稿、タイトル、タグ数、画像数、予約日時）。

## バッチ実行時: 次の記事へ

バッチの場合はブラウザを閉じずに Phase 1 に戻り、`browser-use --headed --profile Default open "https://editor.note.com/new"` で新しいエディタを開く。

## 全記事完了後

```bash
browser-use --headed --profile Default close
```
