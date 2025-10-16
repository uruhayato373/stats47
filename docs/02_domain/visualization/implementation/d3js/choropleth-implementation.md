---
title: D3.jsコロプレスマップ実装ガイド
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - implementation
---

# D3.jsコロプレスマップ実装ガイド

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: D3.jsを使用したコロプレスマップの実装

---

## 概要

このドキュメントは、D3.jsを使用してコロプレスマップを実装するための詳細なガイドです。既存の開発ガイド（`docs/01_development_guide/07_d3js_choropleth_guide.md`）を参照し、新しいvisualizationドメインに統合します。

## 関連ドキュメント

- [既存のD3.jsコロプレスガイド](../../../01_development_guide/07_d3js_choropleth_guide.md)
- [コロプレスマップ仕様](../仕様/chart-types/choropleth-map.md)
- [D3.js実装ガイド](../仕様/d3js-implementation-guide.md)

## 実装アーキテクチャ

### コンポーネント構造

```
src/components/charts/d3js/
├── ChoroplethMap.tsx           # メインコンポーネント
├── ChoroplethLegend.tsx        # 凡例コンポーネント
├── ChoroplethTooltip.tsx       # ツールチップコンポーネント
└── ChoroplethControls.tsx      # ズームコントロール

src/lib/visualization/d3js/choropleth/
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

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ChoroplethData, ChoroplethConfig } from '@/types/visualization';
import { createProjection } from '@/lib/visualization/d3js/choropleth/projection';
import { createColorScale } from '@/lib/visualization/d3js/choropleth/color-scale';
import { setupInteractions } from '@/lib/visualization/d3js/choropleth/interactions';
import { setupAccessibility } from '@/lib/visualization/d3js/choropleth/accessibility';

interface ChoroplethMapProps {
  data: ChoroplethData[];
  config: ChoroplethConfig;
  geoJsonData: GeoJSON.FeatureCollection;
  width?: number;
  height?: number;
  onAreaClick?: (area: ChoroplethData) => void;
  onAreaHover?: (area: ChoroplethData | null) => void;
  className?: string;
}

export function ChoroplethMap({
  data,
  config,
  geoJsonData,
  width = 800,
  height = 600,
  onAreaClick,
  onAreaHover,
  className
}: ChoroplethMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // データの最適化
  const optimizedData = useMemo(() => {
    return data.filter(item => {
      if (config.level === 'prefecture') {
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
    return createColorScale(optimizedData, config.colorScheme, config.divergingMidpoint);
  }, [optimizedData, config.colorScheme, config.divergingMidpoint]);

  useEffect(() => {
    if (!svgRef.current || !geoJsonData) return;

    const svg = d3.select(svgRef.current);
    
    // 既存の要素をクリア
    svg.selectAll("*").remove();
    
    // パス生成器
    const path = d3.geoPath().projection(projection);
    
    // 地図を描画
    svg.selectAll("path")
      .data(geoJsonData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const areaData = optimizedData.find(item => 
          item.areaCode === d.properties.code
        );
        return areaData ? colorScale(areaData.value) : "#f0f0f0";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", (event, d) => {
        const areaData = optimizedData.find(item => 
          item.areaCode === d.properties.code
        );
        if (areaData) {
          onAreaClick?.(areaData);
        }
      })
      .on("mouseover", (event, d) => {
        const areaData = optimizedData.find(item => 
          item.areaCode === d.properties.code
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
  }, [geoJsonData, optimizedData, projection, colorScale, onAreaClick, onAreaHover]);

  return (
    <div ref={containerRef} className={`choropleth-map ${className || ''}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label={`${config.level === 'prefecture' ? '都道府県' : '市区町村'}別データマップ`}
      />
    </div>
  );
}
```

### 2. 投影法設定

```typescript
// src/lib/visualization/d3js/choropleth/projection.ts

import * as d3 from 'd3';

export function createProjection(
  width: number,
  height: number,
  level: 'prefecture' | 'municipality'
): d3.GeoProjection {
  const projection = d3.geoMercator()
    .center([138, 38]) // 日本の中心
    .scale(level === 'prefecture' ? 1000 : 2000)
    .translate([width / 2, height / 2]);

  return projection;
}

export function createAlternativeProjection(
  width: number,
  height: number
): d3.GeoProjection {
  // 代替投影法（必要に応じて）
  return d3.geoAlbers()
    .center([138, 38])
    .parallels([30, 46])
    .scale(1000)
    .translate([width / 2, height / 2]);
}
```

### 3. カラースケール

```typescript
// src/lib/visualization/d3js/choropleth/color-scale.ts

