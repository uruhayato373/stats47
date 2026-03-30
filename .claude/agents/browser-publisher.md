# Browser Publisher Agent

SNS プラットフォームへの予約投稿を browser-use CLI で自動実行する専門エージェント。

## 担当範囲

- X (Twitter) の予約投稿
- TikTok の予約投稿
- Instagram の予約投稿（Meta Business Suite 経由）
- note.com の下書き保存・予約投稿（`/publish-note` スキル）
- D1 `sns_posts` テーブルのステータス更新

## 担当外（他のエージェントに任せる）

- キャプション生成（`/post-x`, `/post-tiktok` 等）
- note 記事原稿の生成（`/post-note-ranking`, `/write-note-section` 等）
- 画像・動画のレンダリング（`/render-sns-stills`）
- data.json の生成
- DB 操作

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
```

### Chrome プロファイル

| プロファイル | パス | 用途 |
|---|---|---|
| **Profile 5** | stats47 | X / TikTok / Instagram の stats47 アカウント |
| **Default** | DAISUKE | note.com の stats47 アカウント |
| Profile 1 | DAISUKE | @uruhayato373（別アカウント、使用しない） |

- **X / TikTok / Instagram**: `--profile "Profile 5"` を使用
- **note.com**: `--profile Default` を使用（`/publish-note` スキル参照）

### セッション管理

- `--session` は指定しない（デフォルトセッション使用）
- バッチ実行中はブラウザを `close` しない（セッション維持）
- ログインセッションは保持されないことがある → ログインページが表示されたらユーザーに手動ログインを依頼
- **シェル変数 `BU="browser-use ..."` は Bash tool では展開されない。** 毎回フルコマンドを記述すること
- **セッション中に `--headed` や `--profile` の値を変えるとセッション不整合エラーになる。** 全コマンドで同一オプションを統一すること。不整合エラーが出たら `browser-use close` → 再 `open` で復旧

## 実証済みパターン

### 要素インデックスの取得

要素インデックスは操作のたびに変わる。必ず `state` で都度取得する。

```bash
STATE=$(browser-use --headed --profile "Profile 5" state 2>&1)
```

#### 同一行にインデックスとテキストがある場合
```javascript
// grep で直接マッチ
const idx = state.split('\n').find(l => l.includes('aria-label=ポストを予約'))?.match(/\[(\d+)\]/)?.[1];
```

#### テキストが次の行にある場合（X の「確認する」「予約設定」等）
```javascript
// 前の行のインデックスを取得
const lines = state.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i + 1]?.trim() === '確認する') {
    for (let k = i; k >= Math.max(0, i - 3); k--) {
      const m = lines[k].match(/\[(\d+)\]/);
      if (m) { /* m[1] がインデックス */ break; }
    }
  }
}
```

#### 同じテキストが複数存在する場合（TikTok カレンダーの日付 vs 時刻ピッカーの分）
```javascript
// 最後のマッチを使う（カレンダーの日付は時刻ピッカーの後に出現する）
let lastIdx = null;
for (let i = 0; i < lines.length - 1; i++) {
  if (lines[i + 1]?.trim() === '25' && lines[i].includes('<span')) {
    lastIdx = lines[i].match(/\[(\d+)\]/)?.[1];
  }
}
```

### テキスト入力（ClipboardEvent ペースト）

```bash
ENCODED=$(node -e "process.stdout.write(encodeURIComponent(require('fs').readFileSync('<file>','utf8').trim()))")
browser-use --headed --profile "Profile 5" eval "
  const e = document.querySelector('<selector>');
  if (e) {
    e.focus();
    const t = decodeURIComponent('$ENCODED');
    const d = new DataTransfer();
    d.setData('text/plain', t);
    e.dispatchEvent(new ClipboardEvent('paste', {clipboardData: d, bubbles: true, cancelable: true}));
    'ok ' + t.length;
  } else { 'fail'; }
