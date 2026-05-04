# Type: comparison（2 地域比較）

2 つの都道府県を複数指標で比較するプレビュー用データを上書きする。

## 引数

- **areaNameA** (必須): 比較対象の地域 A（例: 東京都）
- **areaNameB** (必須): 比較対象の地域 B（例: 大阪府）
- **indicators** (必須): 比較指標のリスト（ランキングキー or 手動指定）

## 手順

### Step 1: データ準備

各指標の型:

```typescript
interface ComparisonIndicator {
  label: string;   // 指標名（例: "平均年収"）
  unit: string;    // 単位（例: "万円"）
  valueA: number;  // 地域 A の値
  valueB: number;  // 地域 B の値
  rankA: number;   // 地域 A の順位（1〜47）
  rankB: number;   // 地域 B の順位（1〜47）
}
```

DB または `.local/r2/` から取得して構築してもよい。

### Step 2: `apps/remotion/src/utils/preview-data-comparison.ts` を上書き

```typescript
import type { ComparisonIndicator } from "../shared/types/comparison";

export interface ComparisonPreviewData {
  areaNameA: string;
  areaNameB: string;
  indicators: ComparisonIndicator[];
}

export const previewDataComparison: ComparisonPreviewData = {
  areaNameA: "<地域 A>",
  areaNameB: "<地域 B>",
  indicators: [
    { label: "<指標名>", unit: "<単位>", valueA: 0, valueB: 0, rankA: 0, rankB: 0 },
    // ...
  ],
};
```

### Step 3: 確認・報告

- 比較対象の地域名
- 指標の件数と内容

## 対象コンポジション

- `CompareX-Post` (1200x630)
- `CompareInstagram-Carousel` (1080x1350)
- `ComparisonOgp` (1200x630)

## 参照

- `apps/remotion/src/utils/preview-data-comparison.ts`
- `apps/remotion/src/shared/types/comparison.ts`
