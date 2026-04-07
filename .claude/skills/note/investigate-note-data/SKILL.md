---
name: investigate-note-data
description: note 記事（B/C/D シリーズ）のデータ調査・分析を行う。Use when user says "noteデータ調査", "データ分析", "相関分析". 相関・地域パターン・チャート候補を定量化.
disable-model-invocation: true
---

note 記事（B/C/D シリーズ）のデータ調査・分析。相関分析・地域パターン・強み弱みを定量化し、チャート候補を決定する。

> **A シリーズ（ランキング記事・量産型）はこの4ステップワークフローの対象外です。** A シリーズは自動生成スキルで処理するため、validate → investigate → design → write → edit の手順は不要です。

## 用途

- 記事の裏付けとなる定量的根拠を DB から収集・分析したいとき
- メイン指標と関連指標の相関を発見したいとき
- 地域パターン（7地方区分）の傾向を把握したいとき
- 記事に掲載するチャートの種類・データを決定したいとき

## フロー

```
/validate-note-idea → ★/investigate-note-data → /design-note-structure → /write-note-section → /edit-note-draft
```

## 引数

ユーザーから以下を確認すること:

- **articleId**: 記事ID（必須）— 例: `B-1`, `C-1`, `D-1`
- **rankingKeys**: メインの指標（1〜3個）— 例: `total-fertility-rate`, `food-expenditure-per-month`
- **relatedKeys**: 関連指標（任意）— ユーザー指定 or Phase 2 で自動検索

## DB 接続

全フェーズで以下のパスの SQLite を使用する:

```js
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
```

## 手順

### Phase 1: メインデータ収集