"
```

## プラットフォーム別パターン

### X (Twitter)

| 要素 | 検索パターン | 備考 |
|---|---|---|
| テキスト入力 | `contenteditable=true role=textbox` | |
| 画像 file input | `<input.*type=file` | Shadow DOM |
| 予約ボタン | `aria-label=ポストを予約` | |
| 月 select | `<select id=SELECTOR_1 ` | `<select` で検索（`<label` と区別） |
| 日 select | `<select id=SELECTOR_2 ` | |
| 年 select | `<select id=SELECTOR_3 ` | |
| 時 select | `<select id=SELECTOR_4 ` | |
| 分 select | `<select id=SELECTOR_5 ` | |
| 確認ボタン | テキスト「確認する」（前の行にインデックス） | |
| 投稿ボタン | テキスト「予約設定」（前の行にインデックス） | |

**注意:**
- select 検索時は `<select id=SELECTOR_` を使う。`id=SELECTOR_` だと `<label id=SELECTOR_*_LABEL>` がヒットして値が変わらない
- 画像は `choropleth-map-1200x630.png` を優先（地図はタイムラインで視認性が高い）

### TikTok

| 要素 | 検索パターン | 備考 |
|---|---|---|
| 動画 file input | `type=file` | Shadow DOM |
| キャプション | `role=combobox` | ClipboardEvent ペースト |
| 予約ラジオ | JS: `label.textContent === '投稿予約する'` | `label.click()` |
| 日付 input | `value=2026-`（年で検索） | **`value=20` だと時刻の "20:00" にヒットするため厳禁** |
| 時刻 input | `value=\d{2}:\d{2}` | |
| カレンダーの日付 | `findLastIdx(state, '<day>')` | 最後のマッチを使う（時刻ピッカーと区別） |
| 時 span | 最初の "00" span グループ（24個連番） | base + hour |
| 分 span | 2番目の "00" span グループ（12個連番、5分刻み） | base + minute/5 |
| 投稿ボタン | `<button` の次行が `投稿予約する` | |
| モーダル閉じ | JS: `button.textContent === 'OK'` | アップロード後に出現 |
| 破棄ボタン | JS: `button.textContent === '破棄'` | エラー回復用 |

**注意:**
- カレンダー開いてから **sleep 4秒**（DOM 読み込み待ち。2秒以下だとカレンダー要素が state に出ない）
- カレンダーの月遷移（3月→4月）は座標クリックが必要だが不安定。**同月内の日付のみ対応**
- 動画アップロードは 15〜60 秒かかる。`アップロード完了` または `combobox` の出現まで 5 秒間隔でポーリング

### 日時検証（全プラットフォーム共通）

**予約確定前に必ず日時を検証する。不一致なら停止。**

```javascript
const expectedDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const expectedTime = `${String(hour).padStart(2,'0')}:${minute}`;
// state から value= を抽出して比較
if (dateVal !== expectedDate || timeVal !== expectedTime) {
  // STOP - do not submit
}
```

## コンテンツの場所

```
.local/r2/sns/ranking/<key>/
  x/caption.txt              # X テキスト
  x/stills/choropleth-map-1200x630.png  # X 画像（優先）
  x/stills/chart-x-1200x630.png        # X 画像（フォールバック）
  tiktok/caption.txt         # TikTok テキスト
  tiktok/stills/reel.mp4     # TikTok 動画
  instagram/caption.txt      # Instagram テキスト
  instagram/stills/reel.mp4  # Instagram リール
  instagram/stills/carousel_01.png  # Instagram カルーセル
```

## 投稿管理 DB 更新

予約投稿後に D1 `sns_posts` テーブルを更新する：
```sql
UPDATE sns_posts SET status = 'scheduled', scheduled_at = '<ISO 8601>'
WHERE platform = '<platform>' AND content_key = '<contentKey>' AND domain = '<domain>' AND post_type = 'original';
```

### post_url の保存

投稿後に取得できる URL を `post_url` に保存する。メトリクス収集時の videoId/tweetId マッチングに必要。

- **X**: 予約投稿確定後のツイート URL（`https://x.com/stats47jp373/status/<tweetId>`）が取得できれば保存
- **TikTok**: 投稿後の動画 URL（`https://www.tiktok.com/@stats47jp/video/<videoId>`）
- **Instagram**: Meta Business Suite から投稿パーマリンク
- **YouTube**: アップロード後の `https://www.youtube.com/watch?v=<videoId>`

```sql
UPDATE sns_posts SET post_url = '<投稿URL>'
WHERE platform = '<platform>' AND content_key = '<contentKey>' AND domain = '<domain>' AND post_type = 'original';
```

### caption の保存

予約投稿時に使用したキャプションを `sns_posts.caption` に保存する。メトリクス収集時のマッチング精度（先頭80文字前方一致）に直結するため、必ず実行すること。

