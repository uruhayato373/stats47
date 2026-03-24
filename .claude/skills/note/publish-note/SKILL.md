---
name: publish-note
description: browser-use CLI で note.com エディタを自動操作し、記事を下書き保存または予約投稿する（テキスト・アイキャッチ・挿絵・タグ）
disable-model-invocation: true
argument-hint: "<slug> [--schedule YYYY-MM-DD HH:MM]"
---

browser-use CLI（Chrome プロファイル経由）で note.com エディタを自動操作し、記事を下書き保存または予約投稿する。

## 用途

- `/write-note-section` → `/edit-note-draft` 完了後の記事を note.com に自動投稿したいとき
- `/post-note-ranking` で生成した A シリーズ記事を投稿したいとき
- 手動コピペの手間を省きたいとき

## 引数

- **slug**: 記事ディレクトリ名（必須）— 例: `a-annual-sunshine-duration`, `b2-sunshine-duration`
- **--schedule**: 予約投稿日時（任意）— 例: `2026-03-25 08:00`。省略時は下書き保存のみ

## 前提条件（ハードブロック）

**以下をすべて確認してから開始する。条件を満たさない場合は停止。**

1. browser-use CLI がインストール済み:
   ```bash
   export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
   browser-use doctor
   ```
2. 記事ファイルが存在する:
   - `docs/31_note記事原稿/<slug>/note.md` または `.local/r2/note/<slug>/note.md`
3. Chrome にログイン済みの note.com セッションがある（初回は手動ログインが必要）

## browser-use 共通設定

すべての `browser-use` コマンドに以下のオプションを付与する:

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile Default"
```

**重要: `--session` は指定しない（デフォルトセッション使用）。各コマンドは同一セッションで逐次実行する。**

## 実証済みの要素パターン

以下は実験で確認済みの note エディタの DOM パターン。**要素インデックスはページ操作のたびに変わるため、必ず `$BU state` で都度確認すること。**

| 要素 | 検索方法 | 備考 |
|---|---|---|
| タイトル入力 | `state` で `<textarea placeholder=記事タイトル>` を探す | Shadow DOM 内 |
| 本文エリア | `<div contenteditable=true role=textbox>` | |
| 画像を追加ボタン | `aria-label=画像を追加` | エディタ上部 |
| 画像アップロード選択 | `state` で「画像をアップロード」テキストの `<button>` | ドロップダウン内 |
| アイキャッチ file input | `id=note-editor-eyecatch-input type=file` | Shadow DOM 内 |
| トリミング保存ボタン | 「保存」テキストの `<button>`（「下書き保存」と区別） | |
| 目次ボタン | `aria-label=目次` | 左サイドバー |
| 目次セクション | `role=menuitem aria-label=<見出しテキスト>` | 目次展開後 |
| メニューボタン(+) | `aria-label=メニューを開く` | 空行にカーソル時に出現 |
| 画像挿入メニュー | 「画像」テキストの `<button>` | メニュー展開後 |
| 挿絵 file input | `id=note-editor-image-upload-input type=file` | Shadow DOM 内 |
| 下書き保存ボタン | 「下書き保存」テキストの `<button>` | |
| 公開に進むボタン | 「公開に進む」テキストの `<button>` | |
| ハッシュタグ入力 | `placeholder=ハッシュタグを追加する` | 公開設定画面、Shadow DOM 内 |
| 予約投稿 日時設定 | 「日時の設定」テキストの `<button>` | 公開設定画面の「予約投稿」セクション |
| 予約投稿ボタン | 「予約投稿」テキストの `<button>` | 公開設定画面右上 |

## 手順

### Phase 0: 記事データ読み込み

1. 記事ファイルを読み込む:
   - 優先: `docs/31_note記事原稿/<slug>/note.md`
   - フォールバック: `.local/r2/note/<slug>/note.md`

2. frontmatter から `title` を抽出

3. 本文を準備:
   - frontmatter（`---` で囲まれた部分）を除去
   - `<!-- note投稿時: ... -->` コメント行を除去
   - `![...](...)` 画像行を除去
   - `---`（水平線）を除去
   - 先頭・末尾の空行をトリム

4. 画像ファイルを確認:
   - `images/cover-1280x670.png` — アイキャッチ画像
   - `images/choropleth-map-*.png` — コロプレス地図（`## 【コロプレス地図】` の下）
   - `images/chart-x-*.png` — 上位5チャート（`## 上位5：分析` と `## 下位5：分析` の下に同じ画像）
   - `images/boxplot-*.png` — 箱ひげ図（`## 地域別の傾向` の下）

