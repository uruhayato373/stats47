---
name: publish-x
description: browser-use CLI で X (Twitter) の予約投稿を自動設定する（テキスト・画像・予約日時）
disable-model-invocation: true
argument-hint: "<rankingKey> --schedule YYYY-MM-DD HH:MM [--domain ranking|compare|correlation]"
---

browser-use CLI（Chrome プロファイル経由）で X の投稿コンポーザを自動操作し、予約投稿を設定する。

## 用途

- `/post-x` でキャプション生成済みのコンテンツを X に予約投稿したいとき
- 手動コピペ＋画像添付の手間を省きたいとき

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **contentKey** | 必須 | - | ランキングキー / 比較キー / 相関キー |
| **--schedule** | 必須 | - | 予約投稿日時（JST）— 例: `2026-03-25 12:00` |
| **--domain** | - | `ranking` | `ranking` / `compare` / `correlation` |

## 前提条件（ハードブロック）

**以下をすべて確認してから開始する。条件を満たさない場合は停止。**

1. browser-use CLI がインストール済み:
   ```bash
   export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
   browser-use doctor
   ```
2. キャプションファイルが存在する:
   - `<baseDir>/x/caption.txt` — 投稿テキスト
   - `<baseDir>/x/caption.json` — メタデータ（displayTitle 等）
3. 画像ファイルが存在する（任意）:
   - `<baseDir>/x/stills/choropleth-map-1200x630.png`（デフォルト — 地図は視認性が高くスクロール停止力がある）
   - `<baseDir>/x/stills/chart-x-1200x630.png`（フォールバック）
4. Chrome にログイン済みの X セッションがある（初回は手動ログインが必要）

### ベースディレクトリ

| ドメイン | baseDir |
|---|---|
| ranking | `.local/r2/sns/ranking/<contentKey>/` |
| compare | `.local/r2/sns/compare/<contentKey>/` |
| correlation | `.local/r2/sns/correlation/<contentKey>/` |

## browser-use 共通設定

すべての `browser-use` コマンドに以下のオプションを付与する:

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile 'Profile 5'"
```

**重要:**
- `--session` は指定しない（デフォルトセッション使用）
- 各コマンドは同一セッションで逐次実行する
- 要素インデックスは操作のたびに変わるため、必ず `$BU state` で都度確認すること

## 実証済みの要素パターン

| 要素 | 検索方法 | 備考 |
|---|---|---|
| テキスト入力 | `aria-label=ポスト本文 contenteditable=true role=textbox` | |
| 画像追加ボタン | `aria-label=画像や動画を追加` | |
| 画像 file input | `input type=file accept=image/jpeg,...` | Shadow DOM 内 |
| 予約ボタン | `aria-label=ポストを予約` | コンポーザ下部ツールバー |
| 月セレクト | `select id=SELECTOR_1` | 予約ダイアログ内、Shadow DOM |
| 日セレクト | `select id=SELECTOR_2` | 予約ダイアログ内、Shadow DOM |
| 年セレクト | `select id=SELECTOR_3` | 予約ダイアログ内、Shadow DOM |
| 時セレクト | `select id=SELECTOR_4` | 予約ダイアログ内、Shadow DOM |
| 分セレクト | `select id=SELECTOR_5` | 予約ダイアログ内、Shadow DOM |
| 確認するボタン | 「確認する」テキストの `<button>` | 予約ダイアログ内 |
| ポストするボタン | 「ポストする」テキスト / 「予約設定」テキスト | 予約確認後に変わる |
| 閉じるボタン | `aria-label=閉じる` | ダイアログ / コンポーザ |

## 手順

### Phase 0: データ読み込み

1. `<baseDir>/x/caption.txt` を読み込む
2. 画像ファイルの存在を確認（`stills/` ディレクトリ）
3. `--schedule` の日時をパース（年・月・日・時・分）

### Phase 1: ブラウザ起動 & ログイン確認

```bash
$BU open https://x.com/compose/post
```

`sleep 5` で読み込みを待ち、`$BU state` で確認:
- `contenteditable=true role=textbox` があればログイン済み → Phase 2 へ
- 「Sign in」「ログイン」が見える場合 → 未ログイン

**未ログイン時:**
ユーザーに「ブラウザ画面で手動ログインしてください」と案内して**停止**。ログイン完了後、ユーザーの指示で再開する。

### Phase 2: 画像アップロード（テキストより先に実行）

画像ファイルが存在する場合、テキスト入力前にアップロードする。

```bash
$BU state  # input type=file の要素を特定
$BU upload <file_inputのindex> <画像ファイルの絶対パス>
sleep 3  # アップロード完了待ち
```

**画像の優先順位:** `choropleth-map-1200x630.png` → `chart-x-1200x630.png` の順で存在する方を1枚アップロードする。地図はタイムラインで視認性が高く、テキストの TOP3 データと情報が重複しない。

アップロード後に `$BU state` で画像プレビューが表示されていることを確認。

### Phase 3: テキスト入力

caption.txt の内容を入力する。

```bash
$BU state  # contenteditable=true role=textbox のインデックスを特定
$BU click <テキスト入力のindex>
```

テキストは `$BU type` で入力する:

```bash
$BU type "<caption.txt の内容>"
```

**注意:**
- テキストに改行が含まれる場合は `$BU keys Enter` で改行を挿入するか、`$BU eval` で ClipboardEvent ペーストを使う
- URL は自動的にリンク化される
- ハッシュタグも含めた完全なテキストを入力する

**ClipboardEvent フォールバック（改行を含む場合）:**

```bash
node -e "
const fs = require('fs');
const text = fs.readFileSync('<baseDir>/x/caption.txt', 'utf8').trim();
fs.writeFileSync('/tmp/x-post-encoded.txt', encodeURIComponent(text));
"
ENCODED=$(cat /tmp/x-post-encoded.txt)
$BU eval "
  const editor = document.querySelector('[contenteditable=true][role=textbox]');
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

