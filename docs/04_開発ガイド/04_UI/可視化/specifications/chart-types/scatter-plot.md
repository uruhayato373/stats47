---
title: 散布図仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - specifications
---

# 散布図仕様

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: 散布図可視化機能

---

## 概要

2つの変数の関係性を点の位置で表現するチャート。相関関係の分析やデータの分布を視覚的に確認するのに最適です。

## 実装ライブラリ

### Recharts版（推奨）
**用途**: 標準的な相関分析・ダッシュボード

**特徴**:
- 迅速な実装
- レスポンシブ対応
- 複数系列の比較
- 標準的なインタラクション

### D3.js版
**用途**: 高度な相関分析・詳細ページ

**特徴**:
- ブラシ選択による範囲選択
- ズーム・パン機能
- カスタムアニメーション
- 大量データ対応

## 主要機能

### 1. 基本表示
- **単一系列**: 一つのデータ系列の散布図
- **複数系列**: 複数のデータ系列を同時表示
- **色分け**: カテゴリによる色分け表示
- **サイズ分け**: 値の大きさによる点のサイズ変更

### 2. インタラクション
- **ホバー効果**: マウスオーバー時の詳細表示
- **クリック操作**: データポイント選択・詳細表示
- **ブラシ選択**: 範囲選択によるフィルタリング
- **ズーム・パン**: 表示範囲の拡大・移動

### 3. 分析機能
- **回帰直線**: 相関関係の直線表示
- **相関係数**: 相関の強さを数値表示
- **クラスタリング**: データのグループ化表示
- **外れ値検出**: 異常値のハイライト

## データ構造

### 入力データ

```typescript
interface ScatterPlotData {
  x: number;                 // X軸の値
  y: number;                 // Y軸の値
  series?: string;           // 系列名（複数系列用）
  category?: string;         // カテゴリ（色分け用）
  size?: number;             // 点のサイズ
  metadata?: {               // メタデータ
    areaCode?: string;
    areaName?: string;
    unit?: string;
    [key: string]: any;
  };
}

interface ScatterPlotConfig {
  showRegressionLine: boolean;  // 回帰直線表示
  showCorrelation: boolean;     // 相関係数表示
  showClusters: boolean;        // クラスタリング表示
  showOutliers: boolean;        // 外れ値表示
  colorBy: 'series' | 'category' | 'value'; // 色分け基準
  sizeBy: 'value' | 'fixed';    // サイズ分け基準
  animation: boolean;           // アニメーション有効
  colorScheme: string;          // カラースキーム
  xLabel: string;              // X軸ラベル
  yLabel: string;              // Y軸ラベル
}
```

## コンポーネント設計

### 1. Recharts版

```typescript
// src/components/charts/recharts/ScatterPlot.tsx

interface RechartsScatterPlotProps {
  data: ScatterPlotData[];
  config: ScatterPlotConfig;
  width?: number;
  height?: number;
  onDataPointClick?: (data: ScatterPlotData) => void;
  onDataPointHover?: (data: ScatterPlotData | null) => void;
  className?: string;
}

export function RechartsScatterPlot({
  data,
  config,
  width = 600,
  height = 400,
  onDataPointClick,
  onDataPointHover,
  className
}: RechartsScatterPlotProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="x"
          name={config.xLabel}
          type="number"
          scale="linear"
        />
        <YAxis 
          dataKey="y"
          name={config.yLabel}
          type="number"
          scale="linear"
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Legend />
        <Scatter
          dataKey="y"
          fill="#8884d8"
          onClick={onDataPointClick}
          onMouseOver={onDataPointHover}
        />
        {config.showRegressionLine && (
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 100, y: 100 }
            ]}
            stroke="red"
            strokeDasharray="5 5"
          />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

### 2. D3.js版

```typescript
// src/components/charts/d3js/ScatterPlot.tsx

interface D3ScatterPlotProps {
  data: ScatterPlotData[];
  config: ScatterPlotConfig;
  width?: number;
  height?: number;
  onDataPointClick?: (data: ScatterPlotData) => void;
  onDataPointHover?: (data: ScatterPlotData | null) => void;
  className?: string;
}

export function D3ScatterPlot({
  data,
  config,
  width = 600,
  height = 400,
  onDataPointClick,
  onDataPointHover,
  className
}: D3ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // スケール設定
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .range([height, 0]);

    // 色スケール
    const colorScale = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.series || d.category))])
      .range(d3.schemeCategory10);

    // サイズスケール
    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.size || 1) as [number, number])
      .range([3, 15]);

    // 点を描画
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", d => sizeScale(d.size || 1))
      .attr("fill", d => colorScale(d.series || d.category || "default"))
      .attr("opacity", 0.7)
      .on("click", (event, d) => onDataPointClick?.(d))
      .on("mouseover", (event, d) => onDataPointHover?.(d))
      .on("mouseout", () => onDataPointHover?.(null));

    // 回帰直線を描画
    if (config.showRegressionLine) {
      const regression = linearRegression(data.map(d => [d.x, d.y]));
      const line = d3.line<[number, number]>()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));

      svg.append("path")
        .datum(regression.line)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", line);
    }

    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, config, width, height, onDataPointClick, onDataPointHover]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

## 使い分けガイド

### Recharts版を選択すべきケース