1. `ranking_items` からメタデータを取得:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const items = db.prepare(\"SELECT ranking_key, title, subtitle, unit, category_key, latest_year, available_years FROM ranking_items WHERE ranking_key IN ('<KEY1>', '<KEY2>') AND area_type = 'prefecture'\").all();
console.log(JSON.stringify(items, null, 2));
db.close();
"
```

2. `ranking_data` から全47都道府県データを取得（最新年を使用）:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const rows = db.prepare(\"SELECT area_code, area_name, year_code, value, rank FROM ranking_data WHERE category_code = '<RANKING_KEY>' AND area_type = 'prefecture' AND year_code = '<YEAR>' ORDER BY value DESC\").all();
console.log(JSON.stringify(rows, null, 2));
console.log('Count:', rows.length);
db.close();
"
```

**注意**: `ranking_data` テーブルでは `category_code` カラムが `ranking_key` に対応する。

3. 同カテゴリの関連ランキングを検索:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const related = db.prepare(\"SELECT ranking_key, title, unit, latest_year FROM ranking_items WHERE category_key = '<CATEGORY_KEY>' AND area_type = 'prefecture' AND is_active = 1 AND ranking_key != '<MAIN_KEY>' ORDER BY ranking_key LIMIT 30\").all();
console.log(JSON.stringify(related, null, 2));
db.close();
"
```

### Phase 2: 相関分析

#### 2-1. 既存の相関データを確認

`correlation_analysis` テーブル（82,000件超）に事前計算済みのピアソン相関係数がある。まず既存データを確認する:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
// メインキーとの相関が強い指標を検索（|r| > 0.5）
const corrs = db.prepare(\"SELECT ranking_key_x, ranking_key_y, year_x, year_y, pearson_r, partial_r_population, partial_r_area, partial_r_aging, partial_r_density FROM correlation_analysis WHERE (ranking_key_x = '<MAIN_KEY>' OR ranking_key_y = '<MAIN_KEY>') AND ABS(pearson_r) > 0.5 ORDER BY ABS(pearson_r) DESC LIMIT 30\").all();
console.log(JSON.stringify(corrs, null, 2));
console.log('Strong correlations found:', corrs.length);
db.close();
"
```

`correlation_analysis` テーブルのカラム:
- `ranking_key_x`, `ranking_key_y`: 2指標のランキングキー
- `year_x`, `year_y`: 各指標のデータ年
- `pearson_r`: ピアソン相関係数
- `partial_r_population`: 人口で偏相関（人口の影響を除いた相関）
- `partial_r_area`: 面積で偏相関
- `partial_r_aging`: 高齢化率で偏相関
- `partial_r_density`: 人口密度で偏相関
- `scatter_data`: JSON 形式の散布図データ

#### 2-2. DB にない組み合わせの相関を計算

既存データにない指標の組み合わせは、Node.js で直接計算する:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

function pearsonCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);
  const sumY2 = y.reduce((a, yi) => a + yi * yi, 0);
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

// 2指標の47都道府県データを取得
const keyX = '<KEY_X>';
const keyY = '<KEY_Y>';
const yearX = '<YEAR_X>';
const yearY = '<YEAR_Y>';

const dataX = db.prepare('SELECT area_code, value FROM ranking_data WHERE category_code = ? AND area_type = ? AND year_code = ?').all(keyX, 'prefecture', yearX);
const dataY = db.prepare('SELECT area_code, value FROM ranking_data WHERE category_code = ? AND area_type = ? AND year_code = ?').all(keyY, 'prefecture', yearY);

// area_code でマッチング
const mapY = new Map(dataY.map(r => [r.area_code, r.value]));
const paired = dataX.filter(r => mapY.has(r.area_code)).map(r => ({ area_code: r.area_code, x: r.value, y: mapY.get(r.area_code) }));

const x = paired.map(p => p.x);
const y = paired.map(p => p.y);
const r = pearsonCorrelation(x, y);
console.log('Pearson r:', r.toFixed(4), '(n=' + paired.length + ')');

db.close();
"
```

#### 2-3. 仮説検証

**`/validate-note-idea` や `/design-note-structure` で立てた仮説（「〇〇と△△は関連がある」等）を、相関データで明示的に検証する。**

手順:
1. `plan.md` から暗黙的・明示的な仮説を抽出する（例: 「婚姻率が高い県は出生率も高い」）
2. 各仮説について相関係数を確認する
3. 結果を以下の3段階で分類する:
   - **支持** (|r| >= 0.5): 仮説通り。記事で取り上げ可能
   - **弱い支持** (0.3 <= |r| < 0.5): 控えめな表現でのみ記事に記載可能
   - **棄却** (|r| < 0.3): **仮説は誤り。記事での主張を禁止**

4. **棄却された仮説は `research.md` で目立つように記載する:**
   ```
   ### ⚠ 棄却された仮説
   - 「婚姻率が高い県は出生率も高い」→ r = -0.09（ほぼ無相関）**← 記事での主張禁止**
   ```

5. 棄却された仮説に代わる、データに基づいた発見を提示する（例: 「初婚年齢の方が出生率との関連が強い (r = -0.60)」）

**教訓**: B-3（出生率）では「婚姻率と出生率の関連」が前提だったが、r=-0.09 でほぼ無相関だった。「常識的にそうだろう」という思い込みは相関データで必ず検証すること。

#### 2-4. 相関分析の結果をまとめる

- 相関が強い指標（|r| > 0.5）をピックアップ
- 偏相関も確認し、見かけの相関（人口・面積に起因）を除外
- 記事で取り上げる相関ペアを決定（シリーズ別の深度に応じて数を調整）
- **棄却された仮説も明記**（執筆・編集時の誤り防止のため）

### Phase 3: 地域パターン分析

7地方区分で平均値を算出し、地域間の差を分析する。

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

// 7地方区分マッピング（area_code → 地方名）
const regionMap = {
  '01000': '北海道',
  '02000': '東北', '03000': '東北', '04000': '東北', '05000': '東北', '06000': '東北', '07000': '東北',
  '08000': '関東', '09000': '関東', '10000': '関東', '11000': '関東', '12000': '関東', '13000': '関東', '14000': '関東',
  '15000': '中部', '16000': '中部', '17000': '中部', '18000': '中部', '19000': '中部', '20000': '中部', '21000': '中部', '22000': '中部', '23000': '中部',
  '24000': '近畿', '25000': '近畿', '26000': '近畿', '27000': '近畿', '28000': '近畿', '29000': '近畿', '30000': '近畿',
  '31000': '中国', '32000': '中国', '33000': '中国', '34000': '中国', '35000': '中国',
  '36000': '四国', '37000': '四国', '38000': '四国', '39000': '四国',
  '40000': '九州沖縄', '41000': '九州沖縄', '42000': '九州沖縄', '43000': '九州沖縄', '44000': '九州沖縄', '45000': '九州沖縄', '46000': '九州沖縄', '47000': '九州沖縄',
};

const rows = db.prepare(\"SELECT area_code, area_name, value FROM ranking_data WHERE category_code = '<RANKING_KEY>' AND area_type = 'prefecture' AND year_code = '<YEAR>'\").all();

// 地方別集計
const regionStats = {};
for (const r of rows) {
  const region = regionMap[r.area_code];
  if (!region) continue;
  if (!regionStats[region]) regionStats[region] = { values: [], areas: [] };
  regionStats[region].values.push(r.value);
  regionStats[region].areas.push(r.area_name);
}

const regionOrder = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州沖縄'];
for (const region of regionOrder) {
  const s = regionStats[region];
  if (!s) continue;
  const avg = s.values.reduce((a, b) => a + b, 0) / s.values.length;
  const min = Math.min(...s.values);
  const max = Math.max(...s.values);
  console.log(region + ': 平均=' + avg.toFixed(2) + ', 最小=' + min.toFixed(2) + ', 最大=' + max.toFixed(2) + ' (n=' + s.values.length + ')');
}

// 全国平均
const allValues = rows.map(r => r.value);
const nationalAvg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
console.log('\\n全国平均:', nationalAvg.toFixed(2));

db.close();
"
```

**追加分類（必要に応じて）:**

- **太平洋側 / 日本海側**: 気候・産業構造の違いが影響する指標向け
  - 太平洋側: 宮城、福島、茨城、千葉、東京、神奈川、静岡、愛知、三重、和歌山、大阪、兵庫、岡山、広島、山口、徳島、高知、大分、宮崎、鹿児島
  - 日本海側: 青森、秋田、山形、新潟、富山、石川、福井、京都、鳥取、島根
- **内陸**: 栃木、群馬、埼玉、山梨、長野、岐阜、滋賀、奈良

地域間の差が大きい指標を特定し、記事の「なぜこの地域は〜」の切り口に活用する。

### Phase 4: 強み・弱み分析（D シリーズ向け）

D シリーズで特定の都道府県を深掘りする場合、複数指標の偏差値を算出して強み・弱みを特定する。

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

const targetAreaCode = '<AREA_CODE>'; // 例: '13000'（東京都）
const keys = ['<KEY1>', '<KEY2>', '<KEY3>', '<KEY4>', '<KEY5>'];
const years = ['<YEAR1>', '<YEAR2>', '<YEAR3>', '<YEAR4>', '<YEAR5>'];

const results = [];
for (let i = 0; i < keys.length; i++) {
  const rows = db.prepare('SELECT area_code, value FROM ranking_data WHERE category_code = ? AND area_type = ? AND year_code = ?').all(keys[i], 'prefecture', years[i]);
  const values = rows.map(r => r.value);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const stddev = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / n);

  const target = rows.find(r => r.area_code === targetAreaCode);
  if (!target) { console.log(keys[i] + ': データなし'); continue; }

  const deviation = stddev === 0 ? 50 : 50 + 10 * (target.value - mean) / stddev;
  const item = db.prepare('SELECT title, unit FROM ranking_items WHERE ranking_key = ? AND area_type = ?').get(keys[i], 'prefecture');
  results.push({ key: keys[i], title: item?.title || keys[i], value: target.value, unit: item?.unit || '', deviation: deviation.toFixed(1), rank: rows.sort((a, b) => b.value - a.value).findIndex(r => r.area_code === targetAreaCode) + 1 });
}

