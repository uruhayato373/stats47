---
title: 折れ線グラフ仕様
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/visualization
  - specifications
---

# 折れ線グラフ仕様

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: 折れ線グラフ可視化機能

---

## 概要

時系列データや連続データを線で結んで表示するチャート。時間の経過に伴う変化や傾向を視覚的に表現するのに最適です。

## 実装ライブラリ

### Recharts版（推奨）
**用途**: 標準的な時系列表示・ダッシュボード

**特徴**:
- 迅速な実装
- レスポンシブ対応
- 複数系列の比較
- 標準的なインタラクション

### D3.js版
**用途**: 高度な時系列分析・詳細ページ

**特徴**:
- ブラシ選択による期間絞り込み
- ズーム機能
- カスタムアニメーション
- 大量データ対応

## 主要機能

### 1. 基本表示
- **単一系列**: 一つのデータ系列の時系列表示
- **複数系列**: 複数のデータ系列を同時表示
- **エリアチャート**: 線の下を塗りつぶした表示
- **スプライン**: 滑らかな曲線表示

### 2. インタラクション
- **ホバー効果**: マウスオーバー時の詳細表示
- **クリック操作**: データポイント選択・詳細表示
- **ズーム・パン**: 期間の拡大・移動
- **ブラシ選択**: 期間範囲の選択

### 3. カスタマイズ
- **線のスタイル**: 太さ・色・点線・実線
- **マーカー**: データポイントの表示・非表示
- **アニメーション**: 描画・更新時のアニメーション
- **グリッド**: 背景グリッドの表示制御

## データ構造

### 入力データ

```typescript
interface LineChartData {
  time: string | number;      // 時間軸（日付文字列または数値）
  value: number;              // データ値
  series?: string;            // 系列名（複数系列用）
  metadata?: {                // メタデータ
    unit?: string;
    category?: string;
    [key: string]: any;
  };
}

interface LineChartConfig {
  showMarkers: boolean;       // マーカー表示
  showArea: boolean;          // エリア表示
  smooth: boolean;            // スプライン表示
  showGrid: boolean;          // グリッド表示
  showLegend: boolean;        // 凡例表示
  animation: boolean;         // アニメーション有効
  colorScheme: string;        // カラースキーム
  timeFormat: string;         // 時間フォーマット
  valueFormat: string;        // 値フォーマット
}
```

## コンポーネント設計

### 1. Recharts版

```typescript
// src/components/charts/recharts/LineChart.tsx

interface RechartsLineChartProps {
  data: LineChartData[];
  config: LineChartConfig;
  width?: number;
  height?: number;
  onDataPointClick?: (data: LineChartData) => void;
  onDataPointHover?: (data: LineChartData | null) => void;
  className?: string;
}

export function RechartsLineChart({
  data,
  config,
  width = 600,
  height = 400,
  onDataPointClick,
  onDataPointHover,
  className
}: RechartsLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey="time"
          type="category"
          scale="point"
          tickFormatter={(value) => formatTime(value, config.timeFormat)}
        />
        <YAxis 
          tickFormatter={(value) => formatValue(value, config.valueFormat)}
        />
        <Tooltip 
          content={<CustomTooltip />}
          labelFormatter={(label) => formatTime(label, config.timeFormat)}
        />
        {config.showLegend && <Legend />}
        <Line
          type={config.smooth ? "monotone" : "linear"}
          dataKey="value"
          stroke="#8884d8"
          strokeWidth={2}
          dot={config.showMarkers}
          activeDot={{ r: 6 }}
          onClick={onDataPointClick}
          onMouseOver={onDataPointHover}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 2. D3.js版

```typescript
// src/components/charts/d3js/LineChart.tsx

interface D3LineChartProps {
  data: LineChartData[];
  config: LineChartConfig;
  width?: number;
  height?: number;
  onDataPointClick?: (data: LineChartData) => void;
  onDataPointHover?: (data: LineChartData | null) => void;
  className?: string;
}

export function D3LineChart({
  data,
  config,
  width = 600,
  height = 400,
  onDataPointClick,
  onDataPointHover,
  className
}: D3LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // スケール設定
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.time)) as [Date, Date])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.value) as [number, number])
      .range([height, 0]);

    // 線生成器
    const line = d3.line<LineChartData>()
      .x(d => xScale(new Date(d.time)))
      .y(d => yScale(d.value))
      .curve(config.smooth ? d3.curveMonotoneX : d3.curveLinear);

    // 線を描画
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#8884d8")
      .attr("stroke-width", 2)
      .attr("d", line);

    // マーカーを描画
    if (config.showMarkers) {
      svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(new Date(d.time)))
        .attr("cy", d => yScale(d.value))
        .attr("r", 4)
        .attr("fill", "#8884d8")
        .on("click", (event, d) => onDataPointClick?.(d))
        .on("mouseover", (event, d) => onDataPointHover?.(d))
        .on("mouseout", () => onDataPointHover?.(null));
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