### Phase 4: 予約設定

```bash
$BU state  # aria-label=ポストを予約 のインデックスを特定
$BU click <予約ボタンのindex>
sleep 2
```

予約ダイアログが開いたら日時を設定:

```bash
$BU state  # select 要素のインデックスを確認

# 月を設定（SELECTOR_1）
$BU select <月セレクトのindex> <月の値>

# 日を設定（SELECTOR_2）
$BU select <日セレクトのindex> <日の値>

# 年を設定（SELECTOR_3）
$BU select <年セレクトのindex> <年の値>

# 時を設定（SELECTOR_4）
$BU select <時セレクトのindex> <時の値>

# 分を設定（SELECTOR_5）
$BU select <分セレクトのindex> <分の値>
```

**select の値について:**
- 月: `1`〜`12`（数値文字列）
- 日: `1`〜`31`
- 年: `2026` 等（4桁）
- 時: `0`〜`23`
- 分: `00`〜`59`（2桁ゼロパディング）

### Phase 5: 予約投稿を実行

**重要**: 予約ダイアログ内には「確認する」と「予約投稿ポスト」の **2つのボタン** がある。

```
[ダイアログ上部] 「確認する」    — 日時のバリデーションのみ（クリック不要）
[ダイアログ下部] 「予約投稿ポスト」 — 実際に予約をスケジュールするボタン（これをクリック）
```

**⚠ 「確認する」だけクリックするとダイアログが閉じてスケジュール未設定のままコンポーザに戻る。この状態で「ポストする」を押すと即時投稿になる。必ず「予約投稿ポスト」をクリックすること。**

```bash
# 日時設定後、「予約投稿ポスト」ボタンを特定してクリック
$BU state | grep -B1 '予約投稿ポスト$'
$BU click <予約投稿ポストのindex>
sleep 3
```

成功すると下書き（予約済み）画面に遷移する。

### Phase 6: 確認 & クリーンアップ

```bash
$BU screenshot /tmp/x-publish-<contentKey>.png
```

スクリーンショットをユーザーに提示し、結果を報告:
- 予約投稿の成功/失敗
- 投稿テキスト（先頭50文字）
- 添付画像の有無
- 予約日時

```bash
$BU close
```

### Phase 7: DB 投稿記録

`sns_posts` テーブルに投稿記録を INSERT する:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "INSERT INTO sns_posts (platform, post_type, domain, content_key, caption, media_path, has_link, status, scheduled_at)
   VALUES ('x', 'original', '<domain>', '<contentKey>', '<caption先頭100文字>', '<media_path>', <0or1>, 'scheduled', '<YYYY-MM-DD HH:MM>')"
```

- `post_type`: `original`（通常投稿）
- `status`: `scheduled`（予約投稿の場合）。即時投稿なら `posted` + `posted_at` をセット
- `has_link`: stats47.jp の URL を含む場合は `1`

## エラーハンドリング

- **ログインしていない場合**: ユーザーに手動ログインを案内して停止。認証情報をスクリプトで入力しない
- **要素が見つからない場合**: `$BU state` を再取得し、要素インデックスを再特定。3回試行して失敗したら停止
- **画像アップロード失敗**: テキストのみで予約投稿し、画像は手動添付を案内
- **予約ダイアログが開かない場合**: `sleep 3` → 再度クリック。3回失敗で停止
- **セッション切れ**: `$BU close` → 再起動。ログインページなら停止

## 注意

- **認証情報は扱わない**: Chrome プロファイルのセッションに依存
- **要素インデックスは毎回変わる**: 操作のたびに `$BU state` で再取得すること（ハードコードしない）
- **予約投稿のみ対応**: 即時投稿は対応しない（ボット検出リスク軽減のため）
- **一時ファイルは `/tmp/` に作成**: `x-post-encoded.txt`, スクリーンショット等
- **投稿間隔**: 連続で複数投稿を予約する場合も、予約時刻は最低1時間以上空けること

## 参照

- キャプション生成: `/post-x` スキル
- 画像生成: `/render-sns-stills` スキル
- browser-use CLI: `browser-use --help`
- 投稿管理: `sns_posts` テーブル（`packages/database/src/schema/sns_posts.ts`）