import * as d3 from 'd3';
import { ChoroplethData } from '@/types/visualization';

export function createColorScale(
  data: ChoroplethData[],
  colorScheme: string,
  divergingMidpoint: 'zero' | 'mean' | 'median' | number
): d3.ScaleSequential<string> {
  const values = data.map(d => d.value);
  const min = d3.min(values) || 0;
  const max = d3.max(values) || 0;
  
  let domain: [number, number];
  if (divergingMidpoint === 'zero') {
    domain = [0, max];
  } else if (divergingMidpoint === 'mean') {
    const mean = d3.mean(values) || 0;
    domain = [min, mean, max];
  } else if (divergingMidpoint === 'median') {
    const median = d3.median(values) || 0;
    domain = [min, median, max];
  } else {
    domain = [min, divergingMidpoint, max];
  }

  const interpolator = getColorInterpolator(colorScheme);
  
  return d3.scaleSequential()
    .domain(domain)
    .interpolator(interpolator);
}

function getColorInterpolator(scheme: string): (t: number) => string {
  const schemes: Record<string, (t: number) => string> = {
    'blues': d3.interpolateBlues,
    'reds': d3.interpolateReds,
    'greens': d3.interpolateGreens,
    'viridis': d3.interpolateViridis,
    'plasma': d3.interpolatePlasma,
    'inferno': d3.interpolateInferno,
    'magma': d3.interpolateMagma,
    'turbo': d3.interpolateTurbo
  };
  
  return schemes[scheme] || d3.interpolateBlues;
}
```

### 4. インタラクション処理

```typescript
// src/lib/visualization/d3js/choropleth/interactions.ts

import * as d3 from 'd3';
import { ChoroplethData } from '@/types/visualization';

export function setupInteractions(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[],
  onAreaClick?: (area: ChoroplethData) => void,
  onAreaHover?: (area: ChoroplethData | null) => void
) {
  // ズーム・パン設定
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 5])
    .on("zoom", (event) => {
      svg.selectAll("path")
        .attr("transform", event.transform);
    });

  svg.call(zoom);

  // 地域クリック・ホバー処理
  svg.selectAll("path")
    .on("click", (event, d) => {
      const areaData = data.find(item => item.areaCode === d.properties.code);
      if (areaData) {
        onAreaClick?.(areaData);
      }
    })
    .on("mouseover", (event, d) => {
      const areaData = data.find(item => item.areaCode === d.properties.code);
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
// src/lib/visualization/d3js/choropleth/accessibility.ts

import * as d3 from 'd3';
import { ChoroplethData } from '@/types/visualization';

export function setupAccessibility(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: ChoroplethData[]
) {
  // ARIA属性の設定
  svg.attr("role", "img")
     .attr("aria-label", "都道府県別データマップ");

  // 各地域にARIA属性を追加
  svg.selectAll("path")
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (d) => {
      const areaData = data.find(item => item.areaCode === d.properties.code);
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

### 1. データ最適化

```typescript
// src/lib/visualization/d3js/choropleth/data-processor.ts

export function optimizeChoroplethData(
  data: ChoroplethData[],
  level: 'prefecture' | 'municipality'
): ChoroplethData[] {
  // 表示レベルに応じたフィルタリング
  const filteredData = data.filter(item => {
    if (level === 'prefecture') {
      return item.areaCode.length === 2;
    } else {
      return item.areaCode.length === 5;
    }
  });

  // 値の正規化
  return filteredData.map(item => ({
    ...item,
    normalizedValue: normalizeValue(item.value, filteredData)
  }));
}

function normalizeValue(value: number, data: ChoroplethData[]): number {
  const values = data.map(d => d.value);
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
  geoJsonData 
}: ChoroplethMapProps) {
  const processedData = useMemo(() => 
    optimizeChoroplethData(data, config.level), 
    [data, config.level]
  );

  const projection = useMemo(() => 
    createProjection(width, height, config.level), 
    [width, height, config.level]
  );

  const colorScale = useMemo(() => 
    createColorScale(processedData, config.colorScheme, config.divergingMidpoint), 
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
    { areaCode: "13", areaName: "東京都", value: 200 }
  ];

  const mockGeoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { code: "01", name: "北海道" },
        geometry: { type: "Polygon", coordinates: [] }
      }
    ]
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

- [既存のD3.jsコロプレスガイド](../../../01_development_guide/07_d3js_choropleth_guide.md)
- [コロプレスマップ仕様](../仕様/chart-types/choropleth-map.md)
- [D3.js実装ガイド](../仕様/d3js-implementation-guide.md)
- [アクセシビリティガイド](../仕様/accessibility.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