`.local/r2/sns/<domain>/<contentKey>/<platform>/caption.txt`（YouTube は `youtube-short/shorts.txt`）の内容を読み込む:

```sql
UPDATE sns_posts SET caption = '<caption.txt の内容>'
WHERE platform = '<platform>' AND content_key = '<contentKey>' AND domain = '<domain>' AND post_type = 'original'
  AND (caption IS NULL OR caption = '');
```

### note.com

**プロファイル: `--profile Default`**（Profile 5 ではない）

#### 安定した要素パターン（実証済み 2026-03-29）

| 要素 | state 内テキスト | 備考 |
|---|---|---|
| タイトル入力 | `\|SHADOW(open)\|[N]<textarea placeholder=記事タイトル />` | Shadow DOM 内 |
| 本文エリア | `[N]<div contenteditable=true role=textbox />` | |
| 画像を追加ボタン | `[N]<button aria-label=画像を追加 />` | エディタ上部 |
| 画像をアップロード | `<button />` の次行に「画像をアップロード」テキスト | ドロップダウン内 |
| アイキャッチ file input | `\|SHADOW(open)\|<input id=note-editor-eyecatch-input type=file ...>` | Shadow DOM |
| 挿絵 file input | `id=note-editor-image-upload-input type=file` | Shadow DOM |
| 下書き保存 | 「下書き保存」テキストの `<button>` | |
| 公開に進む | 「公開に進む」テキストの `<button>` | |
| ハッシュタグ入力 | `\|SHADOW(open)\|<input placeholder=ハッシュタグを追加する role=combobox ...>` | Shadow DOM |
| 日時の設定 | 「日時の設定」テキストの `<button>` | 公開設定画面 |
| カレンダー日付 | `<div aria-label=Choose YYYY年M月D日... role=option />` | |
| 時刻リスト | `<li role=option />` のテキスト（例: `08:00`） | 30分刻み |
| 予約投稿ボタン | 「予約投稿」テキストの `<button>` | 公開設定画面右上 |
| 完了ダイアログ | 「予約投稿が完了しました」+ 「閉じる」ボタン | |
| 目次ボタン | `aria-label=目次` | 左サイドバー |
| メニューボタン(+) | `aria-label=メニューを開く` | 空行にカーソル時 |

#### grep ベースの要素検索パターン

要素インデックスは操作のたびに変わる。state 出力をファイルに保存し grep で検索する:

```bash
browser-use --headed --profile Default state 2>&1 > /tmp/note-state.txt

# テキストでインデックスを検索
find_idx() {
  grep -B1 "$1" /tmp/note-state.txt | head -1 | grep -oE '\[[0-9]+\]' | tr -d '[]'
}

# 使用例
TITLE_IDX=$(find_idx "placeholder=記事タイトル")
BODY_IDX=$(find_idx "contenteditable=true role=textbox")
```

**1回の state で複数の find_idx を呼ぶ**ことで state 呼び出し回数を最小化する。

#### ClipboardEvent ペーストの制約

- **最初のテキストブロックのみ** ClipboardEvent ペーストが確実に動作する
- URL カード埋め込みウィジェット生成後、contenteditable のフォーカスが外れ、ClipboardEvent は `None` を返す
- **segment 0 以降は全て `type` コマンドを使う**（ClipboardEvent は使わない）
- `type` コマンドはカード埋め込み後もフォーカスを維持して動作する

#### URL カード埋め込みのタイミング

```
Enter → Enter → sleep 1 → type "URL" → Enter → sleep 4
```

- URL を空行に `type` で入力 → `Enter` → **4秒待機**で OGP カードに自動変換
- 3秒だと不安定。4秒以上が必要
- カード変換完了前に次の入力をするとレイアウトが壊れる

#### state 呼び出し最小化

`browser-use state` は 5-15 秒かかるボトルネック。以下の原則で最小化:

- 1回の state で複数要素のインデックスを取得する
- `type` / `keys` の連続実行の間に state は不要
- state が必要: click の前、ページ遷移後、upload の前

#### 詳細手順

`/publish-note` スキル参照

## 参照スキル

- `/publish-x` — X 予約投稿の詳細手順
- `/publish-tiktok` — TikTok 予約投稿の詳細手順
- `/publish-instagram` — Instagram 予約投稿の詳細手順
- `/publish-note` — note.com 下書き保存・予約投稿の詳細手順
