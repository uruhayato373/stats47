e-Stat API から指定カテゴリのランキングデータを取得する。

## 用途

- ブログ記事・分析用にランキング形式の都道府県データを取得したいとき
- `ranking_items` に登録されていないデータを手動取得したいとき

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

1. 一時スクリプトでデータを取得・整形:

```js
// scripts/temp-fetch-ranking.mjs
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { ProxyAgent } from "undici";
config({ path: path.resolve(process.cwd(), ".env.local") });

const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const fetchOpts = proxyUrl ? { dispatcher: new ProxyAgent(proxyUrl) } : {};

async function fetchEstat(params) {
  const sp = new URLSearchParams({ appId, lang: "J", ...params });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${sp}`;
  const res = await fetch(url, fetchOpts);
  const json = await res.json();
  return json.GET_STATS_DATA?.STATISTICAL_DATA;
}

// --- ここを案件ごとにカスタマイズ ---
const statData = await fetchEstat({
  statsDataId: "<ID>",
  cdCat01: "<CODE>",
  lvArea: "2",
});

const classObjs = [].concat(statData.CLASS_INF.CLASS_OBJ);
const values = [].concat(statData.DATA_INF.VALUE);

// areaMap
const areaMap = new Map();
for (const obj of classObjs) {
  if (obj["@id"] === "area") {
    for (const c of [].concat(obj.CLASS)) areaMap.set(c["@code"], c["@name"]);
  }
}

// 実データの最新年を取得
const times = [...new Set(values.map(v => v["@time"]))].sort().reverse();
const latestTime = times[0];
const yearCode = latestTime.slice(0, 4);

// 都道府県フィルタ + ランク付け
const prefData = values
  .filter(v => v["@time"] === latestTime && /^\d{2}000$/.test(v["@area"]) && v["@area"] !== "00000")
  .map(v => ({ areaCode: v["@area"], areaName: areaMap.get(v["@area"]), value: Number(v.$) }))
  .filter(v => !isNaN(v.value))
  .sort((a, b) => b.value - a.value);

let rank = 1;
for (let i = 0; i < prefData.length; i++) {
  if (i > 0 && prefData[i].value !== prefData[i - 1].value) rank = i + 1;
  prefData[i].rank = rank;
}

const result = {
  rankingKey: "<RANKING_KEY>",
  yearCode,
  yearName: yearCode + "年度",
  categoryName: "<CATEGORY_NAME>",
  unit: "<UNIT>",
  data: prefData,
};

const outputPath = "<OUTPUT_PATH>";
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`Saved: ${outputPath} (${prefData.length} prefectures)`);
```

2. スクリプトの `<...>` プレースホルダーを実パラメータに置換して実行

### Phase 2: 検証

3. 出力データを検証:
   - 47都道府県すべて含まれるか
   - 値が妥当か（Top/Bottom を表示して確認）
   - 年度が正しいか

### Phase 3: 後処理

4. 一時スクリプトを削除
5. 取得結果のサマリーをユーザーに報告

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

## クロスプラットフォーム注意事項

このスキルは Windows / macOS 両環境で使用される。

| 項目 | Windows | macOS |
|---|---|---|
| プロキシ制約 | あり（企業ネットワーク、`undici.ProxyAgent` 必須） | なし（自宅ネットワーク） |
| `ProxyAgent` import | 必須（`HTTP_PROXY` / `HTTPS_PROXY` 環境変数から検出） | 不要（環境変数が未設定なら自動スキップ） |

スクリプトテンプレートの `ProxyAgent` 処理は環境変数の有無で自動判定するため、**コード変更は不要**。

## 注意

- **プロキシ**: 企業ネットワークでは `undici` の `ProxyAgent` が必須（スクリプトテンプレートが自動検出する）
- **時間コード**: メタデータの最新年と実データの最新年は異なる場合がある。必ず実データ側の年で判定する
- **カテゴリ名の接頭辞**: e-Stat のカテゴリ名は `"J250502_保育所等利用待機児童数"` のようにコード接頭辞がつく。`.replace(/^[A-Z]\d+_/, "")` で除去
- **環境変数**: `NEXT_PUBLIC_ESTAT_APP_ID` が `.env.local` に設定されていること
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
