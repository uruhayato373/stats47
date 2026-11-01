---
name: fetch-estat-data
domain: data
description: e-Stat API から指定カテゴリのランキングデータを取得する。Use when user says "e-Statデータ取得", "fetch-estat-data", "ランキングデータ取って". inspect-estat-meta でパラメータ確定後に使用.
primary_agent: estat-researcher
co_agents: [theme-designer]
---

e-Stat API から指定カテゴリのランキングデータを取得する。

## 用途

- ブログ記事・分析用にランキング形式の都道府県データを取得したいとき
- `indicators` に登録されていないデータを手動取得したいとき

## 事前確認

取得前に `.claude/skills/estat/references/README.md` を確認し、既知のテーブルやコード体系（`#` 付き = 指標テーブル等）を把握すること。該当する調査のリファレンスファイルがあれば、そちらも読むこと。

## 前提

`/inspect-estat-meta` でメタデータ調査が完了し、以下のパラメータが確定していること。

## 引数

ユーザーから以下を確認すること:

- **statsDataId**: e-Stat 統計データ ID（必須）
- **cdCat01**: カテゴリコード（必須、例: `J250502`）
- **output**: 出力先パス（任意、デフォルト: カレントディレクトリ）
- **rankingKey**: 出力 JSON の rankingKey（任意）
- **追加フィルタ**: tab, cdCat02〜 等（複数ディメンションがある場合）

## 手順

### Phase 1: データ取得

1. 共通 API で取得する。`statsDataId`、`cdCat01`、必要な `cdCat02`・`cdTime` などを指定し、返った地域コード・単位をメタデータと照合する。家計調査の県庁所在市に `lvArea=2` を付けない。

```bash
node --input-type=module - '{"statsDataId":"<ID>","cdCat01":"<CODE>","cdTime":"<TIME>"}' <<'JS'
import { fetchStatsData } from "./.claude/scripts/lib/estat-catalog/api.mjs";
const json = await fetchStatsData(JSON.parse(process.argv[2]));
const stat = json.GET_STATS_DATA.STATISTICAL_DATA;
const values = [].concat(stat.DATA_INF.VALUE);
console.log(`rows=${values.length}`);
console.log(JSON.stringify(values.slice(0, 5), null, 2));
JS
```

ランキング用 JSON を作る場合は、取得した `VALUE` から対象年・地域・世帯区分を選び、`/fetch-estat-data` の出力形式に整形する。一時成果物は `/tmp/` に置く。

### Phase 2: 検証

3. 出力データを検証:
   - 47都道府県すべて含まれるか
   - 値が妥当か（Top/Bottom を表示して確認）
   - 年度が正しいか

### Phase 3: 後処理

4. 取得結果のサマリーをユーザーに報告

## 出力形式

```json
{
  "rankingKey": "nursery-waiting-children-rate",
  "yearCode": "2024",
  "yearName": "2024年度",
  "categoryName": "保育所等利用待機児童数",
  "unit": "人",
  "data": [
    { "areaCode": "13000", "areaName": "東京都", "value": 361, "rank": 1 },
    ...
  ]
}
```

- `data` は value 降順ソート（同値タイランク）
- 全47都道府県を含む（`areaCode` = `XX000` 形式、`00000` 除外）

## 複数ディメンションの場合

statsDataId に cat02〜cat15 / tab がある場合（例: 人口移動報告 `0003420482`）:

- `convertToStatsSchema` は cat01 のみ対応のため、直接 VALUES をフィルタ
- 複数カテゴリの合算が必要なら `Map` で都道府県別に集計:

```js
// 例: 年齢3区分の合計
const sumByArea = new Map();
for (const v of values.filter(v => v["@time"] === latestTime)) {
  const area = v["@area"];
  if (!/^\d{2}000$/.test(area) || area === "00000") continue;
  sumByArea.set(area, (sumByArea.get(area) || 0) + Number(v.$));
}
```

## クロスプラットフォーム

共通 API が `HTTP_PROXY` / `HTTPS_PROXY` を検出する。

## 注意

- **時間コード**: メタデータの最新年と実データの最新年は異なる場合がある。必ず実データ側の年で判定する
- **カテゴリ名の接頭辞**: e-Stat のカテゴリ名は `"J250502_保育所等利用待機児童数"` のようにコード接頭辞がつく。`.replace(/^[A-Z]\d+_/, "")` で除去
- **レートリミット**: e-Stat API は公称 60req/min。大量取得時は間隔を空ける

## データ鮮度の落とし穴（取得前に必ず確認）

カテゴリによって都道府県別データの最終更新年が大きく異なる。**記事の信頼性に直結するため、取得後に `yearCode` を必ず確認すること。**

| statsDataId | カテゴリ例 | 実際の最新年 | 備考 |
|---|---|---|---|
| `0000010106` | 年齢別給与（F620209〜F620213） | **2008年頃** | 都道府県別の年齢階級別給与は長期更新なし。記事での使用は慎重に |
| `0000010106` | 共働き世帯・子有無別（F150101〜F150103） | **2005年頃** | 子あり/子なし内訳は更新が止まっている可能性が高い |
| `0000010106` | 労働力人口・就業者数（F1101, F1102） | 2020年 | 国勢調査ベースのため5年に1度の更新 |
| `0000010103` | 県内総生産H27基準（C1125〜） | 2021年 | 公表ラグ約3年。2024年時点で2021年が最新 |
| `0000010103` | 従業者数（情報通信業）（C220711） | 2014年頃 | 長期更新なしの可能性あり |

**対処方針**:
- `/inspect-estat-meta` で `time` ディメンションを確認し、最新年が5年以上前の場合は記事への使用可否をユーザーに確認する
- 古いデータを使用する場合は記事内に「○○年データ」と明記し、最新版との差異に言及する
- `#` プレフィックス付きの cdCat01（例: `#H04102` 家賃）は通常通り扱える（動作上の問題なし）

## 関連スキル

- `/search-estat` — statsDataId を特定する検索
- `/inspect-estat-meta` — メタデータ調査（このスキルの前に使用）
- `/push-r2` — 取得データを R2 にアップロード
