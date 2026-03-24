実データで Remotion Studio プレビュー用データを上書きする。
Studio が HMR で自動反映するため、リアルタイムにプレビューを確認できる。

## 引数

ユーザーから以下を確認すること:
- **rankingKey**: ランキングキー（必須）— `.local/r2/sns/ranking/` 配下のディレクトリ名

## 手順

### Step 1: データ読み込み

以下のファイルを読み込む:

1. `.local/r2/sns/ranking/<rankingKey>/data.json`（必須）
2. `.local/r2/sns/ranking/<rankingKey>/ranking_items.json`（任意 — 存在しない場合は `data.json` のフィールドで代用）

### Step 2: meta + entries を構築

`data.json` と `ranking_items.json`（存在する場合）から以下を構築する:

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

### Step 3: preview-data.ts を上書き

`apps/remotion/src/utils/preview-data.ts` を以下の形式で上書きする。
**import 文は型のみ**。データはリテラルとして埋め込む。

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
    // ... 47件すべて
  ],
};
```

注意:
- `undefined` のフィールドはオブジェクトから省略する
- 値が文字列の場合はダブルクォートでエスケープする
- entries は 47 件すべて含める

### Step 4: 確認

上書き後、ユーザーに以下を報告する:
- 上書きしたランキングキー
- meta の内容（title, unit, yearName）
- entries の件数

## デフォルトに戻す

実データから元のモック状態に戻す場合は、`preview-data.ts` を以下に上書きする:

```typescript
// Studio プレビュー用データ。
// デフォルトはモックデータ。`/preview-remotion` スキルで実データに上書きされる。

import type { RankingInput } from "../shared/types/ranking";
import { getDefaultMockRankingData } from "./mock-data";

export const previewData: RankingInput = getDefaultMockRankingData();
```

## 参照

- `apps/remotion/src/utils/preview-data.ts` — 上書き対象ファイル
- `.local/r2/sns/ranking/<rankingKey>/data.json` — ランキングデータ
- `.local/r2/sns/ranking/<rankingKey>/ranking_items.json` — ランキング項目メタデータ
