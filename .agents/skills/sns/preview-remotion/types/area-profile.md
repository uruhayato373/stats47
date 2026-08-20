# Type: area-profile（地域プロファイル 強み弱み）

都道府県の強み（上位ランク 5 件）・弱み（下位ランク 5 件）プレビュー用データ。

## 引数

- **areaName** (必須): 対象の都道府県名（例: 東京都）

## 手順

### Step 1: データ取得

DB から対象都道府県の全ランキング順位を取得し:
- **strengths**: ランクが小さい（1 位に近い）指標を 5 件
- **weaknesses**: ランクが大きい（47 位に近い）指標を 5 件

各指標の型:

```typescript
interface AreaProfileIndicator {
  label: string;   // 指標名（例: "昼間人口比率"）
  rank: number;    // 順位（1〜47）
  value: number;   // 値
  unit: string;    // 単位（例: "%"）
}
```

### Step 2: `apps/remotion/src/utils/preview-data-area-profile.ts` を上書き

```typescript
import type { AreaProfileIndicator } from "../shared/types/area-profile";

export interface AreaProfilePreviewData {
  areaName: string;
  strengths: AreaProfileIndicator[];
  weaknesses: AreaProfileIndicator[];
}

export const previewDataAreaProfile: AreaProfilePreviewData = {
  areaName: "<都道府県名>",
  strengths: [
    { label: "<指標名>", rank: 1, value: 0, unit: "<単位>" },
    // ... 5 件
  ],
  weaknesses: [
    { label: "<指標名>", rank: 47, value: 0, unit: "<単位>" },
    // ... 5 件
  ],
};
```

### Step 3: 確認・報告

- 対象都道府県名
- strengths の件数と上位指標
- weaknesses の件数と下位指標

## 対象コンポジション

- `AreaProfileInstagram-Carousel` (1080x1350)
- `AreaProfileOgp` (1200x630)

## 参照

- `apps/remotion/src/utils/preview-data-area-profile.ts`
- `apps/remotion/src/shared/types/area-profile.ts`
