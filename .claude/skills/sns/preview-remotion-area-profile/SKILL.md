実データで Remotion Studio の地域プロファイル（Area Profile）プレビュー用データを上書きする。
Studio が HMR で自動反映するため、リアルタイムにプレビューを確認できる。

## 引数

ユーザーから以下を確認すること:
- **areaName**: 対象の都道府県名（例: 東京都）

## 手順

### Step 1: データ取得

DB から対象都道府県のランキングデータを取得し、強み（上位ランク）と弱み（下位ランク）を抽出する。

各指標には以下が必要:

```typescript
interface AreaProfileIndicator {
  label: string;   // 指標名（例: "昼間人口比率"）
  rank: number;    // 順位（1〜47）
  value: number;   // 値
  unit: string;    // 単位（例: "%"）
}
```

- **strengths**: ランクが小さい（1位に近い）指標を5件
- **weaknesses**: ランクが大きい（47位に近い）指標を5件

### Step 2: preview-data-area-profile.ts を上書き

`apps/remotion/src/utils/preview-data-area-profile.ts` を以下の形式で上書きする。

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
    // ... 5件
  ],
  weaknesses: [
    { label: "<指標名>", rank: 47, value: 0, unit: "<単位>" },
    // ... 5件
  ],
};
```

### Step 3: 確認

上書き後、ユーザーに以下を報告する:
- 対象の都道府県名
- strengths の件数と上位指標
- weaknesses の件数と下位指標

## 対象コンポジション

この preview-data を参照するコンポジション:
- `AreaProfileInstagram-Carousel`（Instagram カルーセル 1080x1350）
- `AreaProfileOgp`（OGP 画像 1200x630）

## 参照

- `apps/remotion/src/utils/preview-data-area-profile.ts` — 上書き対象ファイル
- `apps/remotion/src/shared/types/area-profile.ts` — 型定義