#### 1. ダッシュボードでの相関分析
```typescript
// シンプルな相関分析
<RechartsScatterPlot 
  data={correlationData}
  config={{
    showRegressionLine: true,
    showCorrelation: true,
    colorBy: 'category',
    xLabel: '人口',
    yLabel: 'GDP'
  }}
/>
```

**特徴**:
- 迅速な実装
- 標準的な表示
- レスポンシブ対応
- 保守しやすい

#### 2. 複数系列の比較
```typescript
// 複数地域の比較
<RechartsScatterPlot 
  data={multiRegionData}
  config={{
    colorBy: 'series',
    showRegressionLine: true,
    xLabel: '人口密度',
    yLabel: '平均年収'
  }}
/>
```

### D3.js版を選択すべきケース

#### 1. 詳細な相関分析
```typescript
// ブラシ選択付き詳細分析
<D3ScatterPlot 
  data={detailedCorrelationData}
  config={{
    showRegressionLine: true,
    showClusters: true,
    showOutliers: true,
    brushSelection: true,
    zoom: true
  }}
  onDataPointClick={handleDetailAnalysis}
/>
```

**特徴**:
- ブラシ選択による範囲選択
- クラスタリング表示
- 外れ値検出
- 大量データ対応

#### 2. インタラクティブな分析
```typescript
// 高度なインタラクション
<D3ScatterPlot 
  data={interactiveData}
  config={{
    showRegressionLine: true,
    showClusters: true,
    animation: true,
    customTooltip: true
  }}
  onDataPointHover={showDetailedTooltip}
/>
```

## パフォーマンス最適化

### 1. データ最適化

```typescript
// 大量データの最適化
export function optimizeScatterPlotData(
  data: ScatterPlotData[],
  config: ScatterPlotConfig
): ScatterPlotData[] {
  let optimizedData = [...data];

  // 外れ値の除去（オプション）
  if (config.showOutliers) {
    optimizedData = removeOutliers(optimizedData);
  }

  // データポイントの間引き（大量データ時）
  if (data.length > 1000) {
    const step = Math.ceil(data.length / 500);
    optimizedData = optimizedData.filter((_, index) => index % step === 0);
  }

  return optimizedData;
}
```

### 2. レンダリング最適化

```typescript
// メモ化による最適化
export const OptimizedScatterPlot = memo(function ScatterPlot({ 
  data, 
  config 
}: ScatterPlotProps) {
  const processedData = useMemo(() => 
    optimizeScatterPlotData(data, config), 
    [data, config]
  );

  const scales = useMemo(() => 
    createScales(processedData), 
    [processedData]
  );

  return (
    <ScatterPlot 
      data={processedData}
      scales={scales}
      config={config}
    />
  );
});
```

## アクセシビリティ対応

### 1. キーボードナビゲーション

```typescript
export function setupKeyboardNavigation(
  chartElement: HTMLElement,
  data: ScatterPlotData[]
) {
  let selectedIndex = 0;

  chartElement.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowRight':
        selectedIndex = Math.min(selectedIndex + 1, data.length - 1);
        break;
      case 'ArrowLeft':
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
      case ' ':
        onDataPointClick?.(data[selectedIndex]);
        break;
    }
    
    updateSelection(selectedIndex);
  });
}
```

### 2. スクリーンリーダー対応

```typescript
export function setupScreenReaderSupport(
  chartElement: HTMLElement,
  data: ScatterPlotData[]
) {
  // ARIA属性の設定
  chartElement.setAttribute('role', 'img');
  chartElement.setAttribute('aria-label', '散布図チャート');

  // 各データポイントにARIA属性を追加
  data.forEach((item, index) => {
    const pointElement = chartElement.querySelector(`[data-index="${index}"]`);
    if (pointElement) {
      pointElement.setAttribute('role', 'button');
      pointElement.setAttribute('tabindex', '0');
      pointElement.setAttribute('aria-label', 
        `X: ${item.x}, Y: ${item.y}`
      );
    }
  });
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/__tests__/ScatterPlot.test.tsx

describe("ScatterPlot", () => {
  const mockData: ScatterPlotData[] = [
    { x: 1, y: 2, series: "A" },
    { x: 2, y: 4, series: "A" },
    { x: 3, y: 6, series: "B" }
  ];

  it("renders chart with data", () => {
    render(<ScatterPlot data={mockData} config={defaultConfig} />);
    
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onDataPointClick = jest.fn();
    render(
      <ScatterPlot 
        data={mockData} 
        config={defaultConfig}
        onDataPointClick={onDataPointClick}
      />
    );
    
    const points = screen.getAllByRole("button");
    fireEvent.click(points[0]);
    
    expect(onDataPointClick).toHaveBeenCalledWith(mockData[0]);
  });
});
```

### 2. パフォーマンステスト

```typescript
describe("ScatterPlot Performance", () => {
  it("handles large datasets efficiently", () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      series: i % 2 === 0 ? "A" : "B"
    }));

    const startTime = performance.now();
    render(<ScatterPlot data={largeData} config={defaultConfig} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
  });
});
```

## 関連コンポーネント

- `src/components/charts/recharts/ScatterPlot.tsx`
- `src/components/charts/d3js/ScatterPlot.tsx`
- `src/infrastructure/visualization/common/scatter-plot/`

## 関連ドキュメント

- [ライブラリ選択ガイド](library-selection-guide.md)
- [Recharts実装ガイド](recharts-implementation-guide.md)
- [D3.js実装ガイド](d3js-implementation-guide.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