5. タグファイル `tags.txt`（1行1タグ）を読み込む

### Phase 1: ブラウザ起動 & ログイン確認

```bash
$BU open https://note.com/dashboard
```

`sleep 3` で読み込みを待ち、`$BU state` で確認:
- 「メッセージ」「通知」等のナビゲーション要素があればログイン済み → Phase 2 へ
- 「ログイン」「会員登録」ボタンが見える場合 → 未ログイン

**未ログイン時:**
```bash
$BU open https://note.com/login
```
ユーザーに「ブラウザ画面で手動ログインしてください」と案内して**停止**。ログイン完了後、ユーザーの指示で再開する。

**注意:** 初回ログイン後、Chrome プロファイルにセッションが保存される。2回目以降は自動ログインされる。

### Phase 2: エディタを開く

```bash
$BU open https://editor.note.com/new
```

`sleep 2` 後に `$BU state` で `contenteditable=true` の要素を確認。

### Phase 3: タイトル入力

```bash
$BU state
# <textarea placeholder=記事タイトル> のインデックスを特定
$BU click <タイトル欄のindex>
$BU type "<タイトルテキスト>"
```

### Phase 4: 本文入力

本文は ClipboardEvent 経由で一括ペーストする（実証済み）。

1. 本文テキストを `/tmp/` に保存し URL エンコード:

```bash
node -e "
const fs = require('fs');
const text = fs.readFileSync('/tmp/note-body.txt', 'utf8').trim();
fs.writeFileSync('/tmp/note-body-encoded.txt', encodeURIComponent(text));
"
```

2. contenteditable 要素をクリックしてフォーカス:

```bash
$BU state
# <div contenteditable=true role=textbox> のインデックスを特定
$BU click <本文エリアのindex>
```

3. JavaScript で ClipboardEvent を発火してペースト:

```bash
ENCODED=$(cat /tmp/note-body-encoded.txt)
$BU eval "
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
```

note エディタは `## ` を自動的に見出しに変換する。`**太字**` も認識される。

**フォールバック:** `eval` でのペーストが効かない場合は、段落ごとに `$BU type` + `$BU keys Enter Enter` で入力する。

### Phase 5: アイキャッチ画像の設定

```bash
$BU state  # aria-label=画像を追加 のインデックスを特定
$BU click <画像を追加のindex>
```

```bash
$BU state  # 「画像をアップロード」の <button> インデックスを特定
$BU click <画像をアップロードのindex>
```

```bash
$BU state  # id=note-editor-eyecatch-input の file input を特定
$BU upload <file_inputのindex> <記事ディレクトリ>/images/cover-1280x670.png
```

トリミングダイアログが表示される（`sleep 2` で待機）:

```bash
$BU state  # 「保存」ボタンを特定（「下書き保存」ではない方）
$BU click <保存ボタンのindex>
```

### Phase 6: 挿絵の挿入

A シリーズ記事の標準画像配置（4箇所）:

1. `## 【コロプレス地図】日本全国の分布` の下 → `choropleth-map-*.png`
2. `## 上位5：分析` の下 → `chart-x-*.png`
3. `## 下位5：分析` の下 → `chart-x-*.png`（上位5と同じ画像）
4. `## 地域別の傾向` の下 → `boxplot-*.png`

**記事の上から順に挿入する。** 各画像の挿入手順:

#### 6-1. 目次からセクションにジャンプ

```bash
$BU state  # aria-label=目次 のボタンを特定
$BU click <目次ボタンのindex>
sleep 1
$BU state  # role=menuitem のリストから対象セクションを特定
$BU click <対象セクションのmenuitemのindex>
```

#### 6-2. 見出し直後に空行を作成

