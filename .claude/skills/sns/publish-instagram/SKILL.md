---
name: publish-instagram
description: browser-use CLI で Meta Business Suite から Instagram の予約投稿を自動設定する（カルーセル・リール・キャプション・予約日時）
disable-model-invocation: true
argument-hint: "<rankingKey> --schedule YYYY-MM-DD HH:MM [--type carousel|reel] [--domain ranking|compare|correlation]"
---

browser-use CLI（Chrome プロファイル経由）で Meta Business Suite を自動操作し、Instagram の予約投稿を設定する。

## 用途

- `/post-instagram` でキャプション生成済み、`/render-sns-stills` で画像・動画生成済みのコンテンツを Instagram に予約投稿したいとき
- 手動コピペ＋画像添付の手間を省きたいとき

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **contentKey** | 必須 | - | ランキングキー / 比較キー / 相関キー |
| **--schedule** | 必須 | - | 予約投稿日時（JST）— 例: `2026-03-25 12:00` |
| **--type** | - | `carousel` | `carousel`（カルーセル3枚）/ `reel`（リール動画） |
| **--domain** | - | `ranking` | `ranking` / `compare` / `correlation` |

## 前提条件（ハードブロック）

**以下をすべて確認してから開始する。条件を満たさない場合は停止。**

1. browser-use CLI がインストール済み:
   ```bash
   export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
   browser-use doctor
   ```
2. キャプションファイルが存在する:
   - `<baseDir>/instagram/caption.txt` — 投稿テキスト
3. メディアファイルが存在する:
   - carousel: `<baseDir>/instagram/stills/carousel_01.png`, `carousel_02.png`, `carousel_03.png`
   - reel: `<baseDir>/instagram/stills/reel.mp4`
4. Chrome Profile 5（stats47）で Meta Business Suite にログイン済み

### ベースディレクトリ

| ドメイン | baseDir |
|---|---|
| ranking | `.local/r2/sns/ranking/<contentKey>/` |
| compare | `.local/r2/sns/compare/<contentKey>/` |
| correlation | `.local/r2/sns/correlation/<contentKey>/` |

## browser-use 共通設定

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile 'Profile 5'"
```

**重要:**
- `--session` は指定しない（デフォルトセッション使用）
- 各コマンドは同一セッションで逐次実行する
- 要素インデックスは操作のたびに変わるため、必ず `$BU state` で都度確認すること

## Meta Business Suite の UI フロー

```
投稿を作成 → Instagram 選択 → メディアアップロード → キャプション入力 → 予約日時設定 → 予約投稿
```

URL: `https://business.facebook.com/latest/home` → 「投稿を作成」ボタン

## 手順

### Phase 0: データ読み込み

1. `<baseDir>/instagram/caption.txt` を読み込む
2. メディアファイルの存在を確認:
   - `--type carousel`: `stills/carousel_01.png`, `carousel_02.png`, `carousel_03.png`
   - `--type reel`: `stills/reel.mp4`
3. `--schedule` の日時をパース（年・月・日・時・分）

### Phase 1: ブラウザ起動 & ログイン確認

```bash
$BU open "https://business.facebook.com/latest/home"
sleep 5
$BU state
```

確認ポイント:
- 「投稿を作成」等のボタンが見える → ログイン済み → Phase 2 へ
- 「ログイン」が見える → 未ログイン

**未ログイン時:**
ユーザーに「ブラウザ画面で Meta Business Suite に手動ログインしてください」と案内して**停止**。

### Phase 2: 投稿作成画面を開く

「投稿を作成」ボタンをクリック:
```bash
$BU state  # 「投稿を作成」ボタンのインデックスを特定
$BU click <投稿作成ボタンのindex>
sleep 3
$BU state
```

**Instagram の選択:**
投稿作成ダイアログで Instagram が選択されていることを確認。Facebook のみ選択されている場合は Instagram も追加する。

```bash
# Instagram のトグル/チェックボックスを確認
$BU state  # Instagram アイコンまたはチェックボックスを特定
# 選択されていなければクリック
```

**リール投稿の場合:**
「リール」タブがある場合はクリック。なければ動画アップロード時に自動判定される。

### Phase 3: メディアアップロード（Playwright CDP 方式）

Meta Business Suite の「写真・動画を追加」ボタンはネイティブファイルダイアログを開くため、DOM に `<input type="file">` が現れない。`browser-use upload` は使えない。

**解決策**: Playwright を browser-use の CDP WebSocket URL に接続し、`expect_file_chooser()` でファイルダイアログをインターセプトする。

