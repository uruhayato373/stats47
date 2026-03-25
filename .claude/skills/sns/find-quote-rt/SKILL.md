---
name: find-quote-rt
description: X (Twitter) のバズツイートを browser-use CLI で検索し、stats47 データと照合して引用RT候補を提示する
disable-model-invocation: true
argument-hint: "[テーマ] [--post]"
---

X のバズツイートを検索し、stats47 のランキングデータとマッチングして引用RT候補を提示する。投稿は手動確認後のセミオート運用。

## 用途

- stats47 に関連するバズツイートを見つけて引用RTしたいとき
- データ画像付きの引用RTでインプレッション・フォロワーを伸ばしたいとき

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **テーマ** | - | 全テーマ | 検索テーマ（下記テーマ一覧から選択 or 自由入力） |
| **--post** | - | false | 指定すると候補選択後に browser-use で引用RT投稿まで実行 |

## テーマ一覧

| テーマ | 検索キーワード | 関連カテゴリ |
|---|---|---|
| 人口 | 少子化, 出生率, 人口減少, 高齢化 | population |
| 年収 | 年収, 給料, 給与, 賃金, 最低賃金 | laborwage |
| 物価 | 物価, 家賃, 地価, 不動産 | construction, economy |
| 治安 | 治安, 犯罪, 交通事故, 詐欺 | safetyenvironment |
| 医療 | 医療, 医師不足, 病院, 看護師 | socialsecurity |
| 移住 | 移住, 地方創生, 田舎暮らし | population, construction |
| 教育 | 教育, 大学, 学歴, 偏差値 | educationsports |
| 格差 | 格差, 貧困, 生活保護 | economy, socialsecurity |
| 家計 | 食費, 節約, 家計, 貯蓄 | economy |
| 結婚 | 離婚, 結婚, 婚姻率, 未婚 | population |

テーマ未指定時は上位3テーマをローテーションで検索する。

## 前提条件

1. browser-use CLI がインストール済み:
   ```bash
   export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
   browser-use doctor
   ```
2. Chrome に X ログイン済みセッション（Profile 5）
3. ローカル D1 に ranking_items データあり

## 手順

### Phase 0: 環境準備

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile 'Profile 5'"
```

### Phase 1: 検索キーワード決定

引数のテーマから検索キーワードを決定する。テーマ一覧を参照。

**X 検索クエリの構成:**
```
<キーワード> min_faves:1000 lang:ja -filter:replies
```

- `min_faves:1000` — 1,000いいね以上のバズツイート
- `lang:ja` — 日本語のみ
- `-filter:replies` — リプライを除外
- テーマが広い場合はキーワードを組み合わせる（例: `少子化 OR 出生率 min_faves:1000 lang:ja`）

### Phase 2: X 検索実行

```bash
# URL エンコードした検索クエリで X 検索を開く
QUERY="少子化 OR 出生率 min_faves:1000 lang:ja -filter:replies"
ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$QUERY'))")
$BU open "https://x.com/search?q=$ENCODED&src=typed_query&f=top"
sleep 5
```

### Phase 3: 検索結果のスクレイプ

```bash
$BU screenshot /tmp/x-search-results.png
```

スクリーンショットを確認し、表示されたツイートから以下を抽出:
- ツイート本文（テーマとの関連性を確認）
- いいね数・RT数（エンゲージメントの高さ）
- ツイートURL（引用RT用）
- 投稿者アカウント

**抽出方法**: `$BU state` で DOM を確認し、ツイート要素のテキストを取得。DOM 構造は頻繁に変わるため、毎回 `$BU state` で確認すること。

代替方法: スクリーンショット画像を目視で確認し、手動でツイート情報を記録してもよい。

### Phase 4: ranking_items マッチング

ツイート内容のキーワードから、関連する ranking_items を D1 で検索:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT ranking_key, ranking_name, category_key FROM ranking_items
   WHERE area_type='prefecture' AND is_active=1
   AND (ranking_name LIKE '%出生%' OR ranking_name LIKE '%少子%' OR ranking_name LIKE '%人口%')
   ORDER BY ranking_name LIMIT 20"
```

