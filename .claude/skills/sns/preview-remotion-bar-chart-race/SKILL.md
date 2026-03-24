`.local/r2/sns/bar-chart-race/<rankingKey>/` の config.json + data.json から Remotion Studio のプレビューファイルを上書きする。
Studio が HMR で自動反映するため、リアルタイムにプレビューを確認できる。

## 引数

ユーザーから以下を確認すること:
- **rankingKey**: ランキングキー（必須）— `.local/r2/sns/bar-chart-race/` 配下のディレクトリ名

## 手順

### Step 1: JSON 読み込み

以下の 2 ファイルを読み込む:

1. `.local/r2/sns/bar-chart-race/<rankingKey>/config.json`（必須）
2. `.local/r2/sns/bar-chart-race/<rankingKey>/data.json`（必須）

いずれかが存在しない場合は、先に `/generate-bar-chart-race` スキルでデータを生成するよう案内する。

config.json の形式:
```json
{
  "title": "都道府県別 総人口ランキング",
  "unit": "人",
  "hookText": "東京一極集中の50年",
  "eventLabels": [{ "year": "1995", "label": "阪神大震災" }],
  "enableSpoilerHook": true
}
```

data.json の形式:
```json
{
  "frames": [
    { "date": "1975年度", "items": [{ "name": "東京都", "value": 11674000 }] }
  ]
}
```

### Step 2: preview-data-bar-chart-race.ts を上書き

`apps/remotion/src/utils/preview-data-bar-chart-race.ts` を以下の形式で上書きする。
**import 文は型のみ**。config.json と data.json を結合してリテラルとして埋め込む。

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
- `undefined` のフィールド（enableSpoilerHook が false/未設定）はオブジェクトから省略する
- JSON のデータをそのまま TypeScript リテラルに変換する

### Step 3: 確認

上書き後、ユーザーに以下を報告する:
- 上書きしたランキングキー
- title, unit
- 年度範囲（例: 1975年度 〜 2024年度）
- フレーム数（年度数）
- 各フレームの items 件数
- hookText
- eventLabels

## デフォルトに戻す

実データからモック状態に戻す場合は、`preview-data-bar-chart-race.ts` を以下に上書きする:

```typescript
// Studio プレビュー用データ（Bar Chart Race）。
// デフォルトはモックデータ。`/preview-remotion-bar-chart-race` スキルで実データに上書きされる。

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

- `apps/remotion/src/utils/preview-data-bar-chart-race.ts` — 上書き対象ファイル
- `.local/r2/sns/bar-chart-race/<rankingKey>/config.json` — 設定ファイル
- `.local/r2/sns/bar-chart-race/<rankingKey>/data.json` — フレームデータ
- `apps/remotion/src/shared/components/shorts/BarChartRaceIntro.tsx` — イントロシーン（hookText 表示）
- `apps/remotion/src/shared/components/charts/BarChartRaceScene.tsx` — レースシーン（eventLabels 表示）
- `apps/remotion/src/shared/utils/mock-bar-chart-race-data.ts` — モックデータ
- `apps/remotion/src/Root.tsx` — Composition 定義（barChartRacePreviewData を参照）
