---
title: D3.jsコロプレスマップ実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - implementation
---

# D3.js コロプレスマップ実装ガイド

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: D3.js を使用したコロプレスマップの実装

---

## 概要

このドキュメントは、D3.js を使用してコロプレスマップを実装するための詳細なガイドです。既存の開発ガイド（`docs/01_development_guide/07_d3js_choropleth_guide.md`）を参照し、新しい visualization ドメインに統合します。

## 関連ドキュメント

- [既存の D3.js コロプレスガイド](d3js_choropleth_guide.md)
- [コロプレスマップ仕様](../仕様/chart-types/choropleth-map.md)
- [D3.js 実装ガイド](../仕様/d3js-implementation-guide.md)

## 実装アーキテクチャ

### コンポーネント構造

```
src/components/charts/d3js/
├── ChoroplethMap.tsx           # メインコンポーネント
├── ChoroplethLegend.tsx        # 凡例コンポーネント
├── ChoroplethTooltip.tsx       # ツールチップコンポーネント
└── ChoroplethControls.tsx      # ズームコントロール

src/infrastructure/visualization/d3js/choropleth/
├── projection.ts               # 地図投影設定
├── color-scale.ts              # カラースケール
├── interactions.ts             # インタラクション処理
├── data-processor.ts           # データ処理
└── accessibility.ts            # アクセシビリティ対応
```

## 実装詳細

### 1. メインコンポーネント

