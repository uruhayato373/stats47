---
title: D3.js コロプレス地図描画ガイド
created: 2025-10-14
updated: 2025-10-16
tags:
  - D3js
---

# D3.js コロプレス地図描画ガイド

## 概要

このドキュメントでは、`src/data/jp_pref.l.topojson`のデータ構造を踏まえて、D3.js で日本の都道府県コロプレス地図を描画する実装ガイドを提供します。

## 目次

1. [TopoJSON データ構造の解説](#1-topojsonデータ構造の解説)
2. [必要なライブラリとインストール](#2-必要なライブラリとインストール)
3. [基本的な実装手順](#3-基本的な実装手順)
4. [データマッピングの詳細](#4-データマッピングの詳細)
5. [カラースケールの実装](#5-カラースケールの実装)
6. [投影法とスケール設定](#6-投影法とスケール設定)
7. [インタラクティブ機能](#7-インタラクティブ機能)
8. [エラーハンドリング](#8-エラーハンドリング)
9. [アクセシビリティ対応](#9-アクセシビリティ対応)
10. [実装例](#10-実装例)

## 1. TopoJSON データ構造の解説

### TopoJSON フォーマットの概要

TopoJSON は、GeoJSON を効率的に圧縮した地理データフォーマットです。座標の重複を排除し、arcs（弧）として共有することで、ファイルサイズを大幅に削減できます。

### `jp_pref.l.topojson`の具体的な構造

#### メタデータ（ライセンス、データソース）

```json
{
  "type": "Topology",
  "id": "iso3166-1:jp",
  "metadata": {
    "type": ["行政区境界"],
    "dc:title": "日本 都道府県:低解像度TopoJSON",
    "dc:source": "N03-23_01_230101.shp含め47ファイル",
    "dc:issued": "2023-01-01",
    "dc:subject": ["N03", "行政区域", "政策区域", "行政区境界"],
    "cc:license": "http://creativecommons.org/licenses/by-sa/4.0/",
    "cc:useGuidelines": "http://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03.html",
    "cc:attributionText": "国土交通省「国土数値情報（行政区域データ）」をもとにNIIが加工",
    "cc:attributionURL": "http://nlftp.mlit.go.jp/ksj/"
  }
}
```

#### bbox（境界ボックス）

```json
"bbox": [122.93267356, 20.42276189, 153.9866572, 45.557235]
```

- 最小経度: 122.93267356
- 最小緯度: 20.42276189
- 最大経度: 153.9866572
- 最大緯度: 45.557235

#### transform（座標変換）

```json
"transform": {
  "scale": [0.00003105401469401469, 0.00002513449824449824],
  "translate": [122.93267356, 20.42276189]
}
```

- `scale`: 座標のスケール係数（経度、緯度）
- `translate`: 座標のオフセット（最小経度、最小緯度）

#### objects.pref（都道府県ジオメトリ）

```json
"objects": {
  "pref": {
    "type": "GeometryCollection",
    "geometries": [
      {
        "type": "MultiPolygon",
        "arcs": [[[0, 1, 2, 3, 4, 5]], [[6]], ...],
        "id": "北海道",
        "properties": {
          "N03_001": "北海道",
          "N03_007": "01"
        }
      }
    ]
  }
}
```

#### プロパティ構造

- `id`: 都道府県名（例: "北海道"）
- `properties.N03_001`: 都道府県名（例: "北海道"）
- `properties.N03_007`: 都道府県コード（2 桁、例: "01"）

## 2. 必要なライブラリとインストール

### パッケージインストール

```bash
npm install d3 topojson-client topojson-specification geojson
npm install --save-dev @types/d3 @types/topojson-specification
```

### ライブラリの役割

- **d3**: コア機能、地図投影、カラースケール
- **topojson-client**: TopoJSON→GeoJSON 変換
- **topojson-specification**: 型定義
- **geojson**: GeoJSON 型定義

## 3. 基本的な実装手順

### 1. TopoJSON データの読み込み

```typescript
import * as d3 from "d3";
import { feature } from "topojson-client";
import { Topology } from "topojson-specification";

const topojsonData = await d3.json<Topology>(
  "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson"
);
```

### 2. GeoJSON への変換

```typescript
const objectKey = Object.keys(topojsonData.objects)[0];
const japanGeo = feature(topojsonData, topojsonData.objects[objectKey]);
const japan = japanGeo as FeatureCollection<Geometry>;
```

### 3. 統計データとの結合

```typescript
const prefectureData = new Map<string, FormattedValue>();
data.forEach((d) => {
  if (d.areaCode && d.areaCode !== "00000" && d.value !== null) {
    const prefCode = d.areaCode.replace(/^0+/, "").padStart(2, "0");
    prefectureData.set(prefCode, d);
  }
});
```

### 4. 地図投影の設定

```typescript
const projection = d3
  .geoMercator()
  .center([137, 38])
  .scale(1200)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);
```

### 5. カラースケールの生成

```typescript
const validValues = data
  .filter((d) => d.areaCode !== "00000" && d.value !== null)
  .map((d) => d.value!);

const [minValue, maxValue] = d3.extent(validValues) as [number, number];

const colorScale = d3
  .scaleSequential()
  .domain([minValue, maxValue])
  .interpolator(d3[options.colorScheme]);
```

### 6. SVG 要素の描画

```typescript
const svg = d3.select(svgRef.current);

svg
  .attr("width", "100%")
  .attr("height", "auto")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

svg
  .selectAll("path")
  .data(japan.features)
  .enter()
  .append("path")
  .attr("d", path)
  .attr("fill", (d) => {
    const data = prefectureData.get(d.id);
    return data ? colorScale(data.value!) : "#f0f0f0";
  });
```

### 7. インタラクティブ機能の追加

```typescript
svg
  .selectAll("path")
  .on("mouseover", (event, d) => {
    const data = prefectureData.get(d.id);
    if (data) {
      setHoveredData({
        prefecture: d.id,
        value: formatRankingValueDisplay(data),
        x: event.pageX,
        y: event.pageY,
      });
    }
  })
  .on("mouseout", () => {
    setHoveredData(null);
  });
```

## 4. データマッピングの詳細

### 都道府県コードの正規化

e-Stat API から取得される`areaCode`は 5 桁（例: "01000"）ですが、TopoJSON の`N03_007`は 2 桁（例: "01"）です。

```typescript
// 5桁コードを2桁に正規化
const prefCode = d.areaCode.replace(/^0+/, "").padStart(2, "0");
```

### 複数のキーでのマッピング戦略

データの結合を確実にするため、複数のキーでマッピングを行います：

```typescript
const prefectureData = new Map<string, FormattedValue>();

data.forEach((d) => {
  if (d.areaCode && d.areaCode !== "00000" && d.value !== null) {
    // 1. コードベース（"01", "02", ...）
    const prefCode = d.areaCode.replace(/^0+/, "").padStart(2, "0");
    prefectureData.set(prefCode, d);

    // 2. 名前ベース（"北海道", "青森県", ...）
    if (d.areaName) {
      prefectureData.set(d.areaName, d);

      // 3. 正規化名（"北海道", "青森", ...）
      const normalizedName = d.areaName.replace(/[都道府県]$/, "");
      prefectureData.set(normalizedName, d);
    }
  }
});
```

### 全国データの除外

統計データには全国データ（`areaCode=00000`）が含まれるため、これを除外します：

```typescript
data.filter((d) => d.areaCode !== "00000" && d.value !== null);
```

## 5. カラースケールの実装

### 順次カラースキーム

単一の値の大小を表現する場合：

```typescript
const colorScale = d3
  .scaleSequential()
  .domain([minValue, maxValue])
  .interpolator(d3.interpolateBlues);
```

利用可能なスキーム：

- `interpolateBlues`
- `interpolateGreens`
- `interpolateReds`
- `interpolateOranges`
- `interpolatePurples`
- `interpolateGreys`

### 発散カラースキーム

中央値からの乖離を表現する場合：

```typescript
const isDivergingScheme = options.colorScheme.includes("RdBu");

if (isDivergingScheme) {
  let midpoint: number;

  switch (options.divergingMidpoint) {
    case "zero":
      midpoint = 0;
      break;
    case "mean":
      midpoint = d3.mean(validValues) || 0;
      break;
    case "median":
      midpoint = d3.median(validValues) || 0;
      break;
    default:
      midpoint = options.divergingMidpoint;
  }

  const colorScale = d3
    .scaleDiverging()
    .domain([minValue, midpoint, maxValue])
    .interpolator(d3[options.colorScheme]);
}
```

利用可能な発散スキーム：

- `interpolateRdBu`
- `interpolateRdYlBu`
- `interpolateRdYlGn`
- `interpolateSpectral`
- `interpolateBrBG`
- `interpolatePiYG`
- `interpolatePRGn`
- `interpolateRdGy`

## 6. 投影法とスケール設定

### geoMercator 投影の使用

日本列島の形状に適した投影法です：

```typescript
const projection = d3
  .geoMercator()
  .center([137, 38]) // 日本の中心座標
  .scale(1200) // 適切なスケール
  .translate([width / 2, height / 2]); // 中心位置
```

### 日本列島に最適な設定値

- **center**: `[137, 38]` - 日本の地理的中心
- **scale**: `1200` - 都道府県が適切に表示されるサイズ
- **translate**: `[width/2, height/2]` - SVG の中心に配置

### レスポンシブ対応

```typescript
svg
  .attr("width", "100%")
  .attr("height", "auto")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");
```

## 7. インタラクティブ機能

### ホバー時のツールチップ表示

```typescript
const [hoveredData, setHoveredData] = useState<{
  prefecture: string;
  value: string;
  x: number;
  y: number;
} | null>(null);

svg
  .selectAll("path")
  .on("mouseover", (event, d) => {
    const data = prefectureData.get(d.id);
    if (data) {
      setHoveredData({
        prefecture: d.id,
        value: formatRankingValueDisplay(data),
        x: event.pageX,
        y: event.pageY,
      });
    }
  })
  .on("mouseout", () => {
    setHoveredData(null);
  });
```

### データ値のフォーマット

```typescript
function formatRankingValueDisplay(data: FormattedValue): string {
  const value = data.value?.toLocaleString("ja-JP") || "N/A";
  const unit = data.unit ? ` ${data.unit}` : "";
  return `${value}${unit}`;
}
```

### パフォーマンス最適化

```typescript
// ツールチップの位置更新を最適化
const tooltipRef = useRef<{
  prefecture: string;
  value: string;
  x: number;
  y: number;
} | null>(null);

// イベントハンドラーの最適化
const handleMouseMove = useCallback((event: MouseEvent, d: any) => {
  // 処理を最適化
}, []);
```

## 8. エラーハンドリング

### データ読み込みエラー

```typescript
try {
  const topojsonData = await d3.json<Topology>(url);
  if (!topojsonData) {
    throw new Error("地図データの読み込みに失敗しました");
  }
} catch (error) {
  setError("地図データの読み込みに失敗しました");
  console.error("TopoJSON読み込みエラー:", error);
}
```

### データ形式エラー

```typescript
const objectKey = Object.keys(topojsonData.objects)[0];
if (!objectKey) {
  throw new Error("地図データの形式が正しくありません");
}
```

### 有効なデータがない場合の処理

```typescript
const validValues = data
  .filter((d) => d.areaCode !== "00000" && d.value !== null)
  .map((d) => d.value!);

if (validValues.length === 0) {
  throw new Error("有効なデータがありません");
}
```

## 9. アクセシビリティ対応

### SVG 要素への aria 属性の追加

```typescript
svg
  .attr("role", "img")
  .attr("aria-label", "都道府県別統計データのコロプレス地図");

svg
  .selectAll("path")
  .attr("role", "button")
  .attr("tabindex", "0")
  .attr("aria-label", (d) => {
    const data = prefectureData.get(d.id);
    return data
      ? `${d.id}: ${formatRankingValueDisplay(data)}`
      : `${d.id}: データなし`;
  });
```

### 色覚異常対応のカラースキーム選択

```typescript
// 色覚異常に配慮したカラースキーム
const accessibleColorSchemes = {
  normal: "interpolateBlues",
  protanopia: "interpolateViridis", // 青緑系
  deuteranopia: "interpolatePlasma", // 紫黄系
  tritanopia: "interpolateInferno", // 赤黄系
};
```

## 10. 実装例

### 完全な TypeScript/React コンポーネント例

```typescript
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { Topology } from "topojson-specification";
import { FeatureCollection, Geometry } from "geojson";
import { FormattedValue } from "@/lib/estat-api";

export interface MapVisualizationOptions {
  colorScheme: string;
  divergingMidpoint: "zero" | "mean" | "median" | number;
}

interface ChoroplethMapProps {
  data: FormattedValue[];
  width?: number;
  height?: number;
  className?: string;
  options?: MapVisualizationOptions;
}

const defaultOptions: MapVisualizationOptions = {
  colorScheme: "interpolateBlues",
  divergingMidpoint: "zero",
};

export const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  data,
  width = 800,
  height = 600,
  className = "",
  options = defaultOptions,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredData, setHoveredData] = useState<{
    prefecture: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const loadMapData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TopoJSONデータを読み込み
        const topojsonData = await d3.json<Topology>(
          "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson"
        );

        if (!topojsonData) {
          throw new Error("地図データの読み込みに失敗しました");
        }

        // SVGの設定
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        svg
          .attr("width", "100%")
          .attr("height", "auto")
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet")
          .attr("role", "img")
          .attr("aria-label", "都道府県別統計データのコロプレス地図")
          .style("display", "block");

        // TopoJSONからGeoJSONへの変換
        const objectKey = Object.keys(topojsonData.objects)[0];
        if (!objectKey) {
          throw new Error("地図データの形式が正しくありません");
        }

        const japanGeo = feature(topojsonData, topojsonData.objects[objectKey]);
        const japan = japanGeo as FeatureCollection<Geometry>;

        // データの結合
        const prefectureData = new Map<string, FormattedValue>();
        data.forEach((d) => {
          if (d.areaCode && d.areaCode !== "00000" && d.value !== null) {
            const prefCode = d.areaCode.replace(/^0+/, "").padStart(2, "0");
            prefectureData.set(prefCode, d);

            if (d.areaName) {
              prefectureData.set(d.areaName, d);
              const normalizedName = d.areaName.replace(/[都道府県]$/, "");
              prefectureData.set(normalizedName, d);
            }
          }
        });

        // 地図の投影法
        const projection = d3
          .geoMercator()
          .center([137, 38])
          .scale(1200)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // カラースケールを生成
        const validValues = data
          .filter((d) => d.areaCode !== "00000" && d.value !== null)
          .map((d) => d.value!);

        if (validValues.length === 0) {
          throw new Error("有効なデータがありません");
        }

        const [minValue, maxValue] = d3.extent(validValues) as [number, number];

        // カラースキーマタイプを判定
        const isDivergingScheme =
          options.colorScheme.includes("RdBu") ||
          options.colorScheme.includes("RdYlBu") ||
          options.colorScheme.includes("RdYlGn") ||
          options.colorScheme.includes("Spectral") ||
          options.colorScheme.includes("BrBG") ||
          options.colorScheme.includes("PiYG") ||
          options.colorScheme.includes("PRGn") ||
          options.colorScheme.includes("RdGy");

        let colorScale: d3.ScaleSequential<string> | d3.ScaleDiverging<string>;

        if (isDivergingScheme) {
          let midpoint: number;
          switch (options.divergingMidpoint) {
            case "zero":
              midpoint = 0;
              break;
            case "mean":
              midpoint = d3.mean(validValues) || 0;
              break;
            case "median":
              midpoint = d3.median(validValues) || 0;
              break;
            default:
              midpoint = options.divergingMidpoint;
          }

          colorScale = d3
            .scaleDiverging()
            .domain([minValue, midpoint, maxValue])
            .interpolator(d3[options.colorScheme as keyof typeof d3]);
        } else {
          colorScale = d3
            .scaleSequential()
            .domain([minValue, maxValue])
            .interpolator(d3[options.colorScheme as keyof typeof d3]);
        }

        // 地図の描画
        svg
          .selectAll("path")
          .data(japan.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", (d) => {
            const data = prefectureData.get(d.id);
            return data ? colorScale(data.value!) : "#f0f0f0";
          })
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 0.5)
          .attr("role", "button")
          .attr("tabindex", "0")
          .attr("aria-label", (d) => {
            const data = prefectureData.get(d.id);
            return data
              ? `${d.id}: ${formatRankingValueDisplay(data)}`
              : `${d.id}: データなし`;
          })
          .on("mouseover", (event, d) => {
            const data = prefectureData.get(d.id);
            if (data) {
              setHoveredData({
                prefecture: d.id,
                value: formatRankingValueDisplay(data),
                x: event.pageX,
                y: event.pageY,
              });
            }
          })
          .on("mouseout", () => {
            setHoveredData(null);
          });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "地図の描画に失敗しました"
        );
        console.error("コロプレス地図エラー:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, [data, width, height, options]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">地図を読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg ref={svgRef} className={className} />
      {hoveredData && (
        <div
          className="absolute bg-gray-800 text-white px-2 py-1 rounded text-sm pointer-events-none z-10"
          style={{
            left: hoveredData.x + 10,
            top: hoveredData.y - 10,
          }}
        >
          <div className="font-semibold">{hoveredData.prefecture}</div>
          <div>{hoveredData.value}</div>
        </div>
      )}
    </div>
  );
};

// 数値フォーマット用ヘルパー関数
function formatRankingValueDisplay(data: FormattedValue): string {
  const value = data.value?.toLocaleString("ja-JP") || "N/A";
  const unit = data.unit ? ` ${data.unit}` : "";
  return `${value}${unit}`;
}
```

### オプション設定のサンプル

```typescript
// 順次カラースキーム（人口データなど）
const populationOptions: MapVisualizationOptions = {
  colorScheme: "interpolateBlues",
  divergingMidpoint: "zero",
};

// 発散カラースキーム（増減率データなど）
const growthRateOptions: MapVisualizationOptions = {
  colorScheme: "interpolateRdBu",
  divergingMidpoint: "zero",
};

// 平均値基準の発散スキーム
const deviationOptions: MapVisualizationOptions = {
  colorScheme: "interpolateRdYlBu",
  divergingMidpoint: "mean",
};
```

### データフォーマットの例

```typescript
// FormattedValueの例
const sampleData: FormattedValue[] = [
  {
    areaCode: "01000",
    areaName: "北海道",
    value: 5250000,
    unit: "人",
    categoryCode: "A1101",
    categoryName: "総人口",
    timeCode: "2020100000",
    timeName: "2020年度",
  },
  {
    areaCode: "02000",
    areaName: "青森県",
    value: 1235000,
    unit: "人",
    categoryCode: "A1101",
    categoryName: "総人口",
    timeCode: "2020100000",
    timeName: "2020年度",
  },
  // ... 他の都道府県データ
];
```

## まとめ

このガイドに従うことで、D3.js を使用して日本の都道府県コロプレス地図を効率的に実装できます。TopoJSON データの構造を理解し、適切なデータマッピングとカラースケールを設定することで、視覚的に分かりやすい統計地図を作成できます。

実装時は、パフォーマンス、アクセシビリティ、エラーハンドリングにも配慮し、ユーザビリティの高いコンポーネントを目指してください。
