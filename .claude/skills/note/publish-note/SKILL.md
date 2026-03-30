---
name: publish-note
description: browser-use CLI で note.com エディタを自動操作し、記事を下書き保存または予約投稿する（テキスト・アイキャッチ・挿絵・タグ）。確認なし完全自動実行。
disable-model-invocation: true
argument-hint: "<slug> <M/D> <HH:MM> [, <slug2> <M/D> <HH:MM> ...]"
---

browser-use CLI（Chrome プロファイル経由）で note.com エディタを自動操作し、記事を下書き保存または予約投稿する。**確認プロンプトなし**で全ステップを自動実行する。

## 用途

- `/write-note-section` → `/edit-note-draft` 完了後の記事を note.com に自動投稿
- `/post-note-ranking` で生成した A シリーズ記事を投稿
- 複数記事をバッチで一括予約投稿

## 引数（バッチ対応）

カンマ区切りで複数記事を指定可能:

```
/publish-note a-population-density 3/30 08:00, a-maximum-temperature 3/30 12:00, a-university-count 3/30 18:00
```

各エントリのフォーマット: `<slug> [<M/D> <HH:MM>]`

- **slug**: 記事ディレクトリ名（必須）
- **M/D HH:MM**: 予約投稿日時（任意）。省略時は下書き保存のみ。年は当年を使用

## 前提条件

1. browser-use CLI がインストール済み
2. 記事ファイルが存在する: `docs/31_note記事原稿/<slug>/note.md` または `.local/r2/note/<slug>/note.md`
3. Chrome Default プロファイルで note.com にログイン済み

## 実行フロー概要

```
引数パース → 記事ごとにループ:
  Phase 0: データ読み込み（Node.js）
  Phase 1: ブラウザ起動 & エディタ表示
  Phase 2: アイキャッチ画像（※必ず本文入力前に実行。本文入力後はスクロール位置がずれてボタン検出に失敗する）
  Phase 3: タイトル入力
  Phase 4: 本文入力（ClipboardEvent + type）
  Phase 5: 挿絵の挿入（目次経由）
  Phase 6: 下書き保存
  Phase 7: 公開設定（タグ・予約投稿）
  Phase 8: 確認スクリーンショット
→ 全記事完了後にブラウザを閉じる
```

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
```

**全コマンド**: `browser-use --headed --profile Default <command>`

- `--session` 指定しない（デフォルトセッション）
- `$BU` 変数は使わない。毎回フルコマンドを書く
- バッチ実行中はブラウザを閉じない（最後に1回だけ `close`）

## 要素検索ヘルパー: find_idx

`state` 出力からテキストでインデックスを検索する。**state 呼び出しを最小限にするため、1回の state で複数要素を検索する。**

```bash
# state を1回取得して /tmp/note-state.txt に保存
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt

# テキストでインデックスを検索する関数
find_idx() {
  local RESULT=$(grep -B1 "$1" /tmp/note-state.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]')
  echo "$RESULT"
}
```

**リトライロジック**: 要素が見つからない場合、最大2回リトライ（sleep 3 + state 再取得）:

```bash
find_idx_retry() {
  local TARGET="$1"
  local IDX=$(find_idx "$TARGET")
  if [ -z "$IDX" ]; then
    sleep 3
    browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
    IDX=$(find_idx "$TARGET")
  fi
  if [ -z "$IDX" ]; then
    sleep 3
    browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
    IDX=$(find_idx "$TARGET")
  fi
  echo "$IDX"
}
```

## 実証済みの要素パターン

| 要素 | state 内テキスト | 備考 |
|---|---|---|
| タイトル入力 | `placeholder=記事タイトル` | Shadow DOM 内 textarea |
| 本文エリア | `contenteditable=true role=textbox` | |
| 画像を追加ボタン | `aria-label=画像を追加` | エディタ上部 |
| 画像アップロード選択 | 「画像をアップロード」テキストの `<button>` | ドロップダウン内 |
| アイキャッチ file input | `id=note-editor-eyecatch-input type=file` | Shadow DOM 内 |
| トリミング保存ボタン | 「保存」の `<button>`（「下書き保存」ではない方） | |
| 目次ボタン | `aria-label=目次` | 左サイドバー |
| 目次セクション | `role=menuitem aria-label=<見出しテキスト>` | 目次展開後 |
| メニューボタン(+) | `aria-label=メニューを開く` | 空行にカーソル時 |
| 画像挿入メニュー | 「画像」テキストの `<button>` | メニュー展開後 |
| 挿絵 file input | `id=note-editor-image-upload-input type=file` | Shadow DOM 内 |
| 下書き保存ボタン | 「下書き保存」テキストの `<button>` | |
| 公開に進むボタン | 「公開に進む」テキストの `<button>` | |
| ハッシュタグ入力 | `placeholder=ハッシュタグを追加する` | 公開設定画面、Shadow DOM |
| 日時の設定ボタン | 「日時の設定」テキストの `<button>` | 公開設定画面 |
| カレンダー日付 | `aria-label=Choose YYYY年M月D日` の `role=option` | |
| 時刻リスト | `role=option` のテキスト（例: `08:00`） | 30分刻み |
| 予約投稿ボタン | 「予約投稿」テキストの `<button>` | 公開設定画面右上 |
| 完了ダイアログ | 「予約投稿が完了しました」テキスト + 「閉じる」ボタン | |

## 手順

### Phase 0: データ読み込み（Node.js スクリプト）

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

### Phase 1: ブラウザ起動 & エディタ表示

```bash
browser-use --headed --profile Default open "https://editor.note.com/new"
sleep 4
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
```

`/tmp/note-state.txt` に `contenteditable=true` が含まれていればログイン済み。含まれていなければ「ログイン」等を確認。

**未ログイン時は停止**: `echo "ERROR: not logged in to note.com"` で停止し、手動ログインを案内する。

### Phase 2: アイキャッチ画像（※必ず本文入力前に実行）

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

### Phase 3: タイトル入力

```bash
# アイキャッチ設定後に state を再取得（インデックスが変わっている）
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
TITLE_IDX=$(grep -oE '\[[0-9]+\]<textarea placeholder=記事タイトル' /tmp/note-state.txt | grep -oE '[0-9]+')
BODY_IDX=$(grep -oE '\[[0-9]+\]<div contenteditable=true role=textbox' /tmp/note-state.txt | grep -oE '[0-9]+')
browser-use --headed --profile Default click $TITLE_IDX
browser-use --headed --profile Default type "<タイトルテキスト>"
```

### Phase 4: 本文入力（セグメント方式）

#### 3-1. 最初のテキストセグメントを ClipboardEvent でペースト

```bash
BODY_IDX=$(find_idx "contenteditable=true role=textbox")
browser-use --headed --profile Default click $BODY_IDX
```

```bash
# segment 0 のテキストを encodeURIComponent で準備
ENCODED=$(node -e "
const data = JSON.parse(require('fs').readFileSync('/tmp/note-data-<slug>.json','utf8'));
process.stdout.write(encodeURIComponent(data.segments[0].content));
")
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
sleep 2
```

note エディタは `## ` を自動的に見出しに、`**太字**` を太字に変換する。

#### 3-2. 残りのセグメント（segment 1〜）を type で入力

**segment 0 以降は全て `type` を使う。ClipboardEvent は使わない。**（ClipboardEvent は最初の1回目のみ確実に動作する制約あり）

各セグメントをループで処理する。`/tmp/note-data-<slug>.json` の segments 配列を Node.js で読み、セグメントごとに Bash コマンドを実行する。

**URL セグメント:**

```bash
browser-use --headed --profile Default keys Enter
browser-use --headed --profile Default keys Enter
sleep 1
browser-use --headed --profile Default type "<URL>"
browser-use --headed --profile Default keys Enter
sleep 4  # OGP カード変換待ち（4秒必須）
```

**テキストセグメント（URL 間のテキスト）:**

テキストを行単位に分割し、1行ずつ `type` + `Enter` で入力する:

```bash
browser-use --headed --profile Default keys Enter
browser-use --headed --profile Default type "<行テキスト>"
browser-use --headed --profile Default keys Enter
```

`### ` プレフィックスは `type` でも h3 に変換される。

**重要:**
- URL 入力後は **4秒待機**で OGP カード変換を待つ
- カード変換完了前に次の入力をするとレイアウトが壊れる
- テキストセグメントは `sleep 1` で十分

### Phase 5: 挿絵の挿入

A シリーズ記事の標準画像配置（存在する画像のみ挿入）:

| 挿入先セクション | 画像ファイル |
|---|---|
| `【コロプレス地図】` | `choropleth-map-*.png` |
| `上位5：分析` | `chart-x-*.png` |
| `下位5：分析` | `chart-x-*.png`（同じ画像） |
| `地域別の傾向` | `boxplot-*.png` |

**記事の上から順に挿入する。** 各画像について:

#### 5-1. 目次からセクションにジャンプ

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

#### 5-2. 見出し直後に空行を作成してメニューから画像挿入

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

### Phase 6: 下書き保存

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
DRAFT_IDX=$(find_idx "下書き保存")
browser-use --headed --profile Default click $DRAFT_IDX
sleep 3
```

**予約日時が指定されていない場合は Phase 8 へスキップ。**

### Phase 7: 公開設定（タグ・予約投稿）

#### 7-1. 公開に進む

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
PUB_IDX=$(find_idx "公開に進む")
browser-use --headed --profile Default click $PUB_IDX
sleep 3
```

#### 7-2. ハッシュタグ入力

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
TAG_IDX=$(find_idx "ハッシュタグを追加する")
browser-use --headed --profile Default click $TAG_IDX
```

tags.txt の各タグについて:

```bash
browser-use --headed --profile Default type "<タグ>"
browser-use --headed --profile Default keys Enter
sleep 0.5
```

#### 7-3. 予約投稿の日時設定

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
SCHED_IDX=$(find_idx "日時の設定")
browser-use --headed --profile Default click $SCHED_IDX
sleep 2
```

カレンダーで日付を選択:

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
# aria-label="Choose YYYY年M月D日..." の要素を検索
DATE_IDX=$(find_idx "Choose <YYYY>年<M>月<D>日")
browser-use --headed --profile Default click $DATE_IDX
sleep 1
```

時刻リストから時間を選択:

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
TIME_IDX=$(find_idx "<HH:MM>")
browser-use --headed --profile Default click $TIME_IDX
sleep 1
```

#### 7-4. 予約投稿を実行

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
RESERVE_IDX=$(find_idx "予約投稿")
browser-use --headed --profile Default click $RESERVE_IDX
sleep 3
```

完了ダイアログが表示されたら「閉じる」をクリック:

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt
CLOSE_IDX=$(find_idx "閉じる")
if [ -n "$CLOSE_IDX" ]; then
  browser-use --headed --profile Default click $CLOSE_IDX
  sleep 1
fi
```

### Phase 8: 確認スクリーンショット

```bash
browser-use --headed --profile Default screenshot /tmp/note-publish-<slug>.png
```

結果を報告（下書き保存 or 予約投稿、タイトル、タグ数、画像数、予約日時）。

### バッチ実行時: 次の記事へ

バッチの場合はブラウザを閉じずに Phase 1 に戻り、`browser-use --headed --profile Default open "https://editor.note.com/new"` で新しいエディタを開く。

### 全記事完了後

```bash
browser-use --headed --profile Default close
```

## state 呼び出し最小化ガイドライン

`browser-use state` は 5-15 秒かかるため、最小限に抑える。

**1回の state で複数要素を検索する:**
- Phase 2: state 1回 → タイトルIDX + 本文IDX の両方を取得
- Phase 4: 「画像を追加」クリック後の state で「画像をアップロード」も確認

**state を省略できるケース:**
- `type` / `keys` コマンドの後は state 不要（インデックスを使わないため）
- 連続する `type` + `Enter` の間に state は不要

**state が必要なケース:**
- click の前（インデックスが必要）
- ページ遷移後（DOM が変わるため）
- upload の前（file input のインデックスが必要）

## エラーハンドリング

- **要素が見つからない場合**: `find_idx_retry` で最大2回リトライ（sleep 3 + state 再取得）。それでも見つからない場合はそのステップをスキップして続行
- **ログインしていない場合**: 停止してユーザーに手動ログインを案内
- **画像アップロード失敗**: テキストのみで下書き保存し、画像挿入はスキップ
- **セッション切れ**: `browser-use close` → `browser-use --headed --profile Default open` で再起動
- **DOM が Empty**: `sleep 3` → state 再取得

## 注意

- **認証情報は扱わない**: Chrome Default プロファイルのセッションに依存
- **要素インデックスは毎回変わる**: state で都度確認。ハードコードしない
- **一時ファイルは `/tmp/` に作成**: `note-data-<slug>.json`, `note-state.txt`, スクリーンショット等
- **$BU 変数を使わない**: 毎回 `browser-use --headed --profile Default` をフルで書く
- **`--session` は指定しない**: デフォルトセッション使用
- **B/C/D シリーズ**: 画像配置が異なる場合あり。note.md の `![...](...)` 行を参照して挿入先を判断

## 参照

- browser-use CLI: `browser-use --help`
- note 記事テンプレート: `/post-note-ranking` スキル
- note 記事執筆: `/write-note-section` スキル
- note 記事編集: `/edit-note-draft` スキル
- 自動化パターン: `.claude/agents/browser-publisher.md` の note.com セクション