#### 3-1. CDP URL を取得

```bash
# browser-use のセッション情報から CDP URL を取得
$BU python 'print(browser._session.cdp_client.url)'
```

出力例: `ws://127.0.0.1:58114/devtools/browser/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### 3-2. Playwright でファイルアップロードを実行

```python
# /tmp/pw_upload.py として保存して実行
import asyncio, os
from playwright.async_api import async_playwright

CDP_URL = "<上で取得した CDP URL>"
BASE_DIR = "<baseDir>"

async def upload_files(file_paths):
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(CDP_URL)
        context = browser.contexts[0]
        # Meta Business Suite のページを取得
        page = None
        for pg in context.pages:
            if "business.facebook.com" in pg.url:
                page = pg
                break
        if not page:
            raise Exception("Meta Business Suite page not found")

        # 「写真・動画を追加」ボタンを見つけてクリック → ファイルダイアログをインターセプト
        button = page.locator('div[role="button"]:has-text("写真・動画を追加")')
        async with page.expect_file_chooser(timeout=10000) as fc_info:
            await button.first.click()
        file_chooser = await fc_info.value
        await file_chooser.set_files(file_paths)
        await asyncio.sleep(3)  # アップロード処理待ち
        await page.screenshot(path="/tmp/ig-upload-result.png")
        print(f"Uploaded {len(file_paths)} files")

asyncio.run(upload_files(FILE_PATHS))
```

実行:
```bash
$HOME/.browser-use-env/bin/python3 /tmp/pw_upload.py
```

#### carousel の場合

```python
FILE_PATHS = [
    f"{BASE_DIR}/instagram/stills/carousel_01.png",
    f"{BASE_DIR}/instagram/stills/carousel_02.png",
    f"{BASE_DIR}/instagram/stills/carousel_03.png",
]
```

Playwright の `set_files()` は複数ファイルを一括で渡せる。カルーセルの順序はファイルリストの順序に従う（実機検証済み）。

#### reel の場合

```python
FILE_PATHS = [f"{BASE_DIR}/instagram/stills/reel.mp4"]
```

動画アップロードは処理に時間がかかるため、`asyncio.sleep(10)` に延長する。

**前提**: Playwright は browser-use 環境にインストール済み（`$HOME/.browser-use-env/bin/python3 -m pip install playwright`）。Chromium のダウンロードは不要（既存の Chrome に CDP 接続するため）。

### Phase 4: キャプション入力

```bash
$BU state  # テキスト入力欄（contenteditable or textarea）を特定
$BU click <テキスト入力のindex>
```

ClipboardEvent でペースト:
```bash
ENCODED=$(node -e "process.stdout.write(encodeURIComponent(require('fs').readFileSync('<baseDir>/instagram/caption.txt','utf8').trim()))")
$BU eval "
  const editor = document.querySelector('[contenteditable=true]') || document.querySelector('textarea');
  if (editor) {
    editor.focus();
    const text = decodeURIComponent('$ENCODED');
    if (editor.tagName === 'TEXTAREA') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeInputValueSetter.call(editor, text);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      editor.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }
    'pasted ' + text.length + ' chars';
  } else { 'editor not found'; }
"
```

### Phase 5: 予約設定

Meta Business Suite の予約は「公開オプション」から設定する。

#### 5-1. 予約オプションを開く

「投稿する」ボタンの横にあるドロップダウン矢印（▼）をクリック:
```bash
$BU state  # 「投稿する」ボタン付近のドロップダウン/矢印を特定
$BU click <ドロップダウンのindex>
sleep 2
```

「投稿日時を指定」または「スケジュール」をクリック:
```bash
$BU state  # 「投稿日時を指定」メニュー項目を特定
$BU click <スケジュールのindex>
sleep 2
```

#### 5-2. 日時を入力する

Meta Business Suite の日時ピッカーは input type=text（日付）と select（時間）の組み合わせ。

```bash
$BU state  # 日付 input と時刻 select を特定
```

**日付の設定:**
日付 input をクリックしてカレンダーを展開し、JS eval で日付を設定:
```bash
$BU click <日付inputのindex>
sleep 2
# カレンダーの月を合わせる（必要に応じて矢印クリック）
$BU eval "
  const cells = document.querySelectorAll('td,div[role=gridcell]');
  for (const c of cells) {
    if (c.textContent.trim() === '<日>' && c.offsetParent !== null) {
      c.click(); break;
    }
  }
  'clicked <日>'
