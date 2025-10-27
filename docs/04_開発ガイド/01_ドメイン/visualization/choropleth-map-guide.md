---
title: コロプレス地図実装ガイド
created: 2025-10-27
tags:
  - domain/visualization
  - map
  - d3js
  - choropleth
---

# コロプレス地図実装ガイド

## 概要

このドキュメントでは、D3.jsを使用したコロプレス地図（階級区分図）の実装方法と使用例を説明します。

## アーキテクチャ

### ディレクトリ構造

```
src/features/visualization/map/
├── types/              # 型定義
│   └── index.ts       # MapConfig, ChoroplethData等
├── utils/              # ユーティリティ
│   └── color-scale.ts # カラースケール計算
├── d3/                 # D3.js実装
│   └── PrefectureMapD3.tsx
├── components/         # UIコンポーネント
│   └── MapLegend.tsx  # 凡例コンポーネント
├── common/             # 共通ラッパー
│   └── PrefectureMap.tsx
└── index.ts            # エクスポート
```

### コア機能

1. **PrefectureMapD3**: D3.jsベースの地図描画コンポーネント
2. **color-scale.ts**: カラースケール計算とマッピング
3. **MapLegend**: 凡例表示コンポーネント

## 基本的な使用方法

### 1. シンプルなコロプレス地図

```tsx
import { RankingMapCard } from "@/features/ranking";
import type { RankingValue } from "@/features/ranking/types/item";

function PopulationMap() {
  const data: RankingValue[] = [
    { areaCode: "01000", value: 5250000, areaName: "北海道", /* ... */ },
    { areaCode: "13000", value: 14000000, areaName: "東京都", /* ... */ },
    // ...
  ];

  return (
    <RankingMapCard
      data={data}
      colorScheme="interpolateBlues"
      height={600}
    />
  );
}
```

### 2. カスタムカラースキームの使用

```tsx
import { RankingMapCard } from "@/features/ranking";

function CustomColorMap() {
  return (
    <RankingMapCard
      data={populationData}
      colorScheme="interpolateViridis"  // Viridis配色
      height={600}
    />
  );
}
```

利用可能なカラースキーム：

**Sequential（単色グラデーション）**:
- `interpolateBlues`
- `interpolateGreens`
- `interpolateOranges`
- `interpolateReds`
- `interpolatePurples`
- `interpolateGreys`

**Sequential（多色）**:
- `interpolateViridis`
- `interpolatePlasma`
- `interpolateInferno`
- `interpolateMagma`
- `interpolateTurbo`

**Diverging（発散カラースケール）**:
- `interpolateRdBu`（赤-青）
- `interpolateRdYlBu`（赤-黄-青）
- `interpolateRdYlGn`（赤-黄-緑）
- `interpolateBrBG`（茶-青緑）
- `interpolatePuOr`（紫-橙）

### 3. 発散カラースケール（中央値基準）

```tsx
import { RankingMapCard } from "@/features/ranking";

function DivergingMap() {
  return (
    <RankingMapCard
      data={changeRateData}
      colorScheme="interpolateRdBu"
      divergingMidpoint="zero"  // 0を中央値として色分け
      height={600}
    />
  );
}
```

`divergingMidpoint`のオプション:
- `"zero"`: 0を中央値として使用
- `"mean"`: 平均値を中央値として使用
- `"median"`: 中央値を使用
- `数値`: 任意の数値を中央値として指定

### 4. 凡例付き地図

```tsx
import { RankingMapCard } from "@/features/ranking";
import { MapLegend } from "@/features/visualization/map";
import type { ChoroplethData } from "@/features/visualization/map";

function MapWithLegend() {
  const data: RankingValue[] = [/* ... */];

  // RankingValue[]をChoroplethData[]に変換
  const choroplethData: ChoroplethData[] = data.map(item => ({
    areaCode: item.areaCode,
    value: item.value,
    areaName: item.areaName,
  }));

  return (
    <div className="relative">
      <RankingMapCard
        data={data}
        colorScheme="interpolateBlues"
        height={600}
      />

      {/* 凡例を地図上に重ねる */}
      <div className="absolute top-4 right-4">
        <MapLegend
          data={choroplethData}
          colorScheme="interpolateBlues"
          title="人口密度"
          unit="人/km²"
          steps={5}
        />
      </div>
    </div>
  );
}
```

### 5. イベントハンドリング

```tsx
import { RankingMapCard } from "@/features/ranking";
import { useState } from "react";

function InteractiveMap() {
  const [selectedPref, setSelectedPref] = useState<string | null>(null);

  const handlePrefectureClick = (areaCode: string, areaName?: string) => {
    console.log(`選択された都道府県: ${areaName} (${areaCode})`);
    setSelectedPref(areaCode);
  };

  return (
    <div>
      <RankingMapCard
        data={populationData}
        colorScheme="interpolateBlues"
        height={600}
        onPrefectureClick={handlePrefectureClick}
      />

      {selectedPref && (
        <div className="mt-4">
          選択中: {selectedPref}
        </div>
      )}
    </div>
  );
}
```

