# Type: ranking（ランキング 47 都道府県）

ランキングプレビュー用データを上書きする。

## 引数

- **rankingKey** (必須): `.local/r2/sns/ranking/` 配下のディレクトリ名

## 手順

### Step 1: データ読み込み

1. `.local/r2/sns/ranking/<rankingKey>/data.json`（必須）
2. `.local/r2/sns/ranking/<rankingKey>/ranking_items.json`（任意 — 存在しない場合は data.json のフィールドで代用）

### Step 2: meta + entries を構築

```typescript
const meta = {
  title: rankingItems?.title ?? data.categoryName,
  subtitle: rankingItems?.subtitle ?? undefined,
  unit: rankingItems?.unit ?? data.unit,
  yearName: data.yearName,
  demographicAttr: rankingItems?.demographicAttr ?? undefined,
  normalizationBasis: rankingItems?.normalizationBasis ?? undefined,
};

const entries = data.data.map(d => ({
  rank: d.rank,
  areaCode: d.areaCode,
  areaName: d.areaName,
  value: d.value,
}));
```

### Step 3: `apps/remotion/src/utils/preview-data.ts` を上書き

```typescript
import type { RankingInput } from "../shared/types/ranking";

export const previewData: RankingInput = {
  meta: {
    title: "<title>",
    subtitle: "<subtitle or undefined>",
    unit: "<unit>",
    yearName: "<yearName>",
    demographicAttr: "<demographicAttr or undefined>",
    normalizationBasis: "<normalizationBasis or undefined>",
  },
  entries: [
    { rank: 1, areaCode: "XXXXX", areaName: "XX県", value: 12345 },
    // ... 47 件すべて
  ],
};
```

### Step 4: 確認・報告

- 上書きしたランキングキー
- meta（title / unit / yearName）
- entries 件数（通常 47）

## デフォルトに戻す

```typescript
import type { RankingInput } from "../shared/types/ranking";
import { getDefaultMockRankingData } from "./mock-data";

export const previewData: RankingInput = getDefaultMockRankingData();
```

## 参照

- `apps/remotion/src/utils/preview-data.ts`
- `.local/r2/sns/ranking/<rankingKey>/data.json`
- `.local/r2/sns/ranking/<rankingKey>/ranking_items.json`