```typescript
// src/components/charts/d3js/ChoroplethMap.tsx

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import {
  fetchPrefectureTopology,
  fetchMunicipalityTopology,
} from "@/features/gis/geoshape/services/geoshape-service";
import { ChoroplethData, ChoroplethConfig } from "<!-- NOTE: src/types/visualization は2025年10月26日に削除されました。必要になった場合は src/features/visualization/core/types/ に再実装してください。 -->";
import { createProjection } from "@/infrastructure/visualization/d3js/choropleth/projection";
import { createColorScale } from "@/infrastructure/visualization/d3js/choropleth/color-scale";
import { setupInteractions } from "@/infrastructure/visualization/d3js/choropleth/interactions";
import { setupAccessibility } from "@/infrastructure/visualization/d3js/choropleth/accessibility";

interface ChoroplethMapProps {
  data: ChoroplethData[];
  config: ChoroplethConfig;
  width?: number;
  height?: number;
  onAreaClick?: (area: ChoroplethData) => void;
  onAreaHover?: (area: ChoroplethData | null) => void;
  className?: string;
}

export function ChoroplethMap({
  data,
  config,
  width = 800,
  height = 600,
  onAreaClick,
  onAreaHover,
  className,
}: ChoroplethMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // TopoJSONデータの取得とGeoJSON変換
  const geoJsonData = useMemo(async () => {
    try {
      let topology;

      if (config.level === "prefecture") {
        topology = await fetchPrefectureTopology({
          useCache: true,
        });
      } else {
        // 市区町村データの場合、都道府県コードを抽出
        const prefCode = data[0]?.areaCode.substring(0, 2) || "28";
        topology = await fetchMunicipalityTopology(prefCode, "merged", {
          useCache: true,
        });
      }

      // D3.js側でGeoJSONに変換
      const objectName = Object.keys(topology.objects)[0];
      const geojson = topojson.feature(
        topology,
        topology.objects[objectName]
      ) as GeoJSON.FeatureCollection;

      // 都道府県コードと名前を正規化
      const normalizedFeatures = geojson.features.map((feature) => {
        const properties = feature.properties || {};

        const code =
          properties.N03_007 || properties.prefCode || properties.code;
        const prefCode = code ? `${String(code).padStart(2, "0")}000` : "00000";
        const prefName =
          properties.N03_001 ||
          properties.prefName ||
          properties.name ||
          "不明";

        return {
          ...feature,
          properties: {
            ...properties,
            prefCode,
            prefName,
          },
        };
      });

      return {
        type: "FeatureCollection" as const,
        features: normalizedFeatures,
      };
    } catch (error) {
      console.error("地図データの取得に失敗:", error);
      throw error;
    }
  }, [config.level, data]);

  // データの最適化
  const optimizedData = useMemo(() => {
    return data.filter((item) => {
      if (config.level === "prefecture") {
        return item.areaCode.length === 2;
      } else {
        return item.areaCode.length === 5;
      }
    });
  }, [data, config.level]);

  // 投影法の設定
  const projection = useMemo(() => {
    return createProjection(width, height, config.level);
  }, [width, height, config.level]);

  // カラースケールの設定
  const colorScale = useMemo(() => {
    return createColorScale(
      optimizedData,
      config.colorScheme,
      config.divergingMidpoint
    );
  }, [optimizedData, config.colorScheme, config.divergingMidpoint]);

  useEffect(() => {
    if (!svgRef.current || !geoJsonData) return;

    const svg = d3.select(svgRef.current);

    // 既存の要素をクリア
    svg.selectAll("*").remove();

    // パス生成器
    const path = d3.geoPath().projection(projection);

    // 地図を描画
    svg
      .selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d) => {
        const areaData = optimizedData.find(
          (item) => item.areaCode === d.properties.code
        );
        return areaData ? colorScale(areaData.value) : "#f0f0f0";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", (event, d) => {
        const areaData = optimizedData.find(
          (item) => item.areaCode === d.properties.code
        );
        if (areaData) {
          onAreaClick?.(areaData);
        }
      })
      .on("mouseover", (event, d) => {
        const areaData = optimizedData.find(
          (item) => item.areaCode === d.properties.code
        );
        if (areaData) {
          onAreaHover?.(areaData);
        }
      })
      .on("mouseout", () => {
        onAreaHover?.(null);
      });

    // インタラクション設定
    setupInteractions(svg, optimizedData, onAreaClick, onAreaHover);

    // アクセシビリティ設定
    setupAccessibility(svg, optimizedData);

    return () => {
      svg.selectAll("*").remove();
    };
  }, [
    geoJsonData,
    optimizedData,
    projection,
    colorScale,
    onAreaClick,
    onAreaHover,
  ]);

  return (
    <div ref={containerRef} className={`choropleth-map ${className || ""}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={`${
          config.level === "prefecture" ? "都道府県" : "市区町村"
        }別データマップ`}
      />
    </div>
  );
}
```

### 2. 投影法設定

```typescript
// src/infrastructure/visualization/d3js/choropleth/projection.ts

import * as d3 from "d3";

export function createProjection(
  width: number,
  height: number,
  level: "prefecture" | "municipality"
): d3.GeoProjection {
  const projection = d3
    .geoMercator()
    .center([138, 38]) // 日本の中心
    .scale(level === "prefecture" ? 1000 : 2000)
    .translate([width / 2, height / 2]);

  return projection;
}

export function createAlternativeProjection(
  width: number,
  height: number
): d3.GeoProjection {
  // 代替投影法（必要に応じて）
  return d3
    .geoAlbers()
    .center([138, 38])
    .parallels([30, 46])
    .scale(1000)
    .translate([width / 2, height / 2]);
}
```

### 3. カラースケール

```typescript
// src/infrastructure/visualization/d3js/choropleth/color-scale.ts

import * as d3 from "d3";
import { ChoroplethData } from "<!-- NOTE: src/types/visualization は2025年10月26日に削除されました。必要になった場合は src/features/visualization/core/types/ に再実装してください。 -->";