"
sleep 1
```

**時刻の設定:**
時間と分の select/input を設定:
```bash
$BU state  # 時・分の select or input を特定
# select の場合:
$BU select <時selectのindex> <時の値>
$BU select <分selectのindex> <分の値>
# input の場合は $BU eval で value を直接設定
```

### Phase 6: 予約投稿を実行

```bash
$BU state  # 「投稿日時を指定」「予約する」等の確定ボタンを特定
$BU click <予約ボタンのindex>
sleep 5
```

### Phase 7: 確認 & クリーンアップ

```bash
$BU screenshot /tmp/ig-publish-<contentKey>.png
```

スクリーンショットをユーザーに提示し、結果を報告:
- 予約投稿の成功/失敗
- 投稿タイプ（carousel / reel）
- キャプション（先頭50文字）
- 添付メディアの枚数/種類
- 予約日時

**ブラウザは閉じない**（バッチ実行時にセッションを維持するため）。

### Phase 8: DB 投稿記録

`sns_posts` テーブルに投稿記録を INSERT する:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "INSERT INTO sns_posts (platform, post_type, domain, content_key, caption, media_path, has_link, status, scheduled_at)
   VALUES ('instagram', '<carousel|reel>', '<domain>', '<contentKey>', '<caption先頭100文字>', '<media_path>', <0or1>, 'scheduled', '<YYYY-MM-DD HH:MM>')"
```

## バッチ実行時の注意

- ブラウザを閉じずに連続実行する
- 各投稿後に「予約済み投稿」一覧で日時を検証
- カルーセルの画像順序が正しいか確認（carousel_01 → 02 → 03）
- リール動画のアップロードは時間がかかるため、1件あたり30秒〜1分を見込む

## エラーハンドリング

- **ログインしていない場合**: 手動ログインを案内して停止。認証情報をスクリプトで入力しない
- **要素が見つからない場合**: `$BU state` を再取得し、要素インデックスを再特定。3回試行して失敗したら停止
- **メディアアップロード失敗**: リトライ1回。失敗なら停止
- **キャプションペースト失敗**: 段落ごとに `$BU type` で入力
- **カレンダー月不一致**: 矢印ボタンで月を送る
- **セッション切れ**: `$BU open` で再ナビゲート。ログインページなら停止

## 実機検証済みの知見（2026-03-29）

### 画像アップロード ✅ 解決済み

Meta Business Suite は DOM に `<input type="file">` を生成しない。`browser-use upload` は使えない。

**解決策**: Playwright を browser-use の CDP WebSocket に `connect_over_cdp()` で接続し、`expect_file_chooser()` + `set_files()` でファイルを渡す。Phase 3 の手順を参照。

**試みて失敗したアプローチ（再試行不要）**:
- `browser-use upload` → file input が DOM にない
- `JS eval` で `input[type=file]` 全探索 → 0件
- `browser-use python` 内で CDP `Page.setInterceptFileChooserDialog` → `browser._run()` のイベントループ内で `browser.click()` がデッドロック
- CDP `register.Page.fileChooserOpened` → `session_id` 引数非対応
- CDP `Page.handleFileChooser` → このChromeバージョンでメソッド未実装

### UI 要素の特定方法

インデックスはページロードごとに変わる。毎回 `$BU state` で確認すること。

| 要素 | Playwright locator | 備考 |
|---|---|---|
| 「投稿を作成」ボタン | `div[role="button"]:has-text("投稿を作成")` | ホーム画面 |
| 「写真・動画を追加」ボタン | `div[role="button"]:has-text("写真・動画を追加")` | Playwright で click → expect_file_chooser |
| テキスト入力 | `[contenteditable=true]` or `[aria-label*="テキストを含める"]` | キャプション入力欄 |
| 「日時を設定」トグル | `input[type="checkbox"]` near "Schedule" | 予約設定 |

### その他の制約

- Meta Business Suite の UI は頻繁に変更される — locator が変わった場合は `$BU state` で再調査しこの SKILL.md を更新すること
- カルーセルの画像順序は `set_files()` のリスト順序に従う（実機検証済み）
- 予約投稿の最小単位（5分刻み等）は Meta Business Suite の UI に依存

## 参照

- キャプション生成: `/post-instagram` スキル
- 画像・動画生成: `/render-sns-stills` スキル
- X 予約投稿: `/publish-x` スキル（類似パターン）
- TikTok 予約投稿: `/publish-tiktok` スキル（類似パターン）
- 投稿管理: `sns_posts` テーブル（`packages/database/src/schema/sns_posts.ts`）