```bash
$BU state  # 見出し直後の <p> 要素を特定
$BU click <段落のindex>
$BU keys Home
$BU keys Enter
$BU keys Up
```

#### 6-3. メニューから画像を挿入

```bash
$BU state  # aria-label=メニューを開く のボタンを特定
$BU click <メニューを開くのindex>
sleep 1
$BU state  # 「画像」テキストの <button> を特定
$BU click <画像のindex>
sleep 1
$BU state  # id=note-editor-image-upload-input の file input を特定
$BU upload <file_inputのindex> <画像ファイルパス>
sleep 3  # アップロード完了待ち
```

**4箇所すべてについてこの手順を繰り返す。**

### Phase 7: 下書き保存

```bash
$BU state  # 「下書き保存」の <button> を特定
$BU click <下書き保存のindex>
sleep 3
```

`--schedule` が指定されていない場合はここで Phase 9 へ。

### Phase 8: 公開設定（タグ・予約投稿）

「公開に進む」をクリック:

```bash
$BU state  # 「公開に進む」の <button> を特定
$BU click <公開に進むのindex>
sleep 2
```

#### 8-1. ハッシュタグ入力

```bash
$BU state  # placeholder=ハッシュタグを追加する の input を特定
$BU click <ハッシュタグ入力のindex>
```

`tags.txt` の各行について:

```bash
$BU type "<タグ>"
$BU keys Enter
```

**注意:** note は最大99タグ。1タグずつ Enter で確定する。

#### 8-2. 予約投稿（`--schedule` 指定時のみ）

```bash
$BU state  # 「日時の設定」の <button> を特定
$BU click <日時の設定のindex>
sleep 1
```

カレンダーで日付を選択:

```bash
$BU state  # role=option aria-label="Choose YYYY年M月D日..." の要素を特定
$BU click <対象日付のindex>
```

時刻リストから時間を選択:

```bash
$BU state  # 時刻リスト（06:30, 07:00, ... 30分刻み）から対象時刻を特定
$BU click <対象時刻のindex>
```

予約投稿ボタンをクリック:

```bash
$BU state  # 「予約投稿」の <button>（右上）を特定
$BU click <予約投稿のindex>
sleep 3
```

#### 8-3. 即時投稿でない場合

`--schedule` なしでタグだけ設定した場合は「キャンセル」でエディタに戻り、再度下書き保存する。

### Phase 9: 確認 & クリーンアップ

```bash
$BU screenshot /tmp/note-publish-<slug>.png
```

スクリーンショットをユーザーに提示し、結果を報告:
- 下書き保存 or 予約投稿の成功/失敗
- 投稿タイトル
- 設定タグ数
- アイキャッチ画像の有無
- 挿絵の枚数
- 予約投稿の場合は予約日時

```bash
$BU close
```

## エラーハンドリング

- **ログインしていない場合**: ユーザーに手動ログインを案内して停止。認証情報をスクリプトで入力しない
- **要素が見つからない場合**: `$BU state` を再取得し、要素インデックスを再特定。3回試行して失敗したら停止
- **DOM が Empty**: `sleep 3` → 再度 `$BU state`。ページ遷移直後は DOM ロードに時間がかかる
- **画像アップロード失敗**: テキストのみで下書き保存し、画像は手動を案内
- **セッション切れ**: `$BU close` → `$BU open` で再起動。ログインページなら停止

## 注意

- **認証情報は扱わない**: Chrome プロファイルのセッションに依存
- **要素インデックスは毎回変わる**: 操作のたびに `$BU state` で再取得すること（ハードコードしない）
- **`$BU wait --timeout` は使えない**: `sleep N` を使うこと
- **一時ファイルは `/tmp/` に作成**: `note-body.txt`, `note-body-encoded.txt`, スクリーンショット等
- **B/C/D シリーズ**: 画像の配置が A シリーズと異なる場合がある。`note.md` の `![...](...)` 行を参照して挿入先を判断する

## 参照

- browser-use CLI: `browser-use --help` で各コマンドの使い方を確認
- note 記事テンプレート: `/post-note-ranking` スキル
- note 記事執筆: `/write-note-section` スキル
- note 記事編集: `/edit-note-draft` スキル