// 偏差値でソート（高い順）
results.sort((a, b) => parseFloat(b.deviation) - parseFloat(a.deviation));
console.log('\\n=== 強み（偏差値が高い指標） ===');
results.filter(r => parseFloat(r.deviation) >= 55).forEach(r => console.log(r.title + ': 偏差値' + r.deviation + ' (値=' + r.value + r.unit + ', ' + r.rank + '位)'));
console.log('\\n=== 弱み（偏差値が低い指標） ===');
results.filter(r => parseFloat(r.deviation) <= 45).forEach(r => console.log(r.title + ': 偏差値' + r.deviation + ' (値=' + r.value + r.unit + ', ' + r.rank + '位)'));

db.close();
"
```

**偏差値の計算式**: `偏差値 = 50 + 10 * (value - mean) / stddev`

- 偏差値 >= 60: 顕著な強み
- 偏差値 55〜60: やや強み
- 偏差値 40〜45: やや弱み
- 偏差値 <= 40: 顕著な弱み

### Phase 5: チャート候補の決定

分析結果から、記事に適したチャートを提案する。

**チャート種類と svg-builder の対応:**

| 分析結果 | チャート種類 | svg-builder 関数 |
|---|---|---|
| 相関が強い2指標 | 散布図 | `generateScatterSvg(joinStats(xData, yData), options)` |
| ランキング上位下位 | 横棒グラフ | `generateBarChartSvg(toSplitItems(data, 5, 5), options)` |
| 地域パターン | コロプレス地図 | `generateChoroplethSvg(toChoroplethItems(data), options)` |
| 時系列データ | 折れ線グラフ | `generateLineSvg(data, options)` |
| カバー画像 | Remotion | `RankingNote-Cover` コンポジション |

**シリーズ別の推奨チャート枚数:**

| シリーズ | チャート枚数 | 推奨構成 |
|---|---|---|
| B（考察） | 1〜2枚 | 横棒グラフ（メインランキング）+ オプションで散布図 or マップ |
| C（調査ガイド） | 2〜3枚 | 横棒グラフ + タイルグリッドマップ + 散布図 |
| D（深掘り） | 3〜4枚 | 散布図 + 横棒グラフ + コロプレス地図 + 折れ線（時系列） |

各チャートについて以下を決定する:
- チャート種類
- 使用するランキングキーとデータ年
- 記事内の配置箇所（どのセクションに挿入するか）
- タイトル・ラベル

### Phase 6: 出力

調査結果を以下のファイルに保存する:

```
docs/31_note記事原稿/<slug>/_data/
├── research.md      ← 人間が読む分析レポート
└── chart-data.json  ← チャート生成用の構造化データ
```

#### chart-data.json（必須）

**チャート生成（`/generate-note-charts`）で使用する構造化データを JSON で保存すること。** DB から取得・加工したデータを再取得せずにチャート生成できるようにする。

```json
{
  "_meta": {
    "articleId": "<articleId>",
    "slug": "<slug>",
    "generatedAt": "<ISO 8601>",
    "source": "investigate-note-data"
  },
  "charts": [
    {
      "id": "chart-1",
      "type": "bar|scatter|choropleth|line|rankingTable",
      "title": "<チャートタイトル>",
      "section": "<配置セクション名>",
      "rankingKey": "<使用するランキングキー>",
      "year": "<データ年>",
      "unit": "<単位>",
      "data": [
        { "areaCode": "01", "areaName": "北海道", "value": 12345 }
      ]
    }
  ],
  "raw": {
    "<rankingKey>": [
      { "areaCode": "01", "areaName": "北海道", "value": 12345, "rank": 1 }
    ]
  }
}
```

- `charts[]`: Phase 5 で決定したチャート候補ごとにデータを格納
- `raw`: DB から取得した生データ（チャート以外の用途でも再利用可能）
- 散布図の場合は `data` に `{ areaCode, areaName, x, y }` 形式で格納

**research.md の構成:**

```markdown
# <articleId> データ調査結果

