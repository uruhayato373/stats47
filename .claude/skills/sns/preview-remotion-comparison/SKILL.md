---
name: preview-remotion-comparison
description: 実データで Remotion Studio 2地域比較プレビューを上書きする。Use when user says "比較プレビュー", "compare プレビュー". 2地域の指標比較を視覚化.
disable-model-invocation: true
---

実データで Remotion Studio の比較（Compare）プレビュー用データを上書きする。
Studio が HMR で自動反映するため、リアルタイムにプレビューを確認できる。

## 引数

ユーザーから以下を確認すること:
- **areaNameA**: 比較対象の地域A（例: 東京都）
- **areaNameB**: 比較対象の地域B（例: 大阪府）
- **indicators**: 比較指標のリスト（ランキングキーまたは手動指定）

## 手順

### Step 1: データ準備

ユーザーから比較指標を取得する。各指標には以下が必要:

```typescript
interface ComparisonIndicator {
  label: string;   // 指標名（例: "平均年収"）
  unit: string;    // 単位（例: "万円"）
  valueA: number;  // 地域Aの値
  valueB: number;  // 地域Bの値
  rankA: number;   // 地域Aの順位（1〜47）
  rankB: number;   // 地域Bの順位（1〜47）
}
```

DB や `.local/r2/` からデータを取得して構築してもよい。

### Step 2: preview-data-comparison.ts を上書き

`apps/remotion/src/utils/preview-data-comparison.ts` を以下の形式で上書きする。

```typescript
import type { ComparisonIndicator } from "../shared/types/comparison";

export interface ComparisonPreviewData {
  areaNameA: string;
  areaNameB: string;
  indicators: ComparisonIndicator[];
}

export const previewDataComparison: ComparisonPreviewData = {
  areaNameA: "<地域A>",
  areaNameB: "<地域B>",
  indicators: [
    { label: "<指標名>", unit: "<単位>", valueA: 0, valueB: 0, rankA: 0, rankB: 0 },
    // ...
  ],
};
```

### Step 3: 確認

上書き後、ユーザーに以下を報告する:
- 比較対象の地域名
- 指標の件数と内容

## 対象コンポジション

この preview-data を参照するコンポジション:
- `CompareX-Post`（X 投稿用 1200x630）
- `CompareInstagram-Carousel`（Instagram カルーセル 1080x1350）
- `ComparisonOgp`（OGP 画像 1200x630）

## 参照

- `apps/remotion/src/utils/preview-data-comparison.ts` — 上書き対象ファイル
- `apps/remotion/src/shared/types/comparison.ts` — 型定義
