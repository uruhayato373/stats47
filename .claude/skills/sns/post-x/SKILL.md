X (Twitter) 投稿用コンテンツ（テキスト + 画像）を生成してローカル R2 に保存する。

## 引数

ユーザーから以下を確認すること:

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **domain** | - | `ranking` | `ranking` / `compare` / `correlation` |
| **template** | - | ドメインによる | `shock` / `versus` / `question` / `paradox` |

### ranking ドメイン
- **rankingKey**: ランキングキー（必須）

### compare ドメイン
- **areaA**: 地域A のエリアコード（必須、例: `13000`）
- **areaB**: 地域B のエリアコード（必須、例: `27000`）
- **categoryKey**: カテゴリキー（必須、例: `economy`）

### correlation ドメイン
- **rankingKeyX**: X軸ランキングキー（必須）
- **rankingKeyY**: Y軸ランキングキー（必須）

### デフォルトテンプレ

| ドメイン | デフォルト template |
|---|---|
| ranking | `shock` |
| compare | `versus` |
| correlation | `paradox` |

## 共通参照

- プラットフォーム仕様: `docs/10_SNS戦略/02_SNSプラットフォーム仕様.md`（Section 4）
- UTM ルール: `/generate-utm-url` スキル

---

## データ読み込み

### ranking ドメイン

以下の 2 ファイルを読み込む:
```
.local/r2/sns/ranking/<rankingKey>/data.json
.local/r2/sns/ranking/<rankingKey>/ranking_items.json（存在しない場合は data.json で代用）
```

ファイルが存在しない場合は、管理画面（http://localhost:3001/sns-operations）の SNS データ生成ボタンで生成すること。

**算出値:**
- `title` = ranking_items.title ?? data.categoryName
- `unit` = ranking_items.unit ?? data.unit
- `description` = ranking_items.description（指標の定義説明。存在する場合のみ）
- `yearCode` / `yearName` = data から取得
- `pageUrl` = `/generate-utm-url` スキルの UTM ルールに従って生成
- `top3` = rank 昇順先頭3件（ティーザー用）
- `top5` = rank 昇順先頭5件
- `bottom5` = rank 降順先頭5件
- `average` = value の平均（小数第1位）

### compare ドメイン

data.json が存在しない場合、以下で生成する:

```bash
# ローカル D1 から比較データを取得して data.json を生成
node -e "
const { getDrizzle, rankingData, comparisonComponents } = require('@stats47/database/server');
const { eq, and, inArray } = require('drizzle-orm');
const fs = require('fs');
// ... (DB から areaA, areaB の比較データを取得)
// 出力: .local/r2/sns/compare/<areaA>-vs-<areaB>/data.json
"
```

または手動で Web UI の比較ページ（`/compare?areas=<areaA>,<areaB>&cat=<categoryKey>`）からデータを確認して data.json を作成する。

**data.json 構造:**
```json
{
  "areaA": { "areaCode": "13000", "areaName": "東京都" },
  "areaB": { "areaCode": "27000", "areaName": "大阪府" },
  "categoryKey": "economy",
  "categoryName": "経済",
  "indicators": [
    {
      "rankingKey": "taxable-income-per-capita",
      "indicator": "課税対象所得（1人当たり）",
      "unit": "千円",
      "valueA": 1234, "rankA": 1,
      "valueB": 987, "rankB": 3
    }
  ]
}
```

**算出値:**
- `areaNameA` / `areaNameB`
- `pageUrl` = `/generate-utm-url` スキルの UTM ルールに従って生成
- `winCountA` / `winCountB` = 各指標で値が大きい方の勝利数（大きい方が「良い」とは限らないため、ランク上位を勝ちとする）
- `biggestGap` = 順位差が最大の指標

### correlation ドメイン

data.json が存在しない場合、以下で生成する:

```bash
# ローカル D1 から相関データを取得して data.json を生成
node -e "
const { getDrizzle, correlationAnalysis, rankingItems } = require('@stats47/database/server');
const { eq, and } = require('drizzle-orm');
const fs = require('fs');
// ... (DB から correlation pair + ranking_items メタを取得)
// 出力: .local/r2/sns/correlation/<keyX>--<keyY>/data.json
"
```

**data.json 構造:**
```json
{
  "rankingKeyX": "taxable-income-per-capita",
  "rankingKeyY": "suicide-rate-per-100k",
  "titleX": "課税対象所得（1人当たり）",
  "titleY": "自殺死亡率（人口10万人当たり）",
  "unitX": "千円",
  "unitY": "人",
  "pearsonR": 0.45,
  "partialRPopulation": 0.38,
  "partialRArea": 0.42,
  "direction": "positive",
  "scatterData": [
    { "areaCode": "13000", "areaName": "東京都", "x": 1234, "y": 15.3 }
  ]
}
```

**算出値:**
- `titleX` / `titleY`
- `pageUrl` = `/generate-utm-url` スキルの UTM ルールに従って生成
- `rStrength` = |r| > 0.7: 「強い」, > 0.4: 「中程度」, else: 「弱い」
- `direction` = r > 0: 「正の相関」, r < 0: 「負の相関」
- `outliers` = 回帰直線から最も外れる3県

---

## テンプレート定義

template パラメータに応じて構造とトーンを切り替える。

### shock（衝撃事実型）
- 目的: リポスト・引用RTによる拡散
- 適合: ranking, correlation
- 構造: [衝撃の1行フック — 数字で驚かせる] → [データハイライト 2〜3行] → [URL] → [ハッシュタグ]
- フック例: 「年収が高いのに『実質貧困』な県がある。」

