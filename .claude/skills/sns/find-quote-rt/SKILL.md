---
name: find-quote-rt
description: X の直近3日以内のバズツイートを全テーマ並列検索し、鮮度×エンゲージメントで最上位候補を提示する。Use when user says "引用RT", "バズツイート検索", "quote RT". 元スレッドが活発なうちに引用RTで到達を最大化.
disable-model-invocation: true
argument-hint: "[テーマ] [--post]"
---

X の**直近3日以内**のバズツイートを全テーマ並列検索し、stats47 データとマッチングしてスコア上位の引用RT候補を提示する。投稿は手動確認後のセミオート運用。

## 用途

- stats47 に関連する**ホットな**バズツイートを見つけて引用RTしたいとき
- 元ツイートがまだ活発なうちに乗って、引用RT経由の到達を最大化したいとき

## 戦略: 鮮度ファースト

テーマローテーションは**採用しない**。理由:
- ローテで先にテーマを固定すると、その日の最強ツイートを逃すリスクが大きい
- X のエンゲージは投稿後24〜48時間に9割発生するため、鮮度が最重要
- テーマ別の反応分析は `sns_posts.content_key → ranking_items.category_key` の事後集計で十分取れる（観察データ）
- ただし毎回同じテーマに偏らないよう、**直近2件の category_key は避ける**という軽い多様性制約だけ残す

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **テーマ** | - | 全テーマ並列検索 | 明示的にテーマを絞りたい時のみ指定（通常は省略） |
| **--post** | - | false | 指定すると候補選択後に browser-use で引用RT投稿まで実行 |

## テーマカタログ

全テーマのキーワード定義・multi-theme 並列検索用のキーワード集合・多様性制約は `reference/rotation-schedule.md` を参照（ファイル名は歴史的経緯で rotation- のまま）。

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

### Phase 1: 検索戦略

**X 検索クエリの構成（鮮度ファースト）:**
```
<キーワード> min_faves:300 lang:ja -filter:replies since:<3日前の日付>
```

- `min_faves:300` — 300いいね以上。直近3日は累積時間が短いので閾値を低めに
- `lang:ja` — 日本語のみ
- `-filter:replies` — リプライを除外
- `since:YYYY-MM-DD` — **必須**。直近3日以内に制限（鮮度ファースト）

**なぜ3日か:**
- X のツイートはエンゲージの約9割を投稿後24〜48時間に獲得する
- 3日を超えると元スレッドの会話はほぼ沈静化し、引用RTしても到達が伸びない
- 3日以内なら元ツイート作者や既存リプライ参加者にも通知が届きやすい

### Phase 2: 全テーマ並列検索

テーマが引数で指定されていない場合は、`reference/rotation-schedule.md` のテーマカタログから**全テーマのキーワードで並列に検索**する。

```bash
# since は動的に「3日前」を計算（macOS/Linux 両対応）
SINCE=$(date -v-3d +%Y-%m-%d 2>/dev/null || date -d '3 days ago' +%Y-%m-%d)

# テーマごとに検索→スクレイプを順次実行し、結果を統合する
# （browser-use は1プロファイルで直列実行のため並列化は不可、順次ループする）
for THEME_KEYWORDS in "少子化 OR 出生率 OR 人口減少" "年収 OR 給料 OR 賃金 OR 最低賃金" "物価 OR 家賃 OR 地価" "治安 OR 犯罪 OR 交通事故" "医療 OR 医師不足 OR 看護師" "教育 OR 大学 OR 学歴" "観光 OR インバウンド" "農業 OR 米 OR 農家"; do
  QUERY="$THEME_KEYWORDS min_faves:300 lang:ja -filter:replies since:$SINCE"
  ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$QUERY'))")
  $BU open "https://x.com/search?q=$ENCODED&src=typed_query&f=top"
  sleep 4
  # Phase 3 のスクレイプを実行して結果を変数に蓄積
done
```

**結果が不足の場合のフォールバック:**
1. `min_faves` を 200 まで下げる
2. `since` を 5日前まで拡大（3日 → 5日）
3. それでも不足なら `f=live`（最新順）に切り替えて直近高エンゲージを拾う

**明示的にテーマを引数で指定された場合**は、そのテーマのキーワードだけで検索（並列ループ不要）。

### Phase 3: 検索結果のスクレイプ

各テーマの検索ページで、JavaScript eval でツイート情報を一括抽出する。`ageHours` を算出して**72時間(3日)超のツイートは除外**する。