## 使用データ

| ランキングキー | 指標名 | データ年 | 単位 |
|---|---|---|---|
| <key> | <title> | <year> | <unit> |

## 相関分析結果

| 指標X | 指標Y | ピアソン r | 偏相関（人口） | 偏相関（密度） | 備考 |
|---|---|---|---|---|---|
| <keyX> | <keyY> | 0.XXX | 0.XXX | 0.XXX | ... |

### 記事で取り上げる相関ペア
- ...

## 地域パターン分析

| 地方 | 平均値 | 最小値 | 最大値 | 特徴 |
|---|---|---|---|---|
| 北海道 | ... | ... | ... | ... |
| 東北 | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |

### 特筆すべき地域パターン
- ...

## 強み・弱み分析（D シリーズのみ）

| 指標 | 値 | 偏差値 | 順位 | 評価 |
|---|---|---|---|---|
| ... | ... | ... | ... | 強み/弱み |

## チャート候補

| # | 種類 | 使用データ | タイトル | 配置箇所 |
|---|---|---|---|---|
| 1 | 横棒グラフ | <key>（<year>年） | ... | セクション2 |
| 2 | 散布図 | <keyX> x <keyY> | ... | セクション3 |
| ... | ... | ... | ... | ... |
```

## シリーズ別の分析深度

| シリーズ | 相関分析 | 地域パターン | 強み弱み | チャート枚数 |
|---|---|---|---|---|
| B（考察） | 1〜2指標 | 7地方区分 | なし | 1〜2枚 |
| C（調査ガイド） | 2〜3指標 | 7地方区分 | なし | 2〜3枚 |
| D（深掘り） | 3〜5指標 | 7地方区分+追加分類 | あり | 3〜4枚 |

- **B シリーズ**: 1つのメイン指標について、関連する1〜2指標との相関を確認。地域パターンは7地方区分のみ。
- **C シリーズ**: 調査に含まれる複数指標を横断的に分析。2〜3組の相関ペアを提示。
- **D シリーズ**: 社会課題を多角的に分析。3〜5組の相関ペア + 特定都道府県の強み弱み分析。偏相関も積極的に活用して見かけの相関を排除。

## 参照

- note 戦略: `docs/30_note記事企画/note戦略.md`
- チャート生成: `.claude/skills/note/generate-note-charts/SKILL.md`
- Remotion 画像: `.claude/skills/sns/render-sns-stills/SKILL.md`
- ranking_items スキーマ: `packages/database/src/schema/ranking_items.ts`
- correlation_analysis スキーマ: `packages/database/src/schema/correlation_analysis.ts`