#### 1. ダッシュボードでの時系列表示
```typescript
// シンプルな時系列表示
<RechartsLineChart 
  data={timeSeriesData}
  config={{
    showMarkers: true,
    showGrid: true,
    smooth: true,
    animation: true
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
// 複数指標の比較
<RechartsLineChart 
  data={multiSeriesData}
  config={{
    showMarkers: false,
    showLegend: true,
    smooth: true
  }}
/>
```

#### 3. エリアチャート
```typescript
// エリアチャート表示
<RechartsAreaChart 
  data={areaData}
  config={{
    showArea: true,
    showMarkers: false,
    smooth: true
  }}
/>
```

### D3.js版を選択すべきケース

#### 1. 詳細な時系列分析
```typescript
// ブラシ選択付き詳細分析
<D3LineChart 
  data={detailedTimeSeriesData}
  config={{
    showMarkers: true,
    showGrid: true,
    smooth: true,
    brushSelection: true,
    zoom: true
  }}
  onDataPointClick={handleDetailAnalysis}
/>
```

**特徴**:
- ブラシ選択による期間絞り込み
- ズーム機能
- カスタムアニメーション
- 大量データ対応

#### 2. インタラクティブな時系列
```typescript
// 高度なインタラクション
<D3LineChart 
  data={interactiveData}
  config={{
    showMarkers: true,
    animation: true,
    customTooltip: true
  }}
  onDataPointHover={showDetailedTooltip}
/>
```

#### 3. リアルタイムデータ
```typescript
// リアルタイム更新
<D3LineChart 
  data={realtimeData}
  config={{
    showMarkers: true,
    animation: true,
    realtime: true
  }}
/>
```

## パフォーマンス最適化

### 1. データ最適化

```typescript
// 大量データの最適化
export function optimizeLineChartData(
  data: LineChartData[],
  config: LineChartConfig
): LineChartData[] {
  let optimizedData = [...data];

  // 時間順ソート
  optimizedData.sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );

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
export const OptimizedLineChart = memo(function LineChart({ 
  data, 
  config 
}: LineChartProps) {
  const processedData = useMemo(() => 
    optimizeLineChartData(data, config), 
    [data, config]
  );

  const timeScale = useMemo(() => 
    createTimeScale(processedData), 
    [processedData]
  );

  return (
    <LineChart 
      data={processedData}
      timeScale={timeScale}
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
  data: LineChartData[]
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
  data: LineChartData[]
) {
  // ARIA属性の設定
  chartElement.setAttribute('role', 'img');
  chartElement.setAttribute('aria-label', '時系列データチャート');

  // 各データポイントにARIA属性を追加
  data.forEach((item, index) => {
    const pointElement = chartElement.querySelector(`[data-index="${index}"]`);
    if (pointElement) {
      pointElement.setAttribute('role', 'button');
      pointElement.setAttribute('tabindex', '0');
      pointElement.setAttribute('aria-label', 
        `${formatTime(item.time)}: ${item.value}`
      );
    }
  });
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/__tests__/LineChart.test.tsx

describe("LineChart", () => {
  const mockData: LineChartData[] = [
    { time: "2023-01-01", value: 100 },
    { time: "2023-01-02", value: 150 },
    { time: "2023-01-03", value: 120 }
  ];

  it("renders chart with data", () => {
    render(<LineChart data={mockData} config={defaultConfig} />);
    
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const onDataPointClick = jest.fn();
    render(
      <LineChart 
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
describe("LineChart Performance", () => {
  it("handles large datasets efficiently", () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      time: new Date(2023, 0, i + 1).toISOString(),
      value: Math.random() * 1000
    }));

    const startTime = performance.now();
    render(<LineChart data={largeData} config={defaultConfig} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
  });
});
```

## 関連コンポーネント

- `src/components/charts/recharts/LineChart.tsx`
- `src/components/charts/d3js/LineChart.tsx`
- `src/lib/visualization/common/line-chart/`

## 関連ドキュメント

- [ライブラリ選択ガイド](library-selection-guide.md)
- [Recharts実装ガイド](recharts-implementation-guide.md)
- [D3.js実装ガイド](d3js-implementation-guide.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
