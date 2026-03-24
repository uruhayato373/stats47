# @stats47/svg-builder

静的 SVG チャートを生成するユーティリティパッケージ。

## 基本的な使い方

```ts
import { toSplitItems, generateBarChartSvg } from "@stats47/svg-builder";

const svg = generateBarChartSvg(toSplitItems(data, 5, 5), {
  title: "交通事故死者数ランキング",
  unit: "人（人口10万人あたり）",
});
```

---

## データフロー

すべてのチャートは **`StatsSchema[]`** を起点とする。

```
StatsSchema[]
    │
    │  shared/stats-schema.ts の変換関数
    ├─ toWorstItems / toBestItems / toSplitItems  → generateBarChartSvg()
    ├─ toChoroplethItems                          → generateChoroplethSvg()
    ├─ joinStats(xData, yData)                    → generateScatterSvg()
    │
    │  StatsSchema[] を直接受け取る
    ├─ generateLineSvg()
    └─ generateStackedBarSvg()
```

---

## StatsSchema 型

```ts
interface StatsSchema {
  areaCode: string;     // 都道府県コード or 国コード・年齢コードなど
  areaName: string;
  yearCode: string;     // "2023" など
  yearName: string;     // "2023年度" など
  categoryCode: string; // 指標コード
  categoryName: string; // 指標名
  value: number;
  unit: string;
}
```

`areaCode` / `areaName` は地理的コードに限らず、国コード（`"JP"`）や年齢コホート（`"20-29"`）にも使用する。

---

## 変換ユーティリティ（`shared/stats-schema.ts`）

### 横棒グラフ用

```ts
toWorstItems(data: StatsSchema[], n = 10)
// → ワースト N 件（先頭から）を "1位 ○○" 形式のラベルに変換

toBestItems(data: StatsSchema[], n = 10)
// → ベスト N 件（末尾から逆順）を "1位 ○○" 形式のラベルに変換

toSplitItems(data: StatsSchema[], topN = 5, bottomN = 5)
// → ワースト topN + セパレーター + ベスト bottomN を結合
```

### コロプレスマップ用

```ts
toChoroplethItems(data: StatsSchema[])
// → { code, name, value }[] に変換
```

### 散布図用

```ts
joinStats(xData: StatsSchema[], yData: StatsSchema[])
// → areaCode で JOIN して { name, code, x, y }[] に変換
// ※ 旧 joinRankingData({ data: [...] }) の後継
```

---

## チャート生成関数

### `generateBarChartSvg(items, options)` — 横棒グラフ

```ts
import { toSplitItems, generateBarChartSvg } from "@stats47/svg-builder";

const svg = generateBarChartSvg(toSplitItems(data, 5, 5), {
  title: "交通事故死者数ランキング",
  subtitle: "2023年度 / 人口10万人あたり",
  unit: "人",
  palette: "red",   // "red" | "blue" | "orange"
  xMin: 0,
});
```

### `generateChoroplethSvg(items, options)` — タイルグリッドマップ

```ts
import { toChoroplethItems, generateChoroplethSvg } from "@stats47/svg-builder";

const svg = generateChoroplethSvg(toChoroplethItems(data), {
  title: "交通事故死者数 都道府県マップ",
  unit: "人",
});
```

### `generateScatterSvg(points, options)` — 散布図（回帰直線付き）

```ts
import { joinStats, generateScatterSvg } from "@stats47/svg-builder";

const svg = generateScatterSvg(joinStats(xData, yData), {
  title: "高齢化率 × 交通事故死者数",
  xLabel: "高齢化率（%）",
  yLabel: "死者数（人/10万人）",
});
```

### `generateLineSvg(data, options)` — 多系列折れ線グラフ

```ts
import { generateLineSvg } from "@stats47/svg-builder";

const svg = generateLineSvg(data, {
  title: "女性の年齢階級別正規雇用率（L字カーブ）",
  xKey: "categoryCode",   // X軸に使う次元
  seriesKey: "areaCode",  // 系列に使う次元
  yLabel: "正規雇用率（%）",
  unit: "%",
});
```

`xKey` / `seriesKey` には `"areaCode"` `"yearCode"` `"categoryCode"` のいずれかを指定する。

### `generateStackedBarSvg(data, options)` — 積み上げ棒グラフ

```ts
import { generateStackedBarSvg } from "@stats47/svg-builder";

// 垂直積み上げ（負値対応）
const svg = generateStackedBarSvg(data, {
  title: "実質GDP成長率の寄与度分解",
  xKey: "yearCode",
  seriesKey: "categoryCode",
  unit: "%",
});

// 水平 100% 積み上げ
const svg = generateStackedBarSvg(data, {
  title: "年齢階級別 仕事の価値観",
  xKey: "areaCode",
  seriesKey: "categoryCode",
  unit: "%",
  horizontal: true,
  normalized: true,
});
```

---

## JSON データ形式

e-Stat ランキングデータは `data/` ディレクトリに以下の形式で保存する：

```json
[
  {
    "areaCode": "13000",
    "areaName": "東京都",
    "yearCode": "2023",
    "yearName": "2023年度",
    "categoryCode": "traffic-accident-deaths-per-100k",
    "categoryName": "交通事故死者数（人口10万人あたり）",
    "value": 0.8,
    "unit": "人"
  }
]
```

白書バックデータ（時系列・多系列）も同形式。地理的でないデータは `areaCode` に国コードや年齢コードを使用する。

---

## ファイル構成

```
src/
  shared/
    stats-schema.ts   # StatsSchema 型 + 変換ユーティリティ（全5関数）
    axis.ts           # 軸スケール・目盛り計算
    color.ts          # パレット・カラー定義
    layout.ts         # プロットエリア計算
    regression.ts     # 線形回帰
  charts/
    bar-chart.ts      # generateBarChartSvg
    choropleth.ts     # generateChoroplethSvg
    scatter.ts        # generateScatterSvg
    line.ts           # generateLineSvg（StatsSchema[] を直接受け取る）
    stacked-bar.ts    # generateStackedBarSvg（StatsSchema[] を直接受け取る）
  tables/
    ranking-table.ts  # generateRankingTableSvg
```
