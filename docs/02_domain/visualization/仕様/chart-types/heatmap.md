# ヒートマップ仕様

**作成日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: ヒートマップ可視化機能

---

## 概要

2次元のデータを色の濃淡で表現するチャート。データの密度や強度を視覚的に表現し、パターンや傾向を発見するのに最適です。

## 実装ライブラリ

### D3.js版（推奨）
**用途**: 高度なヒートマップ・詳細分析

**特徴**:
- 完全なカスタマイズ
- 複雑なインタラクション
- 大量データ対応
- カスタムアニメーション

### Recharts版
**用途**: 標準的なヒートマップ・ダッシュボード

**特徴**:
- 迅速な実装
- レスポンシブ対応
- 標準的なインタラクション
- 保守しやすい

## 主要機能

### 1. 基本表示
- **2次元ヒートマップ**: 行と列のデータを色分け表示
- **時系列ヒートマップ**: 時間軸を含む3次元データ
- **地理的ヒートマップ**: 地図上での密度表示
- **相関ヒートマップ**: 相関行列の可視化

### 2. インタラクション
- **ホバー効果**: マウスオーバー時の詳細表示
- **クリック操作**: セル選択・詳細表示
- **ズーム・パン**: 表示範囲の拡大・移動
- **ブラシ選択**: 範囲選択によるフィルタリング

### 3. カスタマイズ
- **カラースキーム**: 複数の色パレット選択
- **分岐点設定**: 色の分岐点（ゼロ、平均、中央値）
- **ラベル表示**: 行・列ラベルの表示制御
- **アニメーション**: データ更新時のアニメーション

## データ構造

### 入力データ

```typescript
interface HeatmapData {
  row: string;               // 行の識別子
  column: string;            // 列の識別子
  value: number;             // データ値
  metadata?: {               // メタデータ
    rowLabel?: string;
    columnLabel?: string;
    unit?: string;
    [key: string]: any;
  };
}

interface HeatmapConfig {
  colorScheme: string;         // カラースキーム
  divergingMidpoint: 'zero' | 'mean' | 'median' | number;
  showLabels: boolean;         // ラベル表示
  showValues: boolean;         // 値の表示
  showLegend: boolean;         // 凡例表示
  animation: boolean;          // アニメーション有効
  cellSize: number;           // セルサイズ
  margin: {                   // マージン
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

## コンポーネント設計

### 1. D3.js版

```typescript
// src/components/charts/d3js/Heatmap.tsx

interface D3HeatmapProps {
  data: HeatmapData[];
  config: HeatmapConfig;
  width?: number;
  height?: number;
  onCellClick?: (data: HeatmapData) => void;
  onCellHover?: (data: HeatmapData | null) => void;
  className?: string;
}