```bash
$BU eval "(() => {
  const articles = document.querySelectorAll('article[role=article]');
  const results = [];
  const now = Date.now();
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const textEl = a.querySelector('[data-testid=tweetText]');
    const text = textEl ? textEl.textContent.trim() : '';
    const engEl = a.querySelector('[role=group]');
    const engLabel = engEl ? engEl.getAttribute('aria-label') : '';
    // aria-label から いいね数・リポスト数・表示数を数値抽出
    const parseNum = (label, keyword) => {
      const m = label.match(new RegExp('(\\\\d[\\\\d,]*) 件の' + keyword));
      return m ? parseInt(m[1].replace(/,/g,''), 10) : 0;
    };
    const likes = parseNum(engLabel, 'いいね');
    const reposts = parseNum(engLabel, 'リポスト');
    const views = parseNum(engLabel, '表示');
    const links = a.querySelectorAll('a[href*=\"/status/\"]');
    let url = '';
    for (const l of links) { if (l.href.indexOf('/status/') >= 0) { url = l.href; break; } }
    const userEl = a.querySelector('[data-testid=User-Name]');
    const user = userEl ? userEl.textContent : '';
    const timeEl = a.querySelector('time');
    const postedAt = timeEl ? timeEl.getAttribute('datetime') : '';
    const ageHours = postedAt ? Math.floor((now - new Date(postedAt).getTime()) / (60*60*1000)) : 99999;
    // 72時間(3日)超のツイートは除外（鮮度ルール）
    if (ageHours > 72) continue;
    results.push({i, user: user.substring(0,30), text: text.substring(0,220), likes, reposts, views, url, postedAt, ageHours});
  }
  return JSON.stringify(results);
})()"
```

**取得される数値フィールド**: `likes`, `reposts`, `views`, `ageHours`。これらは Phase 4 のスコアリングで使う。

### Phase 4: スコアリング + 多様性チェック

全テーマの検索結果を統合し、各候補に**鮮度×エンゲージメント**スコアを付ける。

#### 4a. スコア計算

```
freshness = max(0, (72 - ageHours) / 72)      # 0〜1、投稿直後1.0、72h で0.0
engagement = log10(likes + 1) + log10(views + 1) * 0.3
score = engagement * (0.4 + 0.6 * freshness)  # 鮮度ボーナス 60%
```

- `log10` を使う理由: バズ規模の差をなだらかにし、中堅ツイートも拾えるようにする
- 鮮度重み60%: 同等エンゲージなら新しい方を強く優遇

#### 4b. 多様性制約（直近2件の category_key を避ける）

スコア順に候補を並べた後、以下のSQLで直近2件の category_key を取得:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT ri.category_key FROM sns_posts sp
   LEFT JOIN ranking_items ri ON ri.ranking_key = sp.content_key
   WHERE sp.post_type='quote_rt' AND sp.platform='x'
   ORDER BY sp.posted_at DESC LIMIT 2"
```

候補マッチング(4c)で決まった `ranking_key` の `category_key` がこの直近2件に**含まれる場合は除外**する。ただしスコア上位が全て該当する場合は、多様性制約を緩めて最上位を採用する（鮮度優先）。

#### 4c. ローカル DB（ranking_items）でデータ検索

各候補のツイート内容からキーワードを抽出し、関連する ranking_items を D1 で検索:

```bash
sqlite3 .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite \
  "SELECT ranking_key, ranking_name, category_key FROM ranking_items
   WHERE area_type='prefecture' AND is_active=1
   AND (ranking_name LIKE '%出生%' OR ranking_name LIKE '%少子%' OR ranking_name LIKE '%人口%')
   ORDER BY ranking_name LIMIT 20"
```

キーワードはツイート内容に応じて動的に変更する。同一 `content_key` は過去7日以内に使用していれば除外:

```bash
sqlite3 ... "SELECT content_key FROM sns_posts WHERE post_type='quote_rt' AND posted_at > datetime('now','-7 days')"
```

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
| 鮮度 | **投稿から72時間(3日)以内のツイートのみ対象** |
| 対象 | 300いいね以上（3日制約下での現実的な閾値） |
| 選定 | 全テーマ並列検索→スコア(鮮度×エンゲージ)上位から提示 |
| 多様性 | 直近2件の category_key は避ける（ソフト制約） |
| 比率 | 引用RT 3 : オリジナル投稿 7 |
| URL | 3回に1回程度 stats47.jp リンクを含める |
| スタンス | データで補足・検証する立場。議論に加担しない |

## 避けるべきパターン

- 機械的に大量引用 → アカウント凍結リスク
- 毎回 URL 付き → 宣伝臭でミュートされる
- 元ツイートと無関係なデータ → 逆効果
- 政治的に偏った立場を取る → 炎上リスク
- センシティブなトピック（自殺、差別等）への引用 → ブランド毀損
- **古いツイート(72時間超)への引用RT** → 元スレが沈静化しており到達が伸びない
- **テーマ固定ローテ** → その日の最強ツイートを逃す。鮮度ファースト戦略を優先すること

## 関連スキル

- `/render-sns-stills` — ランキング画像の生成
- `/publish-x` — X への予約投稿
- `/post-x` — X 投稿キャプション生成
- `/generate-utm-url` — UTM パラメータ付き URL 生成
