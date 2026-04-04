---
name: generate-all-sns
description: 指定ランキングキーの全 SNS コンテンツ（data.json → キャプション → 動画・画像）を一括生成する。Use when user says "SNS一括生成", "全SNS生成". data.json → キャプション → レンダリングをワンストップ実行.
disable-model-invocation: true
argument-hint: <rankingKey> [--skip-render] [--skip-captions]
user-invocable: true
---

指定したランキングキーの全 SNS コンテンツを一括生成する統合スキル。
data.json 生成 → 全プラットフォームのキャプション生成 → 全動画・画像レンダリングをワンストップで実行する。

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **rankingKey** | 必須 | - | ランキングキー |
| **--skip-render** | - | false | キャプションのみ生成（レンダリングをスキップ） |
| **--skip-captions** | - | false | レンダリングのみ実行（キャプション生成をスキップ） |

## 生成される全ファイル

ベースディレクトリ: `.local/r2/sns/ranking/<rankingKey>/`

### YouTube Short（youtube-short/）

| ファイル | 内容 |
|---|---|
| `shorts-a.mp4` | A版（32秒 / 上位5件+全47件テーブル） |
| `shorts-b.mp4` | B版（55秒 / 全47件高速・モーション無し） |
| `shorts.json` | タイトル・説明・hookText・クイズ |
| `shorts.txt` | コピペ投稿用（全47都道府県+偏差値） |
| `pinned_comment.txt` | ピン留めコメント |
| `quizzes.txt` | YouTube Studio クイズ用 |

## 手順

### Step 1: data.json の確認・生成

`.local/r2/sns/ranking/<rankingKey>/data.json` が存在するか確認する。
存在しない場合、ローカル D1 から生成する:

```bash
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const DB_PATH = '.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH, { readonly: true });
const KEY = '<rankingKey>';
const item = db.prepare(\"SELECT title, subtitle, unit, description, demographic_attr, normalization_basis, latest_year FROM ranking_items WHERE ranking_key = ? AND area_type = 'prefecture' AND is_active = 1\").get(KEY);
const latestYear = JSON.parse(item.latest_year);
const rows = db.prepare(\"SELECT area_code, area_name, value, rank FROM ranking_data WHERE category_code = ? AND area_type = 'prefecture' AND year_code = ? ORDER BY rank ASC\").all(KEY, latestYear.yearCode);
const dir = '.local/r2/sns/ranking/' + KEY;
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dir + '/data.json', JSON.stringify({ categoryCode: KEY, categoryName: item.title, yearCode: latestYear.yearCode, yearName: latestYear.yearName, unit: item.unit, data: rows.map(r => ({ rank: r.rank, areaCode: r.area_code, areaName: r.area_name, value: r.value })) }, null, 2));
const itemsJson = { title: item.title };
if (item.subtitle) itemsJson.subtitle = item.subtitle;
itemsJson.unit = item.unit;
if (item.description) itemsJson.description = item.description;
if (item.demographic_attr) itemsJson.demographicAttr = item.demographic_attr;
if (item.normalization_basis) itemsJson.normalizationBasis = item.normalization_basis;
fs.writeFileSync(dir + '/ranking_items.json', JSON.stringify(itemsJson, null, 2));
db.close();
"
```

### Step 2: データ分析

data.json を読み込み、以下を算出する:

- TOP3 / 最下位の県名・値
- 1位と47位の倍率・差額
- 意外な県（イメージと乖離がある順位）
- ranking_items.json の subtitle（データの定義。「年間」「二人以上世帯」等の注記が必要か確認）

### Step 3: キャプション一括生成

以下の2プラットフォーム分を順次生成する。hookText と displayTitle は全プラットフォーム共通にする。

**hookText のルール**（15文字以内）:
- 常識の逆転・意外性を最優先（例:「年収1位は東京じゃない」「大阪の財政が危険水域」）
- 単なる数字の差（「○倍の地域差」）は弱いので避ける
- 「○○県民、自覚ある？」「理由わかる？」等のコメント誘導要素も有効

**displayTitle のルール**（20文字以内）:
- 「ランキング」を含めない（Remotion が自動表示するため）
- subtitle に「年間」「二人以上世帯」等の注記がある場合は displayTitle に含める

**生成順序**:
1. **X** `caption.json` + `caption.txt`（`/post-x` の仕様に従う）
2. **YouTube** `shorts.json` + `shorts.txt` + `pinned_comment.txt` + `quizzes.txt`（`/post-youtube` の仕様に従う）

### Step 4: レンダリング

ディレクトリを作成し、props を生成して2コンポジションを並列レンダリングする。

```bash
KEY="<rankingKey>"
BASE=".local/r2/sns/ranking/$KEY"
mkdir -p "$BASE/youtube-short" "$BASE/x/stills"
```

**props 生成**（x/caption.json から hookText・displayTitle を読み込む）:

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$BASE/data.json','utf8'));
const caption = JSON.parse(fs.readFileSync('$BASE/x/caption.json','utf8'));
let itemMeta = {};
try { itemMeta = JSON.parse(fs.readFileSync('$BASE/ranking_items.json','utf8')); } catch {}
const meta = { title: itemMeta.title || data.categoryName, subtitle: itemMeta.subtitle, unit: itemMeta.unit || data.unit, yearName: data.yearName, demographicAttr: itemMeta.demographicAttr, normalizationBasis: itemMeta.normalizationBasis };
const allEntries = data.data.map(d => ({ rank: d.rank, areaCode: d.areaCode, areaName: d.areaName, value: d.value }));
const base = { theme:'dark', hookText: caption.hookText||'', displayTitle: caption.displayTitle, meta, allEntries };
fs.writeFileSync('/tmp/props-a.json', JSON.stringify({ ...base, variant:'youtube-short' }));
fs.writeFileSync('/tmp/props-b.json', JSON.stringify({ ...base, variant:'youtube-short-full' }));
"
```

**2並列レンダリング**（`apps/remotion/` で実行）:

```bash
cd apps/remotion
npx remotion render src/index.ts RankingYouTube-Short "$BASE/youtube-short/shorts-a.mp4" --props /tmp/props-a.json &
npx remotion render src/index.ts RankingYouTube-Short-Full "$BASE/youtube-short/shorts-b.mp4" --props /tmp/props-b.json &
wait
```

### Step 5: 完了報告

生成されたファイル一覧とサイズを報告する。

## 古いファイルの扱い

既存ファイルがある場合、Step 4 の前に古い動画・画像・キャプションファイルを削除する:

```bash
find "$BASE" -name "*.mp4" -o -name "*.png" -o -name "shorts.json" -o -name "shorts.txt" -o -name "pinned_comment.txt" -o -name "quizzes.txt" -o -name "caption.txt" | xargs rm -f
```

ただし `data.json`、`ranking_items.json`、`instagram/caption.json` は削除しない（キャプション再利用のため）。

## 注意事項

- hookText は全プラットフォーム共通。X の caption.json に定義し、YouTube でも同じ値を使う
- 消費支出系のランキングは subtitle に「二人以上世帯・県庁所在市の年間消費支出額」等の注記があるため、キャプションに明記すること

## 参照

- キャプション個別生成: `/post-x`, `/post-youtube`
- レンダリング詳細: `/render-sns-stills`
- データプレビュー: `/preview-remotion`
- UTM パラメータ: `/generate-utm-url`