export function D3Heatmap({
  data,
  config,
  width = 600,
  height = 400,
  onCellClick,
  onCellHover,
  className
}: D3HeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // 行・列の一意な値を取得
    const rows = [...new Set(data.map(d => d.row))];
    const columns = [...new Set(data.map(d => d.column))];
    
    // スケール設定
    const xScale = d3.scaleBand()
      .domain(columns)
      .range([0, width - config.margin.left - config.margin.right])
      .padding(0.05);
    
    const yScale = d3.scaleBand()
      .domain(rows)
      .range([0, height - config.margin.top - config.margin.bottom])
      .padding(0.05);

    // 色スケール
    const colorScale = d3.scaleSequential()
      .domain(d3.extent(data, d => d.value) as [number, number])
      .interpolator(d3.interpolateRgb("#ffffff", "#ff0000"));

    // セルを描画
    svg.selectAll(".cell")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.column) || 0)
      .attr("y", d => yScale(d.row) || 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", (event, d) => onCellClick?.(d))
      .on("mouseover", (event, d) => onCellHover?.(d))
      .on("mouseout", () => onCellHover?.(null));

    // ラベルを描画
    if (config.showLabels) {
      // X軸ラベル
      svg.selectAll(".x-label")
        .data(columns)
        .enter()
        .append("text")
        .attr("class", "x-label")
        .attr("x", d => (xScale(d) || 0) + xScale.bandwidth() / 2)
        .attr("y", height - config.margin.bottom + 20)
        .attr("text-anchor", "middle")
        .text(d => d);

      // Y軸ラベル
      svg.selectAll(".y-label")
        .data(rows)
        .enter()
        .append("text")
        .attr("class", "y-label")
        .attr("x", config.margin.left - 10)
        .attr("y", d => (yScale(d) || 0) + yScale.bandwidth() / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .text(d => d);
    }

    // 値の表示
    if (config.showValues) {
      svg.selectAll(".value-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", d => (xScale(d.column) || 0) + xScale.bandwidth() / 2)
        .attr("y", d => (yScale(d.row) || 0) + yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "10px")
        .attr("fill", d => d.value > (d3.max(data, x => x.value) || 0) / 2 ? "#fff" : "#000")
        .text(d => d.value.toFixed(1));
    }

    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, config, width, height, onCellClick, onCellHover]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

### 2. Recharts版

```typescript
// src/components/charts/recharts/Heatmap.tsx

interface RechartsHeatmapProps {
  data: HeatmapData[];
  config: HeatmapConfig;
  width?: number;
  height?: number;
  onCellClick?: (data: HeatmapData) => void;
  onCellHover?: (data: HeatmapData | null) => void;
  className?: string;
}

export function RechartsHeatmap({
  data,
  config,
  width = 600,
  height = 400,
  onCellClick,
  onCellHover,
  className
}: RechartsHeatmapProps) {
  // データをRecharts形式に変換
  const chartData = useMemo(() => {
    const rows = [...new Set(data.map(d => d.row))];
    const columns = [...new Set(data.map(d => d.column))];
    
    return rows.map(row => {
      const rowData: any = { row };
      columns.forEach(column => {
        const cellData = data.find(d => d.row === row && d.column === column);
        rowData[column] = cellData?.value || 0;
      });
      return rowData;
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <div className="heatmap-container">
        {/* カスタムヒートマップ実装 */}
        <div className="heatmap-grid">
          {data.map((cell, index) => (
            <div
              key={index}
              className="heatmap-cell"
              style={{
                backgroundColor: getCellColor(cell.value, data),
                width: config.cellSize,
                height: config.cellSize
              }}
              onClick={() => onCellClick?.(cell)}
              onMouseOver={() => onCellHover?.(cell)}
              onMouseOut={() => onCellHover?.(null)}
            >
              {config.showValues && (
                <span className="cell-value">{cell.value.toFixed(1)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </ResponsiveContainer>
  );
}
```

## 使い分けガイド

### D3.js版を選択すべきケース

#### 1. 高度なヒートマップ分析
```typescript
// 複雑なインタラクション付きヒートマップ
<D3Heatmap 
  data={complexHeatmapData}
  config={{
    colorScheme: 'viridis',
    divergingMidpoint: 'mean',
    showLabels: true,
    showValues: true,
    animation: true
  }}
  onCellClick={handleCellAnalysis}
  onCellHover={showDetailedTooltip}
/>
```

**特徴**:
- 完全なカスタマイズ
- 複雑なインタラクション
- 大量データ対応
- カスタムアニメーション

#### 2. 時系列ヒートマップ
```typescript
// 時系列データのヒートマップ
<D3Heatmap 
  data={timeSeriesHeatmapData}
  config={{
    colorScheme: 'plasma',
    showLabels: true,
    animation: true,
    timeAxis: true
  }}
/>
```

### Recharts版を選択すべきケース

#### 1. ダッシュボードでの標準表示
```typescript
// シンプルなヒートマップ
<RechartsHeatmap 
  data={simpleHeatmapData}
  config={{
    colorScheme: 'blues',
    showLabels: true,
    showValues: false
  }}
/>
```

**特徴**:
- 迅速な実装
- 標準的な表示
- レスポンシブ対応
- 保守しやすい

#### 2. 相関行列の表示
```typescript
// 相関行列のヒートマップ
<RechartsHeatmap 
  data={correlationMatrixData}
  config={{
    colorScheme: 'rdylbu',
    divergingMidpoint: 'zero',
    showLabels: true,
    showValues: true
  }}
/>
```

## パフォーマンス最適化

### 1. データ最適化

```typescript
// 大量データの最適化
export function optimizeHeatmapData(
  data: HeatmapData[],
  config: HeatmapConfig
): HeatmapData[] {
  let optimizedData = [...data];

  // 値の正規化
  const values = data.map(d => d.value);
  const min = d3.min(values) || 0;
  const max = d3.max(values) || 0;
  
  optimizedData = optimizedData.map(d => ({
    ...d,
    normalizedValue: (d.value - min) / (max - min)
  }));

  // セルサイズに応じたデータ間引き
  if (data.length > 10000) {
    const step = Math.ceil(data.length / 5000);
    optimizedData = optimizedData.filter((_, index) => index % step === 0);
  }

  return optimizedData;
}
```

### 2. レンダリング最適化

```typescript
// メモ化による最適化
export const OptimizedHeatmap = memo(function Heatmap({ 
  data, 
  config 
}: HeatmapProps) {
  const processedData = useMemo(() => 
    optimizeHeatmapData(data, config), 
    [data, config]
  );

  const colorScale = useMemo(() => 
    createColorScale(processedData, config.colorScheme), 
    [processedData, config.colorScheme]
  );

  return (
    <Heatmap 
      data={processedData}
      colorScale={colorScale}
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
  data: HeatmapData[]
) {
  let selectedIndex = 0;

  chartElement.addEventListener('keydown', (event) => {
    const rows = [...new Set(data.map(d => d.row))];
    const columns = [...new Set(data.map(d => d.column))];
    
    switch (event.key) {
      case 'ArrowRight':
        selectedIndex = Math.min(selectedIndex + 1, data.length - 1);
        break;
      case 'ArrowLeft':
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'ArrowDown':
        // 次の行へ移動
        break;
      case 'ArrowUp':
        // 前の行へ移動
        break;
      case 'Enter':
      case ' ':
        onCellClick?.(data[selectedIndex]);
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
  data: HeatmapData[]
) {
  // ARIA属性の設定
  chartElement.setAttribute('role', 'img');
  chartElement.setAttribute('aria-label', 'ヒートマップチャート');

  // 各セルにARIA属性を追加
  data.forEach((item, index) => {
    const cellElement = chartElement.querySelector(`[data-index="${index}"]`);
    if (cellElement) {
      cellElement.setAttribute('role', 'button');
      cellElement.setAttribute('tabindex', '0');
      cellElement.setAttribute('aria-label', 
        `${item.row}と${item.column}の交差: ${item.value}`
      );
    }
  });
}
```

## テスト戦略

### 1. 単体テスト

```typescript
// src/components/charts/__tests__/Heatmap.test.tsx

describe("Heatmap", () => {
  const mockData: HeatmapData[] = [
    { row: "A", column: "X", value: 1 },
    { row: "A", column: "Y", value: 2 },
    { row: "B", column: "X", value: 3 },
    { row: "B", column: "Y", value: 4 }
  ];

  it("renders chart with data", () => {
    render(<Heatmap data={mockData} config={defaultConfig} />);
    
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("handles cell click events", () => {
    const onCellClick = jest.fn();
    render(
      <Heatmap 
        data={mockData} 
        config={defaultConfig}
        onCellClick={onCellClick}
      />
    );
    
    const cells = screen.getAllByRole("button");
    fireEvent.click(cells[0]);
    
    expect(onCellClick).toHaveBeenCalledWith(mockData[0]);
  });
});
```

### 2. パフォーマンステスト

```typescript
describe("Heatmap Performance", () => {
  it("handles large datasets efficiently", () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      row: `Row${Math.floor(i / 10)}`,
      column: `Col${i % 10}`,
      value: Math.random() * 100
    }));

    const startTime = performance.now();
    render(<Heatmap data={largeData} config={defaultConfig} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
  });
});
```

## 関連コンポーネント

- `src/components/charts/d3js/Heatmap.tsx`
- `src/components/charts/recharts/Heatmap.tsx`
- `src/lib/visualization/common/heatmap/`

## 関連ドキュメント

- [ライブラリ選択ガイド](../library-selection-guide.md)
- [D3.js実装ガイド](../d3js-implementation-guide.md)
- [Recharts実装ガイド](../recharts-implementation-guide.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
