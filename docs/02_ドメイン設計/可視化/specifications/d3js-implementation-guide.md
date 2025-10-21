---
title: D3.js実装ガイドライン
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - specifications
---

# D3.js実装ガイドライン

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: D3.jsを使用した可視化実装

---

## 基本方針

### 1. TypeScript型安全性
- 全てのD3.js操作で型定義を活用
- カスタム型の定義と使用
- 型ガードによる実行時安全性確保

### 2. Reactコンポーネントとの統合
- useEffectでのライフサイクル管理
- useRefでのDOM要素参照
- メモリリーク防止のためのクリーンアップ

### 3. パフォーマンス最適化
- メモ化（useMemo）でデータ変換を最適化
- デバウンス/スロットルでリサイズ処理を制御
- 仮想スクロール対応（大量データ）

### 4. アクセシビリティ対応
- ARIA属性の追加
- キーボードナビゲーション
- スクリーンリーダー対応

## 推奨パターン

### 1. Reactコンポーネント統合

```typescript
import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";

interface ChartData {
  id: string;
  value: number;
  label: string;
}

interface D3ChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  onDataPointClick?: (data: ChartData) => void;
}

export function D3Chart({ 
  data, 
  width = 600, 
  height = 400, 
  onDataPointClick 
}: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // データ変換をメモ化
  const processedData = useMemo(() => {
    return data.map(d => ({
      ...d,
      normalizedValue: d.value / Math.max(...data.map(x => x.value))
    }));
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !processedData.length) return;

    const svg = d3.select(svgRef.current);
    
    // 既存の要素をクリア
    svg.selectAll("*").remove();
    
    // スケール設定
    const xScale = d3.scaleBand()
      .domain(processedData.map(d => d.id))
      .range([0, width])
      .padding(0.1);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.value) || 0])
      .range([height, 0]);

    // バーを描画
    svg.selectAll(".bar")
      .data(processedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.id) || 0)
      .attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.value))
      .attr("fill", "#8884d8")
      .on("click", (event, d) => {
        onDataPointClick?.(d);
      })
      .on("mouseover", function(event, d) {
        // ホバー効果
        d3.select(this).attr("fill", "#ff6b6b");
      })
      .on("mouseout", function(event, d) {
        // ホバー解除
        d3.select(this).attr("fill", "#8884d8");
      });

    // クリーンアップ関数
    return () => {
      svg.selectAll("*").remove();
    };
  }, [processedData, width, height, onDataPointClick]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="データ可視化チャート"
    />
  );
}
```

### 2. パフォーマンス最適化

```typescript
import { useCallback, useMemo } from "react";
import { debounce } from "lodash";

export function OptimizedD3Chart({ data }: { data: ChartData[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  // デバウンスされたリサイズ処理
  const handleResize = useCallback(
    debounce(() => {
      // リサイズ処理
      updateChart();
    }, 300),
    []
  );

  // データ変換のメモ化
  const chartData = useMemo(() => {
    return data
      .filter(d => d.value > 0) // フィルタリング
      .sort((a, b) => b.value - a.value) // ソート
      .slice(0, 100); // 大量データの制限
  }, [data]);

  // 仮想スクロール対応
  const visibleData = useMemo(() => {
    const startIndex = scrollOffset;
    const endIndex = Math.min(startIndex + visibleItems, chartData.length);
    return chartData.slice(startIndex, endIndex);
  }, [chartData, scrollOffset, visibleItems]);

  return (
    <div>
      <svg ref={svgRef} />
      {/* 仮想スクロール用のスクロールバー */}
    </div>
  );
}
```

### 3. アクセシビリティ対応

```typescript
export function AccessibleD3Chart({ data }: { data: ChartData[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // ARIA属性の設定
    svg.attr("role", "img")
       .attr("aria-label", "ランキングデータチャート");

    // キーボードナビゲーション対応
    svg.selectAll(".bar")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", d => `${d.label}: ${d.value}`)
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          // クリック処理を実行
          d3.select(this).dispatch("click");
        }
      });

    // フォーカス管理
    svg.selectAll(".bar")
      .on("focus", function() {
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("blur", function() {
        d3.select(this).attr("stroke", "none");
      });

  }, [data]);

  return <svg ref={svgRef} />;
}
```

### 4. アニメーション・トランジション