export function createColorScale(
  data: ChoroplethData[],
  colorScheme: string,
  divergingMidpoint: "zero" | "mean" | "median" | number
): d3.ScaleSequential<string> {
  const values = data.map((d) => d.value);
  const min = d3.min(values) || 0;
  const max = d3.max(values) || 0;

  let domain: [number, number];
  if (divergingMidpoint === "zero") {
    domain = [0, max];
  } else if (divergingMidpoint === "mean") {
    const mean = d3.mean(values) || 0;
    domain = [min, mean, max];
  } else if (divergingMidpoint === "median") {
    const median = d3.median(values) || 0;
    domain = [min, median, max];
  } else {
    domain = [min, divergingMidpoint, max];
  }

  const interpolator = getColorInterpolator(colorScheme);

  return d3.scaleSequential().domain(domain).interpolator(interpolator);
}

function getColorInterpolator(scheme: string): (t: number) => string {
  const schemes: Record<string, (t: number) => string> = {
    blues: d3.interpolateBlues,
    reds: d3.interpolateReds,
    greens: d3.interpolateGreens,
    viridis: d3.interpolateViridis,
    plasma: d3.interpolatePlasma,
    inferno: d3.interpolateInferno,
    magma: d3.interpolateMagma,
    turbo: d3.interpolateTurbo,
  };

  return schemes[scheme] || d3.interpolateBlues;
}
```

### 4. インタラクション処理

```typescript
// src/infrastructure/visualization/d3js/choropleth/interactions.ts

import * as d3 from "d3";
import { ChoroplethData } from "<!-- NOTE: src/types/visualization は2025年10月26日に削除されました。必要になった場合は src/features/visualization/core/types/ に再実装してください。 -->";

export function setupInteractions(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[],
  onAreaClick?: (area: ChoroplethData) => void,
  onAreaHover?: (area: ChoroplethData | null) => void
) {
  // ズーム・パン設定
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 5])
    .on("zoom", (event) => {
      svg.selectAll("path").attr("transform", event.transform);
    });

  svg.call(zoom);

  // 地域クリック・ホバー処理
  svg
    .selectAll("path")
    .on("click", (event, d) => {
      const areaData = data.find((item) => item.areaCode === d.properties.code);
      if (areaData) {
        onAreaClick?.(areaData);
      }
    })
    .on("mouseover", (event, d) => {
      const areaData = data.find((item) => item.areaCode === d.properties.code);
      if (areaData) {
        onAreaHover?.(areaData);
      }
    })
    .on("mouseout", () => {
      onAreaHover?.(null);
    });
}
```

### 5. アクセシビリティ対応

```typescript
// src/infrastructure/visualization/d3js/choropleth/accessibility.ts

import * as d3 from "d3";
import { ChoroplethData } from "<!-- NOTE: src/types/visualization は2025年10月26日に削除されました。必要になった場合は src/features/visualization/core/types/ に再実装してください。 -->";

export function setupAccessibility(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[]
) {
  // ARIA属性の設定
  svg.attr("role", "img").attr("aria-label", "都道府県別データマップ");

  // 各地域にARIA属性を追加
  svg
    .selectAll("path")
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (d) => {
      const areaData = data.find((item) => item.areaCode === d.properties.code);
      return areaData
        ? `${areaData.areaName}: ${areaData.value}`
        : d.properties.name;
    });

  // キーボードナビゲーション
  setupKeyboardNavigation(svg, data);
}

function setupKeyboardNavigation(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[]
) {
  let selectedIndex = 0;

  svg.on("keydown", (event) => {
    switch (event.key) {
      case "ArrowRight":
        selectedIndex = Math.min(selectedIndex + 1, data.length - 1);
        break;
      case "ArrowLeft":
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case "Enter":
        const selectedArea = data[selectedIndex];
        // クリック処理を実行
        break;
    }

    updateSelection(selectedIndex);
  });
}

function updateSelection(index: number) {
  // 選択状態の更新
  // 実装詳細は省略
}
```

## パフォーマンス最適化

### 1. TopoJSON 直接使用のメリット

- **ファイルサイズの削減**: TopoJSON は GeoJSON より約 80%小さく、ネットワーク転送が高速
- **メモリ効率**: 変換処理を D3.js 側に移譲することで、サーバー側のメモリ使用量を削減
- **キャッシュ効率**: TopoJSON データをそのままキャッシュすることで、ストレージ効率が向上

### 2. データ最適化

```typescript
// src/infrastructure/visualization/d3js/choropleth/data-processor.ts

