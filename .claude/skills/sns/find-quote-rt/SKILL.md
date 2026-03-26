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

JavaScript eval でツイート情報を一括抽出する:

```bash
$BU eval "
  const articles = document.querySelectorAll('article[role=article]');
  const results = [];
  articles.forEach((a, i) => {
    const textEl = a.querySelector('[data-testid=tweetText]');
    const text = textEl ? textEl.textContent.trim().substring(0, 120) : '(no text)';
    const engEl = a.querySelector('[role=group]');
    const eng = engEl ? engEl.getAttribute('aria-label') : '';
    const linkEls = a.querySelectorAll('a[href*=\"/status/\"]');
    let url = '';
    linkEls.forEach(l => { if (l.href.includes('/status/') && !url) url = l.href; });
    const userEl = a.querySelector('[data-testid=User-Name] a');
    const user = userEl ? userEl.textContent : '';
    results.push({i, user: user.substring(0,30), text, eng: eng.substring(0,80), url});
  });
  JSON.stringify(results, null, 2);
"
```

これで各ツイートの本文・エンゲージメント・URL・投稿者が JSON で取得できる。

### Phase 4: データマッチング

#### 4a. ローカル DB（ranking_items）で検索

ツイート内容のキーワードから、関連する ranking_items を D1 で検索:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT ranking_key, ranking_name, category_key FROM ranking_items
   WHERE area_type='prefecture' AND is_active=1
   AND (ranking_name LIKE '%出生%' OR ranking_name LIKE '%少子%' OR ranking_name LIKE '%人口%')
   ORDER BY ranking_name LIMIT 20"
```

キーワードはツイート内容に応じて動的に変更する。

#### 4b. e-Stat API で追加データを検索（DB にない場合）

DB にピッタリの指標がない場合、e-Stat API で直接データを探す。特に以下の統計は都道府県別×詳細分類のデータが豊富:

| 統計 | statsDataId 例 | 内容 |
|---|---|---|
| 賃金構造基本統計調査（職種別） | `0003445758` | 130超の職種別賃金（都道府県別） |
| 社会・人口統計体系 | `0000010101`〜`0000010111` | 人口・経済・治安・教育 etc. |

```bash
# e-Stat 検索例
curl -s "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=$ESTAT_KEY&searchWord=職種+賃金&limit=5"
```

e-Stat で良いデータが見つかった場合は `/register-ranking` でランキングアイテムに登録することを提案する。

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

**添付画像の選定（優先順）:**
1. 既存の SNS 画像があればそれを使用: `.local/r2/sns/ranking/<key>/x/stills/`
2. 都道府県別データ → Remotion `RankingX-Chart` で生成（`--props` で JSON を渡す）
3. 全国レベルの比較データ → SVG 棒グラフを手書き → `sharp` で PNG 変換
4. なければ `/render-sns-stills` で生成を提案

**SVG→PNG 変換（Remotion 不要の場合）:**
```bash
node -e "
const sharp = require('sharp');
const fs = require('fs');
const svg = fs.readFileSync('/tmp/chart.svg', 'utf8');
sharp(Buffer.from(svg), { density: 72 }).png().toFile('/tmp/chart.png');
"
```
- X 画像サイズ: 1200×630
- `stats47.jp` ブランディングを右下に入れる

### Phase 6: 投稿（--post 指定時のみ）

ユーザーが候補を選択し `--post` が指定されている場合のみ実行。

```bash
# 1. 引用RT用 URL を構成
TWEET_URL="https://x.com/xxx/status/123456"

# 2. X コンポーザを開く
$BU open "https://x.com/intent/post?url=$TWEET_URL"
sleep 6
```

#### テキスト入力

`$BU type` コマンドで入力する。ClipboardEvent は X の React で無視されるため使わない。

```bash
# 3. カーソルを末尾に移動してテキスト入力
$BU keys End
sleep 1
$BU keys Enter
sleep 1
$BU type "引用RTテキスト本文"
```

URL を含める場合は追加で:
```bash
$BU keys Enter
sleep 1
$BU type "https://stats47.jp/ranking/<ranking_key>"
```

#### 画像添付

```bash
# 4. input[type=file] のインデックスを取得してアップロード
IDX=$($BU state 2>&1 | grep 'input.*file' | head -1 | sed 's/.*\[\([0-9]*\)\].*/\1/')
$BU upload "$IDX" "<画像の絶対パス>"
sleep 3
```

#### 投稿確認 → 送信（即時投稿の場合）

```bash
# 5. スクリーンショットで確認
$BU screenshot /tmp/x-quote-rt-preview.png
```

スクリーンショットをユーザーに提示し、投稿確認を取る。確認後:

```bash
# 6. ポストボタンのインデックスを特定してクリック
BTN=$($BU state 2>&1 | grep -B1 'ポストする$' | head -1 | sed 's/.*\[\([0-9]*\)\].*/\1/')
$BU click "$BTN"
sleep 5
$BU screenshot /tmp/x-quote-rt-done.png
```

#### 予約投稿の場合

予約投稿する場合は `/publish-x` スキルの Phase 4-5 に従う。

**⚠ 重要**: 予約ダイアログには「確認する」と「予約投稿ポスト」の2つのボタンがある。
- 「確認する」 → 日時バリデーションのみ（クリック不要）
- 「予約投稿ポスト」 → **こちらをクリック**してスケジュール確定

「確認する」だけ押してダイアログを閉じると、スケジュール未設定のまま「ポストする」=即時投稿になるので注意。

```bash
$BU state | grep -B1 '予約投稿ポスト$'
$BU click <予約投稿ポストのindex>
```

**注意**: X の DOM は頻繁に変わる。以下の方法は動作しない:
- `$BU eval` で `btn.click()` / `dispatchEvent` → React のイベントハンドラが反応しない
- `$BU keys "Ctrl+Enter"` / `"Meta+Enter"` → コンポーザでは効かない
- `data-testid="tweetButton"` は `$BU state` に表示されない（shadow DOM 内）

確実な方法は **`$BU state` の出力から `grep -B1` でインデックスを取得し `$BU click`** すること。

#### DB 投稿記録

投稿成功後、`sns_posts` テーブルに記録する:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "INSERT INTO sns_posts (platform, post_type, domain, content_key, caption, quote_url, has_link, status, posted_at)
   VALUES ('x', 'quote_rt', 'ranking', '<content_key>', '<caption先頭100文字>', '<引用元URL>', <0or1>, 'posted', datetime('now', 'localtime'))"
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
