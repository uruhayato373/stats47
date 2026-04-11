---
name: find-quote-rt
description: X のバズツイートを browser-use CLI で検索し stats47 データと照合して引用RT候補を提示する。Use when user says "引用RT", "バズツイート検索", "quote RT". データ画像付き引用RTでインプレッション獲得.
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
   地域差はかなり大きいです。
   https://stats47.jp/ranking/total-fertility-rate」

### 候補 2
...
```

**引用RTテキストの原則:**
- 1〜2行で簡潔に（200文字以内）
- 「ちなみに」「データで見ると」等の補足スタンス
- 具体的な数値（1位/47位）を含める
- **stats47 URL を毎回含める**（`https://stats47.jp/ranking/<ranking_key>`）。UTM パラメータは不要
- ハッシュタグは不要
- **画像は添付しない**（テキストのみ。宣伝臭を避け、元ツイートの文脈に自然に乗る）

### Phase 6: 投稿（--post 指定時のみ）

ユーザーが候補を選択し `--post` が指定されている場合のみ実行。
**Playwright（永続プロファイル）で投稿する。** `/publish-x` と同じ方式。

#### 6a. Playwright で compose ダイアログを開く

引用元 URL をテキスト末尾に含めることで X が自動的に引用カードを生成する。

```typescript
import { chromium } from "playwright";
const PROFILE_DIR = ".local/playwright-x-profile";

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false, viewport: { width: 1280, height: 900 },
  locale: "ja-JP", timezoneId: "Asia/Tokyo",
  args: ["--disable-blink-features=AutomationControlled"],
});
const page = context.pages()[0] || await context.newPage();
await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
```

#### 6b. テキスト入力（引用RTテキスト + stats47 URL + 引用元URL）

画像は添付しない（テキストのみで元ツイートの文脈に自然に乗る）。

```typescript
// 引用テキスト + stats47 URL + 引用元 URL（X が自動で引用カードに変換）
const fullText = `${quoteText}\nhttps://stats47.jp/ranking/${rankingKey}\n\n${tweetUrl}`;
const textbox = page.getByRole("textbox").first();
await textbox.click();
await page.evaluate(async (text) => {
  const item = new ClipboardItem({ "text/plain": new Blob([text], { type: "text/plain" }) });
  await navigator.clipboard.write([item]);
}, fullText);
await page.keyboard.press("Meta+v");
await page.waitForTimeout(2000);
```

#### 6d. 即時投稿

```typescript
const postBtn = page.getByTestId("tweetButton").first();
await postBtn.click({ force: true });
```

#### 6e. DB 投稿記録

```sql
INSERT INTO sns_posts (platform, post_type, domain, content_key, caption, quote_url, has_link, status, posted_at)
VALUES ('x', 'quote_rt', 'ranking', '<content_key>', '<caption先頭100文字>', '<引用元URL>', 1, 'posted', datetime('now', 'localtime'));
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