export function optimizeChoroplethData(
  data: ChoroplethData[],
  level: "prefecture" | "municipality"
): ChoroplethData[] {
  // 表示レベルに応じたフィルタリング
  const filteredData = data.filter((item) => {
    if (level === "prefecture") {
      return item.areaCode.length === 2;
    } else {
      return item.areaCode.length === 5;
    }
  });

  // データの重複を除去
  const uniqueData = Array.from(
    new Map(filteredData.map((item) => [item.areaCode, item])).values()
  );

  return uniqueData;
}
    } else {
      return item.areaCode.length === 5;
    }
  });

  // 値の正規化
  return filteredData.map((item) => ({
    ...item,
    normalizedValue: normalizeValue(item.value, filteredData),
  }));
}

function normalizeValue(value: number, data: ChoroplethData[]): number {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (value - min) / (max - min);
}
```

### 2. レンダリング最適化

```typescript
// メモ化による最適化
export const OptimizedChoroplethMap = memo(function ChoroplethMap({
  data,
  config,
  geoJsonData,
}: ChoroplethMapProps) {
  const processedData = useMemo(
    () => optimizeChoroplethData(data, config.level),
    [data, config.level]
  );

  const projection = useMemo(
    () => createProjection(width, height, config.level),
    [width, height, config.level]
  );

  const colorScale = useMemo(
    () =>
      createColorScale(
        processedData,
        config.colorScheme,
        config.divergingMidpoint
      ),
    [processedData, config.colorScheme, config.divergingMidpoint]
  );

  return (
    <ChoroplethMap
      data={processedData}
      projection={projection}
      colorScale={colorScale}
      config={config}
      geoJsonData={geoJsonData}
    />
  );
});
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/d3js/__tests__/ChoroplethMap.test.tsx

import { render, screen, fireEvent } from "@testing-library/react";
import { ChoroplethMap } from "../ChoroplethMap";

describe("ChoroplethMap", () => {
  const mockData: ChoroplethData[] = [
    { areaCode: "01", areaName: "北海道", value: 100 },
    { areaCode: "13", areaName: "東京都", value: 200 },
  ];

  const mockGeoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { code: "01", name: "北海道" },
        geometry: { type: "Polygon", coordinates: [] },
      },
    ],
  };

  it("renders map with data", () => {
    render(
      <ChoroplethMap
        data={mockData}
        config={defaultConfig}
        geoJsonData={mockGeoJson}
      />
    );

    const svg = screen.getByRole("img");
    expect(svg).toBeInTheDocument();
  });

  it("handles area click events", () => {
    const onAreaClick = jest.fn();
    render(
      <ChoroplethMap
        data={mockData}
        config={defaultConfig}
        geoJsonData={mockGeoJson}
        onAreaClick={onAreaClick}
      />
    );

    const paths = screen.getAllByRole("button");
    fireEvent.click(paths[0]);

    expect(onAreaClick).toHaveBeenCalledWith(mockData[0]);
  });
});
```

### 2. ビジュアルリグレッションテスト

```typescript
describe("ChoroplethMap Visual Regression", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <ChoroplethMap
        data={mockData}
        config={defaultConfig}
        geoJsonData={mockGeoJson}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## 関連ドキュメント

- [既存の D3.js コロプレスガイド](d3js_choropleth_guide.md)
- [コロプレスマップ仕様](../仕様/chart-types/choropleth-map.md)
- [D3.js 実装ガイド](../仕様/d3js-implementation-guide.md)
- [アクセシビリティガイド](../仕様/accessibility.md)

---

**更新履歴**:

- 2025-10-16: 初版作成