```typescript
export function AnimatedD3Chart({ data }: { data: ChartData[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // 初期状態（透明）
    const bars = svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("opacity", 0)
      .attr("y", height); // 下から開始

    // アニメーション実行
    bars.transition()
      .duration(1000)
      .delay((d, i) => i * 100) // 順次表示
      .attr("opacity", 1)
      .attr("y", d => yScale(d.value));

    // ホバー時のアニメーション
    bars.on("mouseover", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", "scale(1.05)")
        .attr("fill", "#ff6b6b");
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("transform", "scale(1)")
        .attr("fill", "#8884d8");
    });

  }, [data]);
}
```

## 共通ユーティリティ

### 1. スケールファクトリー

```typescript
// src/lib/visualization/d3js/common/scales.ts

export class ScaleFactory {
  static createLinearScale(
    data: number[],
    range: [number, number]
  ): d3.ScaleLinear<number, number> {
    return d3.scaleLinear()
      .domain([0, d3.max(data) || 0])
      .range(range);
  }

  static createBandScale(
    data: string[],
    range: [number, number],
    padding = 0.1
  ): d3.ScaleBand<string> {
    return d3.scaleBand()
      .domain(data)
      .range(range)
      .padding(padding);
  }

  static createColorScale(
    data: number[],
    colorScheme: string[] = ["#e0f3f8", "#0868ac"]
  ): d3.ScaleSequential<string> {
    return d3.scaleSequential()
      .domain([d3.min(data) || 0, d3.max(data) || 0])
      .interpolator(d3.interpolateRgb(colorScheme[0], colorScheme[1]));
  }
}
```

### 2. アニメーション設定

```typescript
// src/lib/visualization/d3js/common/animations.ts

export const AnimationConfig = {
  default: {
    duration: 500,
    ease: d3.easeCubicInOut
  },
  fast: {
    duration: 200,
    ease: d3.easeLinear
  },
  slow: {
    duration: 1000,
    ease: d3.easeBounceOut
  }
} as const;

export function createTransition(
  selection: d3.Selection<any, any, any, any>,
  config = AnimationConfig.default
) {
  return selection.transition()
    .duration(config.duration)
    .ease(config.ease);
}
```

### 3. ツールチップ管理

```typescript
// src/lib/visualization/d3js/common/tooltip.ts

export class TooltipManager {
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;

  constructor(container: HTMLElement) {
    this.tooltip = d3.select(container)
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px");
  }

  show(event: MouseEvent, content: string) {
    this.tooltip
      .style("visibility", "visible")
      .html(content)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
  }

  hide() {
    this.tooltip.style("visibility", "hidden");
  }
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/d3js/__tests__/D3Chart.test.tsx

import { render, screen } from "@testing-library/react";
import { D3Chart } from "../D3Chart";

describe("D3Chart", () => {
  const mockData = [
    { id: "1", value: 100, label: "Item 1" },
    { id: "2", value: 200, label: "Item 2" }
  ];

  it("renders chart with data", () => {
    render(<D3Chart data={mockData} />);
    
    const svg = screen.getByRole("img");
    expect(svg).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onDataPointClick = jest.fn();
    render(
      <D3Chart 
        data={mockData} 
        onDataPointClick={onDataPointClick} 
      />
    );
    
    // クリックイベントのテスト
    // 実際のテスト実装
  });
});
```

### 2. ビジュアルリグレッションテスト

```typescript
// src/components/charts/d3js/__tests__/visual-regression.test.ts

import { render } from "@testing-library/react";
import { D3Chart } from "../D3Chart";

describe("Visual Regression Tests", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <D3Chart data={mockData} />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## パフォーマンス監視

### 1. レンダリング時間測定

```typescript
export function PerformanceMonitoredChart({ data }: { data: ChartData[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    // チャート描画処理
    
    const endTime = performance.now();
    console.log(`Chart rendering took ${endTime - startTime} milliseconds`);
    
    // パフォーマンスデータを送信
    if (endTime - startTime > 100) {
      // 遅いレンダリングをログ
      console.warn("Slow chart rendering detected");
    }
  }, [data]);
}
```

### 2. メモリ使用量監視

```typescript
export function MemoryMonitoredChart({ data }: { data: ChartData[] }) {
  useEffect(() => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return () => {
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDiff = finalMemory - initialMemory;
      
      if (memoryDiff > 10 * 1024 * 1024) { // 10MB以上
        console.warn("Potential memory leak detected");
      }
    };
  }, [data]);
}
```

---

## 関連ドキュメント

- [ライブラリ選択ガイド](library-selection-guide.md)
- [コロプレスマップ仕様](choropleth-map.md)
- [アクセシビリティガイド](accessibility.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
