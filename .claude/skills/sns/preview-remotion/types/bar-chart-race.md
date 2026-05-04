# Type: bar-chart-race（Bar Chart Race アニメーション）

`.local/r2/sns/bar-chart-race/<rankingKey>/` の config.json + data.json から Bar Chart Race のプレビュー用データを上書きする。

## 引数

- **rankingKey** (必須): `.local/r2/sns/bar-chart-race/` 配下のディレクトリ名

## 前提

`config.json` または `data.json` が存在しない場合は、先に `/generate-bar-chart-race` でデータを生成するよう案内する。

## 手順

### Step 1: JSON 読み込み

1. `.local/r2/sns/bar-chart-race/<rankingKey>/config.json`
   ```json
   {
     "title": "都道府県別 総人口ランキング",
     "unit": "人",
     "hookText": "東京一極集中の50年",
     "eventLabels": [{ "year": "1995", "label": "阪神大震災" }],
     "enableSpoilerHook": true
   }
   ```
2. `.local/r2/sns/bar-chart-race/<rankingKey>/data.json`
   ```json
   {
     "frames": [
       { "date": "1975年度", "items": [{ "name": "東京都", "value": 11674000 }] }
     ]
   }
   ```

### Step 2: `apps/remotion/src/utils/preview-data-bar-chart-race.ts` を上書き

```typescript
import type { BarChartRaceFrame } from "@stats47/visualization";
import type { EventLabel } from "../shared/utils/bar-chart-race";

export interface BarChartRacePreviewData {
  title: string;
  unit: string;
  frames: BarChartRaceFrame[];
  eventLabels: EventLabel[];
  hookText?: string;
  enableSpoilerHook?: boolean;
}

export const barChartRacePreviewData: BarChartRacePreviewData = {
  title: "<config.title>",
  unit: "<config.unit>",
  frames: [
    // data.json の frames をそのまま展開
  ],
  eventLabels: [
    // config.json の eventLabels をそのまま展開
  ],
  hookText: "<config.hookText>",
  // enableSpoilerHook: true の場合のみ含める
};
```

注意:
- `enableSpoilerHook` が false / 未設定なら省略
- JSON のデータをそのまま TypeScript リテラルに変換

### Step 3: 確認・報告

- ランキングキー
- title / unit
- 年度範囲（例: 1975 〜 2024）
- フレーム数
- 各フレームの items 件数
- hookText
- eventLabels

## デフォルトに戻す

```typescript
import type { BarChartRaceFrame } from "@stats47/visualization";
import type { EventLabel } from "../shared/utils/bar-chart-race";
import {
  MOCK_BAR_CHART_RACE_FRAMES,
  MOCK_EVENT_LABELS,
} from "../shared/utils/mock-bar-chart-race-data";

export interface BarChartRacePreviewData {
  title: string;
  unit: string;
  frames: BarChartRaceFrame[];
  eventLabels: EventLabel[];
  hookText?: string;
  enableSpoilerHook?: boolean;
}

export const barChartRacePreviewData: BarChartRacePreviewData = {
  title: "都道府県別 人口ランキング",
  unit: "千人",
  frames: MOCK_BAR_CHART_RACE_FRAMES,
  eventLabels: MOCK_EVENT_LABELS,
};
```

## 参照

- `apps/remotion/src/utils/preview-data-bar-chart-race.ts`
- `.local/r2/sns/bar-chart-race/<rankingKey>/config.json`, `data.json`
- `apps/remotion/src/shared/components/shorts/BarChartRaceIntro.tsx` — イントロ（hookText）
- `apps/remotion/src/shared/components/charts/BarChartRaceScene.tsx` — レース（eventLabels）
- `apps/remotion/src/shared/utils/mock-bar-chart-race-data.ts`
- `apps/remotion/src/Root.tsx` — Composition 定義