## 低レベルAPI（高度な使用）

より細かい制御が必要な場合は、PrefectureMapD3を直接使用できます。

```tsx
import { PrefectureMapD3 } from "@/features/visualization/map";
import type { ChoroplethData } from "@/features/visualization/map";

function AdvancedMap() {
  const data: ChoroplethData[] = [
    { areaCode: "01000", value: 100 },
    { areaCode: "13000", value: 500 },
    // ...
  ];

  return (
    <PrefectureMapD3
      width={800}
      height={600}
      data={data}
      colorScheme="interpolateBlues"
      divergingMidpoint="mean"
      strokeColor="#ffffff"
      strokeWidth={1}
      hoverColor="#3b82f6"
      selectedColor="#1d4ed8"
      labelFontSize={12}
      enableAnimation={true}
      animationDuration={300}
      onPrefectureClick={(feature) => {
        console.log(feature.properties.prefName);
      }}
    />
  );
}
```

## カラースケールユーティリティ

直接カラースケール関数を使用する場合：

```tsx
import {
  createColorScale,
  createChoroplethColorMapper,
  createLegendData,
} from "@/features/visualization/map";
import type { ChoroplethData } from "@/features/visualization/map";

// カラースケール関数を作成
const colorScale = createColorScale({
  data: choroplethData,
  colorScheme: "interpolateBlues",
  divergingMidpoint: "zero",
  noDataColor: "#e0e0e0",
});

// 値から色を取得
const color = colorScale(1000); // "#0000ff"のような色文字列

// 地域コードから色を取得する関数を作成
const getColorByAreaCode = createChoroplethColorMapper({
  data: choroplethData,
  colorScheme: "interpolateBlues",
});

const color = getColorByAreaCode("01000"); // 北海道の色

// 凡例データを生成
const legendItems = createLegendData(
  {
    data: choroplethData,
    colorScheme: "interpolateBlues",
  },
  5 // ステップ数
);
```

## データ形式

### RankingValue型（入力データ）

```typescript
interface RankingValue {
  areaCode: string;      // 地域コード（5桁形式、例: "01000"）
  value: number;         // 値
  areaName?: string;     // 地域名（オプショナル）
  timeCode: string;      // 時系列コード
  timeName?: string;     // 時系列名
  unit?: string;         // 単位
  rank?: number;         // ランク
  rankingKey: string;    // ランキングキー
}
```

### ChoroplethData型（内部データ）

```typescript
interface ChoroplethData {
  areaCode: string;      // 地域コード（5桁形式）
  value: number;         // 値
  areaName?: string;     // 地域名（オプショナル）
}
```

## ベストプラクティス

### 1. 適切なカラースケールの選択

- **人口、面積など**: Sequential（単色）スキームを使用
- **増減率、変化量**: Diverging（発散）スキームを使用
- **カテゴリ別データ**: Qualitative（定性的）スキームは未実装

### 2. パフォーマンス最適化

```tsx
import { useMemo } from "react";

function OptimizedMap({ rawData }) {
  // 重い変換処理はuseMemoでキャッシュ
  const choroplethData = useMemo(() => {
    return rawData.map(item => ({
      areaCode: item.areaCode,
      value: item.value,
      areaName: item.areaName,
    }));
  }, [rawData]);

  return (
    <RankingMapCard
      data={choroplethData}
      colorScheme="interpolateBlues"
    />
  );
}
```

### 3. レスポンシブ対応

```tsx
function ResponsiveMap() {
  return (
    <div className="w-full h-[600px]">
      <RankingMapCard
        data={data}
        colorScheme="interpolateBlues"
        height={undefined}  // 親要素のサイズに追従
        className="w-full h-full"
      />
    </div>
  );
}
```

## トラブルシューティング

### 地図が表示されない

1. データの`areaCode`が5桁形式（例: "01000"）になっているか確認
2. TopoJSONデータが正しく読み込まれているか確認
3. ブラウザのコンソールでエラーを確認

### 色が正しく表示されない

1. `colorScheme`の名前が正しいか確認
2. データの`value`が数値型になっているか確認
3. `divergingMidpoint`の設定が適切か確認

### パフォーマンスが遅い

1. `useMemo`でデータ変換をキャッシュ
2. `enableAnimation`を`false`に設定
3. データ量を削減（必要な都道府県のみ）

## 関連ドキュメント

- [visualization.md](./visualization.md) - 可視化ドメイン全体の概要
- [D3.js公式ドキュメント](https://d3js.org/)
- [ColorBrewer](https://colorbrewer2.org/) - カラースキームの参考

## 今後の拡張

- [ ] 市区町村レベルの地図対応
- [ ] アニメーション遷移（年次切り替え）
- [ ] ツールチップ表示
- [ ] エクスポート機能（PNG、SVG）
- [ ] カスタムカラースキームの定義