### versus（対決型）
- 目的: 引用RTによる議論
- 適合: compare, ranking（1位 vs 47位）
- 構造: [A vs B 対決フレーム] → [比較データ 3〜4項目] → [あなたはどっち派？] → [URL] → [ハッシュタグ]
- フック例: 「東京 vs 大阪、経済力で圧勝するのはどっち？」

### question（問いかけ型）
- 目的: 引用RTでの回答を誘発
- 適合: ranking, correlation
- 構造: [問いかけ1行] → [意外なデータ 2〜3行] → [回答促進CTA]
- フック例: 「あなたの県の自殺率、全国何位か知っていますか？」

### paradox（逆説・警告型）
- 目的: 保存・DM共有による深い関与
- 適合: correlation, ranking
- 構造: [逆説の1行 — 「〇〇なのに△△」構文] → [データで証明 2〜3行] → [警告的CTA] → [URL] → [ハッシュタグ]
- フック例: 「所得が高い県ほど幸福度が低い。この逆説にはワケがある。」

### ドメイン × テンプレ早見表

| | shock | versus | question | paradox |
|---|:---:|:---:|:---:|:---:|
| **ranking** | o | o | o | o |
| **compare** | - | o | o | - |
| **correlation** | o | - | o | o |

---

## テキスト生成

指定された template に応じたプロンプトを構築する。

### ペルソナ

あなたは stats47（都道府県統計データの可視化サービス）のデータネタ師です。統計データから「えっ、マジで？」と思わせる事実を切り出し、思わずシェアしたくなる投稿を作ってください。硬い報道調ではなく、友達に「これ知ってた？」と話しかけるようなカジュアルなトーンで。

### プロンプト構築

1. ペルソナ（上記）
2. データ要約（ドメインに応じた算出値を埋め込み）
3. テンプレ構造（下記「テンプレート定義」の該当テンプレの構造）
4. X プラットフォームルール:
   - 200文字以内（URL含まず）
   - フックの1行目は**主観的な断言**を許容する（「〇〇は〇〇だ」）。断言→データ裏付けの構成がXでは最も拡散する
   - ハッシュタグ 0〜2個（トレンド参加時のみ。多いとスパム判定されやすい）
   - CTA: 「引用で感想を」ではなく**立場を取らせる**誘導。データの特性に応じて以下から選択:
     - 断言→反論誘発型:「〇〇県が最強、異論は引用RTで」
     - 体感確認型:「〇〇県民、体感と合ってる？引用RTで教えて」
     - ニュース接続型:「〇〇が話題だけど、データで見ると…」
     - 意見表明型:「このデータは〇〇を意味している」（主張→反論が引用RTで来る）
     - 穴埋め型:「〇〇県が1位の理由、一言で言うと____」
   - 200文字の制限内で「データ→主張→引用RT誘導」の3要素を入れる
   - ranking ドメインではテキスト中に top3（1〜3位の県名と値）を含めること
   - URL 直貼り（UTMパラメータ付き）
   - displayTitle: 20文字以内のSNS向けタイトル。**「ランキング」を含めないこと**（Remotion テンプレートがサブタイトルに「〇〇年度 都道府県ランキング」を自動表示するため、重複する）。例: ×「緑茶消費量ランキング」→ ○「緑茶消費額」
   - description がある場合、指標の意味を読者に伝わる形で自然に組み込む（例: 「過去1年間に日曜大工をした人の割合」）

### JSON 出力形式

```json
{
  "text": "投稿テキスト（200文字以内）",
  "hashtags": ["#統計"],
  "displayTitle": "20字以内のSNS向け表現"
}
```

---

## 画像生成

| ドメイン | コンポジション | サイズ |
|---|---|---|
| ranking | `RankingX-Chart` | 1200x630 |
| ranking | `RankingX-ChoroplethMap` | 1080x1080 |
| compare | `CompareX-Post` | 1200x630 |
| correlation | `CorrelationX-Scatter` | 1200x630 |

ranking ドメインの場合は `/render-sns-stills` スキルで生成する。

compare / correlation ドメインの場合は対応する Remotion コンポジションで同様に生成。

---

## 出力先

| ドメイン | ディレクトリ |
|---|---|
| ranking | `.local/r2/sns/ranking/<rankingKey>/x/` |
| compare | `.local/r2/sns/compare/<areaA>-vs-<areaB>/x/` |
| correlation | `.local/r2/sns/correlation/<keyX>--<keyY>/x/` |

各ディレクトリに以下を保存:
- `caption.json` — 生成済みテキスト（JSON）
- `caption.txt` — コピペ投稿用テキスト
- `stills/` — 生成済み画像

## 手順

1. data.json を読み込み（存在しなければ生成）、算出値を計算する
2. テンプレ定義とPFルールに基づき、Claude が直接 JSON を生成する
   → 生成した JSON をユーザーに提示して確認・修正する
3. 画像を生成する（生成済みの場合はスキップ）
4. 確定した JSON を `caption.json` に保存する
5. コピペ投稿用の TXT を `caption.txt` に保存する（text + URL + ハッシュタグのみ。X は200文字制限があるため、47都道府県データ等の補足情報は含めない）
6. 生成された画像パスと投稿テキストをユーザーに報告する

## 品質チェックリスト

- [ ] テキストが200文字以内（URL含まず）
- [ ] **1行目に主観的な断言またはデータに基づく主張がある**（漠然とした問いかけだけは不可）
- [ ] **引用RTを誘発するCTAがある**（「感想を」ではなく立場を取らせる誘導）
- [ ] ハッシュタグが0〜2個
- [ ] URL が末尾に含まれている
- [ ] JSON が正しくパースできる
- [ ] displayTitle が20文字以内かつ「ランキング」を含まない
- [ ] URL にUTMパラメータが付与されている