キーワードはツイート内容に応じて動的に変更する。

### Phase 5: 候補リスト提示

以下の形式でユーザーに候補を提示する:

```
## 引用RT候補

### 候補 1
- 元ツイート: @xxx「ツイート本文...」(♥ 5,200)
- URL: https://x.com/xxx/status/123456
- マッチデータ: 合計特殊出生率 (total-fertility-rate)
- 引用RTテキスト案:
  「ちなみに都道府県別の合計特殊出生率で見ると、1位は沖縄県(1.70)、47位は東京都(1.04)。
   地域差はかなり大きいです。」
- 添付画像: /ranking/total-fertility-rate のコロプレスマップ

### 候補 2
...
```

**引用RTテキストの原則:**
- 1〜2行で簡潔に（280文字制限）
- 「ちなみに」「データで見ると」等の補足スタンス
- 具体的な数値（1位/47位）を含める
- stats47 URL は3回に1回程度（毎回付けない）
- ハッシュタグは不要

**添付画像の選定:**
- コロプレスマップ（地図）を最優先 — タイムラインで目を引く
- 既存の SNS 画像があればそれを使用: `.local/r2/sns/ranking/<key>/x/stills/`
- なければ `/render-sns-stills` で生成を提案

### Phase 6: 投稿（--post 指定時のみ）

ユーザーが候補を選択し `--post` が指定されている場合のみ実行。

```bash
# 1. 引用RT用 URL を構成
TWEET_URL="https://x.com/xxx/status/123456"

# 2. X コンポーザを開く
$BU open "https://x.com/intent/post?url=$TWEET_URL"
sleep 5
$BU state

# 3. テキスト入力（ClipboardEvent）
TEXT_FILE=/tmp/x-quote-rt-text.txt
echo "引用RTテキスト" > "$TEXT_FILE"
ENCODED=$(node -e "process.stdout.write(encodeURIComponent(require('fs').readFileSync('$TEXT_FILE','utf8').trim()))")
$BU eval "
  const editor = document.querySelector('[contenteditable=true]');
  if (editor) {
    editor.focus();
    const text = decodeURIComponent('$ENCODED');
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    editor.dispatchEvent(event);
  }
"
sleep 2

# 4. 画像添付
$BU state  # input[type=file] のインデックスを確認
$BU upload <index> <画像の絶対パス>
sleep 3

# 5. スクリーンショットで確認
$BU screenshot /tmp/x-quote-rt-preview.png
```

スクリーンショットをユーザーに提示し、投稿確認を取る。確認後:

```bash
# 6. 投稿ボタンクリック
$BU state  # 投稿ボタンのインデックスを確認
$BU click <index>
sleep 3
$BU screenshot /tmp/x-quote-rt-done.png
```

## 運用ルール

| 項目 | ルール |
|---|---|
| 頻度 | 1日2〜3件まで（スパム判定回避） |
| 対象 | 1,000いいね以上のバズツイート |
| 比率 | 引用RT 3 : オリジナル投稿 7 |
| URL | 3回に1回程度 stats47.jp リンクを含める |
| スタンス | データで補足・検証する立場。議論に加担しない |

## 避けるべきパターン

- 機械的に大量引用 → アカウント凍結リスク
- 毎回 URL 付き → 宣伝臭でミュートされる
- 元ツイートと無関係なデータ → 逆効果
- 政治的に偏った立場を取る → 炎上リスク
- センシティブなトピック（自殺、差別等）への引用 → ブランド毀損

## 関連スキル

- `/render-sns-stills` — ランキング画像の生成
- `/publish-x` — X への予約投稿
- `/post-x` — X 投稿キャプション生成
- `/generate-utm-url` — UTM パラメータ付き URL 生成
